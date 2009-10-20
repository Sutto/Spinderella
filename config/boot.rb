require File.join(File.dirname(__FILE__), '..', 'lib', "snp")
SNP::Settings.root = Pathname.new(__FILE__).dirname.join("..").expand_path
