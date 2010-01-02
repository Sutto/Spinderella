module Spinderella
  class Server
    module DefaultActions
      
      def self.included(parent)
        parent.class_eval do
          
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
            message "channels", :channels => @user.channels.keys
          end
          
        end
      end
      
    end
  end
end