module Spinderella
  class Receiver
    
    AUTH_TOKEN = "AWESOMESAUCE"
    
    on_action :broadcast do |data|
      broadcast(data["message"], data["type"], data) if authenticated? && data["message"].present?
    end
    
    on_action :authenticate do |data|
      authenticate! if data["token"] == AUTH_TOKEN
    end
    
    def authenticated?
      @authenticated ||= false
    end
    
    def authenticate!
      @authenticated = true
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
    end
    
    protected
    
    def publish_to_all(message)
      User.push_to_all(message)
    end
    
    def publish_to_users(users, message)
      return if users.blank?
      users = Array(users).map { |u| User[u.to_s] }.compact.uniq
      Spinderella::Publisher.publish(users, message, :type => "user")
    end
    
    def publish_to_channel(channel, message)
      return if channel.blank?
      if Channel.exists?(channel)
        Channel[channel].publish(message)
      end
    end
    
    def publish_to_channels(channels, message)
      return if channels.blank?
      Channel.publish(channels, message)
    end
    
  end
end