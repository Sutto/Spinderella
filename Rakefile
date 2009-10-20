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
  require File.join(File.dirname(__FILE__), "lib", "snp")
  spec = Gem::Specification.new do |s|
    s.name     = 'snp'
    s.email    = ''
    s.homepage = ''
    s.authors  = ["YOUR NAME"]
    s.version  = SNP::VERSION
    s.summary  = ""
    s.files    = FileList["{bin,vendor,lib,test}/**/*"].to_a
    s.platform = Gem::Platform::RUBY
    s.add_dependency "Sutto-perennial", ">= 1020"
  end
  File.open("snp.gemspec", "w+") { |f| f.puts spec.to_ruby }
end
