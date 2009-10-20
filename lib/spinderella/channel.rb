module Spinderella
  class Channel
    @@channel_mapping = {}

    def self.register_channel(channel)
      @@channel_mapping[channel.name] = channel
    end
    
    def self.remove_channel(channel)
      @@channel_mapping.delete(channel.name)
    end
    
    def self.[](name)
      @@channel_mapping[name] ||= self.new(name)
    end
    
    def self.exists?(name)
      @@channel_mapping.has_key?(name)
    end
    
    def self.publish(channels, message)
      logger.debug "Publishing message #{message.inspect} to channels #{channels.inspect}"
      users = Array(channels).map { |c| exists?(c.to_s) ? self[c.to_s].clients.values : [] }.flatten.uniq
      Spinderella::Publisher.publish(users, message, :type => "channels", :channels => channels)
    end

    attr_reader :name

    def initialize(name)
      @name = name
      @clients = {}
      self.class.register_channel(self)
    end
    
    def subscribed?(u)
      @clients.has_key?(u.signature)
    end
    
    def publish(message)
      logger.debug "Publishing #{message.inspect} directly to #{self.name}"
      Spinderella::Publisher.publish(@clients.values, message, :type => "channel", :channel => self.name)
    end
    
    def subscribe(user)
      @clients[user.signature] = user
    end
    
    def unsubscribe(user)
      @clients.delete(user.signature)
      self.class.remove_channel(self) if empty?
    end
    
    def empty?
      @clients.empty?
    end
    
    def each_client(&blk)
      @clients.each_value(&blk)
    end
   
  end
end