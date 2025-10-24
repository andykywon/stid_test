require 'spec_helper'

describe User do
  before(:each) do
    @user = FactoryBot.build :user
  end
  
  context "Authenticate API" do
    it "should not authenticate with invalid api_key" do
      params = {:key => 'my key'}
      @user.authenticate!(params).should == false
    end
    
    it "should not authenticate with signature missing" do
      params = {:key => @user.api_key, :signature => nil}
      @user.authenticate!(params).should == false
    end
    
    it "should not authenticate with invalid expire" do
      params = {:key => @user.api_key, :signature => 'my signature', :expire => 1.hour.ago.to_i}
      @user.authenticate!(params).should == false
    end
    
    it "should not authenticate without method param" do
      params = {:key => @user.api_key, :signature => 'my signature', :expire => (Time.now + 1.hour).to_i, :method => nil}
      @user.authenticate!(params).should == false
    end
    
    it "should not authenticate without url param" do
      params = {:key => @user.api_key, :signature => 'my signature', :expire => (Time.now + 1.hour).to_i, :method => 'GET', :url => nil}
      @user.authenticate!(params).should == false
    end
    
    it "should not authenticate with invalid signature" do
      params = {:key => @user.api_key, :signature => 'my signature', :expire => (Time.now + 1.hour).to_i, :method => 'GET', :url => '/api/v1/models'}
      @user.authenticate!(params).should == false
    end
    
    it "should authenticate with valid user signature" do
      expire = (Time.now + 1.hour).to_i
      string_to_sign = %|GET\n\n#{expire}\n/api/v1/models|.encode("UTF-8")
      params = {:key => @user.api_key, :signature => @user.calc_signature(string_to_sign), :expire => expire, :method => 'GET', :url => '/api/v1/models'}
      @user.authenticate!(params).should == true
    end
    
    it "should authenticate with valid uploader signature" do
      expire = (Time.now + 1.hour).to_i
      string_to_sign = %|GET\n\n#{expire}\n/api/v1/models|.encode("UTF-8")
      params = {:key => @user.api_key, :signature => @user.calc_signature(string_to_sign, $tws_secret), :expire => expire, :method => 'GET', :url => '/api/v1/models'}
      @user.authenticate!(params).should == true
    end
    
  end
end
