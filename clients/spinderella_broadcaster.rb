require 'socket'
require 'json' unless {}.respond_to?(:to_json)

module Spinderella
  class BroadcasterClient
    SEPERATOR = "\r\n".freeze
  
    def initialize(host = "localhost", port = 42341, options = {}, &blk)
      @host             = host.to_s
      @port             = port.to_i
      @options          = options
      @connection       = nil
      @connection_queue = []
      self.connection # Access the connection
      unless blk.nil?
        blk.arity > 0 ? blk.call(self) : instance_eval(&blk)
        close
      end
    end
    
    def authenticated?
      @authenticated ||= false
    end
  
    def authenticate(token)
      return false unless readable?
      perform_action :authenticate, :token => token
      action, data = read_response
      if action == "authenticated"
        @authenticated   = true
        @options[:token] = token
        return true
      end
      false
    end
  
    def broadcast_to_all(message)
      return false unless @authenticated
      perform_action :broadcast, "type" => "all", "message" => message.to_s
      true
    end
  
    def broadcast_to_users(message, users)
      return false unless @authenticated
      perform_action :broadcast, "type" => "users", "message" => message.to_s,
        "users" => Array(users).map { |u| u.to_s }
      true
    end
  
    def broadcast_to_channels(message, channels)
      return false unless @authenticated
      perform_action :broadcast, "type" => "channels", "message" => message.to_s,
        "channels" => Array(channels).map { |c| c.to_s }
      true
    end
  
    def broadcast_to_channel(message, channel)
      return false unless @authenticated
      perform_action :broadcast, "type" => "channel", "message" => message.to_s, "channel" => channel.to_s
      true
    end
  
    def close
      connection = self.connection
      if connection.nil?
        connection.close 
        @connection = nil
        true
      end
    end
  
    def readable?
      return false if @connection.nil?
      readable, _, _ = select([@connection], [], [], 0.0001)
      return true if Array(readable).empty?
      @connection.read
      true
    rescue SystemCallError
      false
    end
    
    def connection
      @connection ||= create_connection
    end
    
    protected
  
    def perform_action(name, data = {})
      raw_message = JSON.dump({
        "action" => name.to_s,
        "data"   => data
      })
      raw_message << SEPERATOR
      connection = self.connection
      if connection && readable?
        connection.write(raw_message)
      else
        store_message(raw_message)
      end
    end
  
    def read_response
      return unless readable?
      read_raw_response
    end
    
    def create_connection
      @authenticated = false
      @connection    = nil
      socket = TCPSocket.new(@host, @port)
      if @options[:token]
        send_raw_authentication(@options[:token], socket)
        a, _ = read_raw_response(socket)
        @authenticated = (a == "authenticated")
      end
      empty_connection_queue
      socket
    rescue SystemCallError
      @connection = nil
      @authenticated = false
    end
    
    def check_socket_alive
      @connection.read if readable?
      nil
    rescue SystemCallError
      @connection = nil
    end
    
    def store_message(message)
      @connection = nil
      return if @options[:skip_queue]
      @connection_queue << message
      false
    end
    
    def send_raw_authentication(token, socket)
      raw = JSON.dump({
        "action" => "authenticate",
        "data"   => {"token" => token}
      })
      raw << SEPERATOR
      socket.write(raw)
    end
    
    def read_raw_response(socket)
      res = JSON.parse(socket.gets.strip)
      if res.is_a?(Hash)
        data = res["data"] || {}
        return res["action"], data
      end
    rescue JSON::ParserError
      nil
    end
    
    def empty_connection_queue
      return unless @options[:skip_queue] && !@connection_queue.empty?
      @connection_queue.each { |c| socket.write(c) }
      @connection_queue = []
    end
    
  end
end