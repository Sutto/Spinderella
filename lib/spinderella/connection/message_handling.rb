module Spinderella
  class Connection
    # Extracts out the non-transport dependent parts of the
    # spinderella protocol to make it possible to use pretty
    # much anywhere (e.g. WebSocket, native protocol).
    module MessageHandling
      
      def self.included(parent)
        parent.class_eval do
          class_inheritable_accessor :actions
          self.actions = {}
          include InstanceMethods
          extend  ClassMethods
        end
      end
      
      module ClassMethods
        def on_action(name, &blk)
          method_name = :"handle_action_#{name}"
          self.actions[name.to_s] = method_name
          define_method(method_name, &blk)
        end
      end
      
      module InstanceMethods
        def handle_action(name, data)
          method_name = self.actions[name]
          # If there is an unknown action, return an error
          unless method_name.present? && respond_to?(method_name)
            perform_action :unknown_action, :action_name => name
            return
          end
          begin
            send(method_name, data) 
          rescue Exception => e
            logger.error "Exception #{e.class.name} processing action (#{name}):"
            logger.error "Message: #{e.message}"
            logger.error "Backtrace:"
            e.backtrace.each { |line| logger.error "--> #{line}" }
            perform_action :exception, :name => e.class.name, :message => e.message
          end
        end
    
        def perform_action(name, data = {})
          send_message(Yajl::Encoder.encode({
            "action"  => name.to_s,
            "payload" => data.stringify_keys
          }))
        end
      
        protected

        def receive_message(message)
          logger.debug "<< #{message.strip}"
          processed = Yajl::Parser.parse(message)
          return unless processed.is_a?(Hash)
          action, data = processed["action"], processed["payload"]
          data ||= {}
          return unless action.is_a?(String) || data.is_a?(Hash)
          handle_action(action, data)
        rescue Yajl::ParseError => e
          logger.warn "Error parsing incoming message"
        end
      end
      
    end
  end
end