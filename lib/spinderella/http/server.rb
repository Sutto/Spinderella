require 'em-websocket-server'
module Spinderella
  module Http
    class Server < WebSocketServer
      
      is :loggable
      
      def on_connect
        logger.debug "WebSocket connection initiated."
        @user = Spinderella::User.new(self)
        logger.debug "Created user with signature hash #{@user.signature.hash.to_s(16)}"
      end
      
      def on_disconnect
        logger.debug "Lost client connection on websocket"
        if user?
          @user.cleanup
          @user = nil
        end
      end
      
      def on_receive(message)
        receive_message(message)
      end
      
      def user?
        @user.present?
      end
      
      # Include the message handling part of connections
      require 'spinderella/connection/message_handling'
      include Spinderella::Connection::MessageHandling
      
      def self.start(opts = {})
        real_opts = Spinderella::Settings.subscriber_server ||= Spinderella::Nash.new
        real_opts.host ||= "0.0.0.0"
        real_opts.websocket_port ||= 42342
        real_opts.merge!(opts)
        host = real_opts.host.to_s
        port = real_opts.websocket_port.to_i
        EventMachine.start_server(host, port, self, opts)
        logger.info "Serving Spinderella WebSocket clients on #{host}:#{port}"
      end
      
    end
  end
end