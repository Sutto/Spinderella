require File.join(File.dirname(__FILE__), '..', 'lib', "spinderella")
Spinderella::Settings.root = Pathname.new(__FILE__).dirname.join("..").expand_path
