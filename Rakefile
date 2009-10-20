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
    s.email    = ''
    s.homepage = ''
    s.authors  = ["YOUR NAME"]
    s.version  = Spinderella::VERSION
    s.summary  = ""
    s.files    = FileList["{bin,vendor,lib,test}/**/*"].to_a
    s.platform = Gem::Platform::RUBY
    s.add_dependency "Sutto-perennial", ">= 1020"
  end
  File.open("spinderella.gemspec", "w+") { |f| f.puts spec.to_ruby }
end
