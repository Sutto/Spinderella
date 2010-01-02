require 'json' unless defined?(JSON)
require 'socket'

# TODO: Rewrite using the standard implementations provided by perennial
module Spinderella
  module Client
    class Error < StandardError; end
    class Unavailable < Error; end
    module Protocol
      SEPERATOR        = "\r\n".freeze
      SEPERATOR_REGEXP = /#{Regexp.escape(SEPERATOR)}$/.freeze
      
      def self.included(parent)
        parent.class_eval do
          @@actions = {}

          def self.on_event(name, blk)
            @@actions[name.to_s] = blk
          end
        end
      end
      
      def receive_data(data)
        @buffer ||= ""
        @buffer << message
        parts = buffer.split(SEPERATOR)
        @buffer = parts.pop if @buffer !~ SEPERATOR_REGEXP
        parts.each { |part| receive_message(part) }
      end
      
      def receive_message(message)
        attributes = JSON.parse(message)
        action, data = attributes["action"], attributes["data"]
        data = {} unless data.is_a?(Hash)
        handle_action(action, data) unless action.to_s.strip.empty?
      rescue Exception => e
        # There was an error parsing the json most likely.
      end
      
      def handle_action(name, data)
        handler = @@actions[name.to_s]
        @last_action = name.to_s
        handler.call(data) if !handler.nil?
      end
      
      def perform_action(action, options = {})
        send_data(JSON.dump({
          "action" => action.to_s,
          "data"   => options
        })
      end
      
    end
    
    class Broadcaster
      include Protocol
      
      def initialize(host, port = 42341)
        @host = host
        @port = port
        @authenticated = false
        @connection = nil
        @write_queue = []
      end
      
      def authenticate(token)
        perform_action :authenticate, :token => token
        last_action = read_response_with_action
        @authenticate = (last_action == "authenticated")
      end
      
      def authenticated?
        @authenticated
      end
      
      
      
      protected
      
      def connection
        @connection ||= TCPSocket.new(@host, @port)
      rescue
        raise Unavailable, "The Spinderella server at #{@host}:#{@port} is currently unavailable"
      end
      
      def send_data(d)
      end
      
      def read_response(count = 0)
        r, w, e = select([connection], [], [connection], 0.0001).map { |v| Array(v) }
        if !e.empty?
          raise Unavailable, "The Spinderella server at #{@host}:#{@port} is currently unavailable" if count > 3
          @connection = nil
          read_response(count + 1)
        elsif !r.empty?
          receive_data(r.read)
        end
      end
      
      def send_data(d)
        connection.write(d)
      end
      
      def read_response_with_action(&blk)
        @last_action = nil
        read_response
        @last_action
      end
      
    end
    
  end
end