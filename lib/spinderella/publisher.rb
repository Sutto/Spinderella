module Spinderella
  class Publisher
    is :loggable
    
    def self.publish(users, message, meta = {})
      logger.debug "Publishing #{message.inspect} to #{users.size} users"
      meta = meta.stringify_keys
      meta["type"] ||= "broadcast"
      meta["message"] = message
      data = {
        "action"  => "receive_message",
        "payload" => meta
      }
      Array(users).each { |user| user.connection.message(data) }
    end
    
  end
end