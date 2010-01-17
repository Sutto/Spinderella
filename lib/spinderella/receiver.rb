module Spinderella
  class Receiver < Connection
    
    attr_reader :options
    
    def initialize(*args)
      super
      @options = args.last.is_a?(Spinderella::Nash) ? args.pop : Spinderella::Nash.new
      @user = nil
    end
    
    on_action :broadcast do |data|
      if authenticated?
        puts "broadcasting w/ #{data.inspect}"
        broadcast(data["message"], data["type"], data) if data["message"].present?
      else
        message :unauthorized
      end
    end
    
    on_action :authenticate do |data|
      logger.debug "Attempting to authenticate receive w/ token: #{data["token"].inspect} (expects #{options.auth_token.inspect})"
      if data["token"] == options.auth_token
        logger.debug "Authenticating"
        authenticate!
      else
        message :authentication_failed
      end
    end
    
    def authenticated?
      @authenticated ||= false
    end
    
    def authenticate!
      @authenticated = true
      message :authenticated
    end
    
    def broadcast(message, type = nil, data = {})
      return unless authenticated?
      type ||= "all"
      case type
      when "all"
        publish_to_all(message)
      when "users"
        publish_to_users(data["users"], message)
      when "channels"
        publish_to_channels(data["channels"], message)
      when "channel"
        publish_to_channel(data["channel"], message)
      end
    end
    
    def self.start
      opts = Spinderella::Settings.broadcaster_server ||= Spinderella::Nash.new
      opts.host ||= "127.0.0.1"
      opts.port ||= 42341
      logger.info "Starting receiver on #{opts.host}:#{opts.port}"
      EM.start_server(opts.host.to_s, opts.port.to_i, self, opts)
    end
    
    protected
    
    def publish_to_all(message)
      User.publish_to_all(message)
    end
    
    def publish_to_users(users, message)
      return if users.blank?
      users = Array(users).map { |u| User[u.to_s] }.compact.uniq
      Publisher.publish(users, message, :type => "user")
    end
    
    def publish_to_channel(channel, message)
      return if channel.blank?
      Channel[channel].publish(message) if Channel.exists?(channel)
    end
    
    def publish_to_channels(channels, message)
      return if channels.blank?
      Channel.publish(channels, message)
    end
    
  end
end