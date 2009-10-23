module Spinderella
  class Channel
    is :loggable
    
    @@channel_mapping = {}
    
    # Registers a channel so that it can be easily
    # found given only it's name
    # @param [Spinderella::Channel] channel the channel to register
    # @see Spinderella::Channel[]
    # @see Spinderella::Channel.remove_channel
    def self.register_channel(channel)
      @@channel_mapping[channel.name] = channel
    end
    
    # Resets a channel mapping, ensuring that there are no
    # registered channels.
    def self.reset_channel_mapping
      @@channel_mapping.each_value { |v| remove_channel(v) }
    end
    
    # Remove a channel registration, making it unavailable via
    # the channel mapping.
    # @param [Spinderella::Channel] channel the channel to remove
    # @see Spinderella::Channel[]
    # @see Spinderella::Channel.register_channel
    def self.remove_channel(channel)
      @@channel_mapping.delete(channel.name)
    end
    
    # Looks for a channel with a given name, returning 
    # a new channel if it doesn't exist.
    # @param [String] name the channels name
    # @return [Spinderella::Channel] the associated channels
    def self.[](name)
      @@channel_mapping[name] ||= self.new(name)
    end
    
    # Checks whether a channel with the given name exists
    # @param [String] name the channels name
    # @return [true, false] whether or not the channel is registered
    def self.exists?(name)
      @@channel_mapping.has_key?(name)
    end
    
    # Publishes a given message to a set channels.
    # @param [Array<String>] channels the channel names
    # @param [String] message the message to publish
    def self.publish(channels, message)
      users = Array(channels).map { |c| exists?(c.to_s) ? self[c.to_s].clients.values : [] }.flatten.uniq
      Publisher.publish(users, message, :type => "channels", :channels => channels)
    end

    attr_reader :name, :clients

    # Creates an initializes a channel with a given name.
    # @param [String] name the name of the given channel
    def initialize(name)
      logger.debug "Creating channel '#{name}'"
      @name = name
      @clients = {}
      self.class.register_channel(self)
    end
    
    # Checks whether or not a given user is subscribed to this channel's updates.
    # @param [Spinderella::User] u the user to check
    # @return [true, false] whether or not the user is subscribed.
    def subscribed?(u)
      @clients.has_key?(u.signature)
    end
    
    # Publishes a message to all the members of this channel,
    # using the channel message type.
    # @param [String] message the message to publish
    def publish(message)
      logger.debug "Publishing #{message.inspect} directly to #{self.name}"
      Publisher.publish(@clients.values, message, :type => "channel", :channel => self.name)
    end
    
    # Adds a user as a subscriber to this channel
    # @param [Spinderella::User] user the user who wishes to subscribe
    def subscribe(user)
      @clients[user.signature] = user
    end
    
    # Removes a users subscription from this channel,
    # Removing the channel if it is empty.
    # @param [Spinderella::User] user the user to remove
    def unsubscribe(user)
      @clients.delete(user.signature)
      self.class.remove_channel(self) if empty?
    end
    
    # Checks if the channel is empty (e.g. no subscribers)
    # @return [true, false] whether or not the channel is empty
    def empty?
      @clients.empty?
    end
    
    # Calls a block on each user in this channel
    # @yield [Spinderella::User] the user
    def each_client(&blk)
      @clients.each_value(&blk)
    end
   
  end
end