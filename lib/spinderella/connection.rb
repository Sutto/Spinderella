module Spinderella
  # TODO: Rewrite using the standard implementations provided by perennial
  class Connection < EM::Connection
    is :loggable
    
    SEPERATOR = "\r\n".freeze

    attr_reader :options

    def initialize(*args)
      @options = args.last.is_a?(Spinderella::Nash) ? args.pop : Spinderella::Nash.new
      @buffer = BufferedTokenizer.new(SEPERATOR)
    end
    
    def receive_data(data)
      @buffer.extract(data).each { |c| receive_message(c) }
    end
    
    def send_message(raw_part_text)
      send_data "#{raw_part_text}#{SEPERATOR}"
    end
    
    def send_data(d)
      logger.debug ">> #{d.strip}"
      super(d)
    end
    
    require 'spinderella/connection/message_handling'
    include MessageHandling
    
  end
end