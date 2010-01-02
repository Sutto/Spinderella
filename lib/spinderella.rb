lib_path = File.dirname(__FILE__)
$LOAD_PATH.unshift(lib_path) unless $LOAD_PATH.include?(lib_path)
require 'perennial'
require 'eventmachine'
require 'yajl'
require 'yajl/json_gem'
require 'digest/sha2'

# Spinderella: A Simple JSON PubSub server written in ruby using eventmachine.
module Spinderella
  include Perennial
  
  VERSION = [1, 0, 0, 0]
  
  def self.version(inc_patch = (VERSION.last != 0))
    VERSION[0, inc_patch ? 4 : 3].join(".")
  end
  
  manifest do |m, l|
    Settings.lookup_key_path = []
    Settings.root = __FILE__.to_pathname.dirname.dirname
    l.register_controller :server, 'Spinderella::Server'
  end
  
  has_library :connection, :server, :publisher, :user, :channel, :receiver, :http
  
end
