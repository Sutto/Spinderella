require 'rake'
require 'rake/testtask'

task :default => "test:units"

namespace :test do
  
  desc "Runs the unit tests for perennial"
  Rake::TestTask.new("units") do |t|
    t.pattern = 'test/*_test.rb'
    t.libs << 'test'
    t.verbose = true
  end
  
end

task :gemspec do
  require 'rubygems'
  require File.join(File.dirname(__FILE__), "lib", "spinderella")
  spec = Gem::Specification.new do |s|
    s.name     = 'spinderella'
    s.email    = 'sutto@sutto.net'
    s.homepage = 'http://sutto.net/'
    s.authors  = ["Darcy Laycock"]
    s.version  = Spinderella::VERSION
    s.summary  = "A pub-sub style server setup for ruby. Like juggernaut but minus the web client."
    s.files    = FileList["{bin,vendor,lib,test}/**/*"].to_a
    s.platform = Gem::Platform::RUBY
    s.add_dependency "perennial"
  end
  File.open("spinderella.gemspec", "w+") { |f| f.puts spec.to_ruby }
end

desc "Minifies the Javascript involves"
task :minify do
  require 'jsmin'
  public_dir = File.join(File.dirname(__FILE__), "public")
  files = ["json2.js", "spinderella.js"]
  input = []
  files.each do |file|
    input << File.read(File.join(public_dir, file))
  end
  File.open(File.join(public_dir, "spinderella-min.js"), "w+") do |f|
    f.puts "// Released under the MIT License"
    f.puts JSMin.minify(input.join("\n"))
  end
end
