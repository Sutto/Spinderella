module Spinderella
  class User
    is :loggable
    
    @@identifier_mapping = {}
    @@users              = {}
    
    def self.[](name)
      @@identifier_mapping[name]
    end
    
    def self.exists?(name)
      @@identifier_mapping.has_key?(name)
    end
    
    def self.publish_to_all(message, meta = {})
      logger.debug "Publishing #{message.inspect} to all users"
      Publisher.publish(@@users.values, message, meta)
    end
    
    def self.each_user(&blk)
      @@users.each_value(&blk)
    end
    
    attr_reader :signature, :connection, :identifier, :ping_count, :channels
    
    def initialize(connection)
      @connection = connection
      @identifier = nil
      @channels   = {}
      @ping_count = 0
      build_signature
      @@users[@signature] = self
    end
    
    def ping
      connection.perform_action :ping
      @ping_count += 1
    end
    
    def pong
      @ping_count = 0
    end
    
    def subscribe_to(channel_name)
      logger.debug "Subscribing to channel #{channel_name}"
      @channels[channel_name] = channel = Channel[channel_name]
      channel.subscribe(self)
    end
    
    def subscribed_to?(channel_name)
      Channel[channel_name].subscribed?(self)
    end
    
    def unsubscribe_from(channel_name)
      logger.debug "Unsubscribing from channel #{channel_name}"
      if Channel.exists?(channel_name)
        channel = Channel[channel_name]
        channel.unsubscribe(self)
      end
      @channels.delete(channel_name)
    end
    
    def cleanup
      @@identifier_mapping.delete(@identifier) if @identifier.present?
      @channels.each_value { |channel| channel.unsubscribe(self) }
      @@users.delete(@signature)
    end
    
    def identifier=(value)
      raise InvalidIdentifier if value.blank? || self.exists?(value)
      @@identifier_mapping.delete(@identifier) if @identifier.present?
      @@identifier_mapping[value] = self
      @identifier = self
    end
    
    def disconnect(reason = nil)
      connection.perform_action :disconnected, :reason => reason
      connection.close_connection_after_writing
    end
    
    def self.ping_all
      logger.debug "Pinging all users"
      max_ping_count = (Spinderella::Settings.subscriber_server.max_ping_count ||= 5).to_i
      self.each_user.each do |user|
        if user.ping_count > max_ping_count
          user.disconnect "Unresponsive to pings"
        else
          user.ping
        end
      end
    end
    
    def ==(other)
      other.is_a?(self.class) && self.signature == other.signature
    end
    
    protected
    
    def build_signature
      @signature = Digest::SHA256.hexdigest("#{Time.now.to_f}|#{@connection.get_peername}")
    end
    
  end
end