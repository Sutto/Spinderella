module Spinderella
  class Server < Connection
    
    FLASH_POLICY_REQUEST  = "<policy-file-request/>".freeze
    FLASH_POLICY_RESPONSE = "<cross-domain-policy><allow-access-from domain='*' to-ports='SPINDERELLA-PORT' /></cross-domain-policy>".freeze
    
    on_action :subscribe do |data|
      return unless user?
      Array(data["channels"]).each { |channel| @user.subscribe_to(channel.to_s) }
    end
    
    on_action :unsubscribe do |data|
      return unless user?
      Array(data["channels"]).each { |channel| @user.unsubscribe_from(channel.to_s) }
    end
    
    on_action :identify do |data|
      return unless user?
      identifier = data["identifier"]
      @user.identifier = identifier.to_s if identifier.present?
    end
    
    on_action :pong do |data|
      return unless user?
      @user.pong
    end
    
    on_action :channels do |data|
      return unless user?
      perform_action "channels", :channels => @user.channels.keys
    end
    
    attr_reader :user
    
    def initialize(*args)
      super
      @options = args.last.is_a?(Spinderella::Nash) ? args.pop : Spinderella::Nash.new
      @user = nil
      @awaiting_policy_file_request = true
    end
    
    def post_init
      logger.debug "Connection initiated."
      @user ||= User.new(self)
      logger.debug "Created user with signature hash #{@user.signature.hash.to_s(16)}"
    end
    
    def unbind
      logger.debug "Lost connection"
      if @user.present?
        @user.cleanup
        @user = nil
      end
    end
    
    def receive_data(data)
      if !@awaiting_policy_file_request
        if data.include?(FLASH_POLICY_REQUEST)
          logger.debug "Got flash policy request, sending policy response."
          send_data FLASH_POLICY_RESPONSE.gsub('SPINDERELLA-PORT', @options.port)
          close_connection_after_writing
          return
        end
        @awaiting_policy_file_request = false
      end
      super
    end
    
    def user?
      @user.present?
    end
    
    class << self
      
      def run
        logger.info "Starting Spinderella Server"
        EM.run do
          # Start Event Loop
          self.start
          Receiver.start
          ping_every = (Spinderella::Settings.subscriber_server.ping_every ||= 30).to_i
          EM.add_periodic_timer(ping_every) { User.ping_all }
        end
      end
      
      def start(opts = {})
        real_opts = Spinderella::Settings.subscriber_server ||= Spinderella::Nash.new
        real_opts.host ||= "0.0.0.0"
        real_opts.port ||= 42340
        real_opts.merge!(opts)
        host = real_opts.host.to_s
        port = real_opts.port.to_i
        EventMachine.start_server(host, port, self, opts)
        logger.info "Serving Spinderella clients on #{host}:#{port}"
      end
      
      def stop
        logger.info "Stopping Spinderella Server"
        EM.stop_event_loop if EM.reactor_running?
      end
      
    end
    
  end
end