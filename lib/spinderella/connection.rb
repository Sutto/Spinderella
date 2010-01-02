module Spinderella
  class Connection < EventMachine::Connection
    include Perennial::Protocols::JSONTransport
  end
end