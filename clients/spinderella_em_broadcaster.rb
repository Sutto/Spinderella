require 'eventmachine'
require 'json' unless {}.respond_to?(:to_json)

# TODO: Rewrite using the standard implementations provided by perennial
module Spinderella
  class EMBroadcasterClient < EM::Connection
    
    SEPERATOR = "\r\n".freeze
    
    def self.connect(host = "localhost", port = 42341, &blk)
      EM.connect(host, port, self, host, port, &blk)
    end
    
    def initialize(host, port)
      @host = host
      @port = port
      @buffer = BufferedTokenizer.new(SEPERATOR)
      @authenticated = nil
      @last_auth_token = nil
      @authenticated_callbacks = []
      @disconnect_expected = false
    end
    
    def receive_data(d)
      @buffer.extract(d).each { |c| handle_response(c) }
    end
    
    def authenticate(token)
      perform_action :authenticate, :token => token
      @last_auth_token = token
    end
    
    def authenticated?
      @authenticated
    end
    
    def unbind
      EM.add_timer(5) { reconnect(@host, @port) } if !@disconnect_expected && EM.reactor_running?
    end
    
    def post_init
      authenticated(@last_auth_token) unless @last_auth_token.nil?
    end
    
    def stop
      @disconnect_expected = true
      close_connection_after_writing
    end
  
    def broadcast_to_all(message)
      on_authentication do
        perform_action :broadcast, "type" => "all", "message" => message.to_s
      end
    end
  
    def broadcast_to_users(message, users)
      on_authentication do
        perform_action :broadcast, "type" => "users", "message" => message.to_s,
          "users" => Array(users).map { |u| u.to_s }
      end
    end
  
    def broadcast_to_channels(message, channels)
      on_authentication do
        perform_action :broadcast, "type" => "channels", "message" => message.to_s,
          "channels" => Array(channels).map { |c| c.to_s }
      end
    end
  
    def broadcast_to_channel(message, channel)
      on_authentication do
        perform_action :broadcast, "type" => "channel", "message" => message.to_s, "channel" => channel.to_s
      end
    end
    
    protected
    
    def perform_action(name, data = {})
      raw_json = JSON.dump({
        "action"  => name.to_s,
        "payload" => data
      })
      send_data "#{raw_json}#{SEPERATOR}"
    end
    
    def handle_response(res)
      parsed = JSON.parse(res)
      return unless parsed.is_a?(Hash)
      action = parsed["action"]
      data   = parsed["payload"] || {}
      handle_action(action, data)
    rescue JSON::ParserError
    end
    
    def handle_action(action, data)
      case action
      when "authenticated"
        @authenticated = true
        @authenticated_callbacks.each { |c| c.call }
        @authenticated_callbacks = []
      when "authentication_failed"
        @authenticated = false
      end
    end
    
    def on_authentication(&blk)
      if authenticated?
        blk.call
      else
        @authenticated_callbacks << blk
      end
      return nil
    end
    
  end
end