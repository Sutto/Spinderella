require 'socket'
require 'json' unless {}.respond_to?(:to_json)

module Spinderella
  class BroadcasterClient
  
    def initialize(host = "localhost", port = 42341, &blk)
      @host = host.to_s
      @port = port.to_i
      @authenticated = false
      @socket = nil
      unless blk.nil?
        blk.arity > 0 ? blk.call(self) : instance_eval(&blk)
        close
      end
    end
  
    def authenticate(token)
      perform_action :authenticate, :token => token
      action, data = read_response
      if action == "authenticated"
        @authenticated = true
        return true
      end
      return false
    end
  
    def broadcast_to_all(message)
      return false unless @authenticated
      perform_action :broadcast, "type" => "all", "message" => message.to_s
      return true
    end
  
    def broadcast_to_users(message, users)
      return false unless @authenticated
      perform_action :broadcast, "type" => "users", "message" => message.to_s,
        "users" => Array(users).map { |u| u.to_s }
      return true
    end
  
    def broadcast_to_channels(message, channels)
      return false unless @authenticated
      perform_action :broadcast, "type" => "channels", "message" => message.to_s,
        "channels" => Array(channels).map { |c| c.to_s }
      return true
    end
  
    def broadcast_to_channel(message, channel)
      return false unless @authenticated
      perform_action :broadcast, "type" => "channel", "message" => message.to_s, "channel" => channel.to_s
      return true
    end
  
    def close
      return if @socket.nil?
      @socket.close 
      @socket = nil
    end
  
    def socket
      @socket ||= TCPSocket.new(@host, @port)
    end
  
    protected
  
    def perform_action(name, data = {})
      raw_json = JSON.dump({
        "action" => name.to_s,
        "data"   => data
      })
      socket.write("#{raw_json}\r\n")
      socket.flush
    end
  
    def read_response
      res = JSON.parse(socket.gets.strip)
      if res.is_a?(Hash)
        data = res["data"] || {}
        return res["action"], data
      end
    rescue JSON::ParserError
      nil
    end
    
  end
end