module SNP
  class Publisher
    is :loggable
    
    def self.publish(users, message, meta = {})
      logger.debug "Publishing #{message.inspect} to #{users.size} users"
      meta = meta.stringify_keys
      meta["type"]    ||= "broadcast"
      meta["message"] = message
      raw = Yajl::Encoder.encode({
        "action" => "receive_message",
        "data"   => meta
      })
      raw << Connection::SEPERATOR
      Array(users).each { |user| user.connection.send_data(raw) }
    end
    
  end
end