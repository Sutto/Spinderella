require 'web_socket'
module Spinderella
  module Http
    class Server < WebSocket::Server
      
      is :loggable
      
      def on_connect
        @connected = true
        logger.debug "WebSocket connection initiated."
        @user = Spinderella::User.new(self)
        logger.debug "Created user with signature hash #{@user.signature.hash.to_s(16)}"
      end
      
      def on_disconnect
        logger.debug "Lost client connection on websocket"
        if user?
          logger.debug "Cleaning up the user instance"
          @user.cleanup
          @user = nil
        end
      end
      
      def on_receive(message)
        logger.debug "<< #{message}"
        receive_message(message.strip)
      end
      
      def user?
        @user.present?
      end
      
      def send_message(data)
        logger.debug ">> #{data.strip}"
        super
      end
      
      # Include the message handling part of connections
      include Perennial::Protocols::JSONTransport::MessageHandling
      
      require 'spinderella/server/default_actions'
      include Spinderella::Server::DefaultActions
      
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
      
      protected
      
      # Noop in the WebSocket server.
      def enable_ssl
      end
      
    end
  end
end