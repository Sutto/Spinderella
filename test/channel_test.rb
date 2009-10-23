require 'test_helper'

class ChannelTest < Test::Unit::TestCase

  context 'a channel' do
    
    setup do
      @channel = Spinderella::Channel.new("awesome-channel")
      @user_a  = Spinderella::User.new(Spinderella::Nash.new(:get_peername => "some-peername"))
      @user_b  = Spinderella::User.new(Spinderella::Nash.new(:get_peername => "some-other-peername"))
      @user_c  = Spinderella::User.new(Spinderella::Nash.new(:get_peername => "some-peername-again"))
      @channel.subscribe @user_a
      @channel.subscribe @user_b
    end
    
    teardown { Spinderella::Channel.reset_channel_mapping } 
    
    should 'let you check if a user is subscribed to a channel' do
      assert @channel.subscribed?(@user_a)
      assert @channel.subscribed?(@user_b)
      assert !@channel.subscribed?(@user_c)
    end
    
    should 'should let you subscribe users to a channel' do
      assert !@channel.subscribed?(@user_c)
      @channel.subscribe(@user_c)
      assert @channel.subscribed?(@user_c)
    end
    
    should 'correctly handle unsubscribing' do
      assert Spinderella::Channel.exists?("awesome-channel")
      assert @channel.subscribed?(@user_a)
      assert @channel.subscribed?(@user_b)
      @channel.unsubscribe(@user_a)
      assert Spinderella::Channel.exists?("awesome-channel")
      assert !@channel.subscribed?(@user_a)
      assert @channel.subscribed?(@user_b)
      @channel.unsubscribe(@user_b)
      assert !@channel.subscribed?(@user_a)
      assert !@channel.subscribed?(@user_b)
      assert !Spinderella::Channel.exists?("awesome-channel")
    end
    
    should 'let you check if a channel is empty' do
      assert !@channel.empty?
      assert Spinderella::Channel.new("rock-n-roll").empty?
    end
    
    should 'let you invoke a block for all clients' do
      clients = []
      @channel.each_client { |c| clients << c }
      assert(clients & [@user_a, @user_b] == clients)
    end
    
    should 'let you publish a message to members of the channel' do
      users   = nil
      message = nil
      options = {}
      mock(Spinderella::Publisher).publish do |u, m, o|
        users = u
        message = m
        options = o
      end
      @channel.publish("Some-Message")
      assert_equal "Some-Message", message
      assert(users & [@user_a, @user_b] == users) 
      assert_equal "channel",         options[:type]
      assert_equal "awesome-channel", options[:channel]
    end
    
  end
  
  context 'inspecting all channels' do
    
    setup do
      @channel_a = Spinderella::Channel.new("a")
      @channel_b = Spinderella::Channel.new("b")
      @channel_c = Spinderella::Channel.new("c")
    end
    
    should 'return the correct channel via []' do
      assert_equal @channel_a, Spinderella::Channel["a"]
      assert_equal @channel_b, Spinderella::Channel["b"]
      assert_equal @channel_c, Spinderella::Channel["c"]
    end
    
    should 'let you check if a channel exists' do
      assert Spinderella::Channel.exists?("a")
      assert Spinderella::Channel.exists?("b")
      assert Spinderella::Channel.exists?("c")
      assert !Spinderella::Channel.exists?("d")
      assert !Spinderella::Channel.exists?("e")
    end
    
    should 'create a channel if it doesn\'t exist' do
      assert !Spinderella::Channel.exists?("d")
      channel_b = Spinderella::Channel["d"]
      assert Spinderella::Channel.exists?("d")
      assert_equal channel_b, Spinderella::Channel["d"]
    end
    
    teardown do
      Spinderella::Channel.reset_channel_mapping
    end
    
  end

end
