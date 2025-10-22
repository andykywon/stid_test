require "spec_helper"

describe Api::V1::AuthenticateController do
  
  render_views
  
  before(:each) do
    @user = FactoryGirl.build :user
  end
  
  context "without api_key" do
    describe "POST #create" do
      it "responds with 400" do
        post :create
        response.status.should == 400
      end
    end
  end
  
  context "with wrong api_key" do
    describe "POST #create" do
      it "responds with 404" do
        post :create, :key => 'not exist'
        response.status.should == 404
      end
    end
  end
  
  context "with valid api_key" do
    before(:each) do
      allow(User).to receive(:find_by_api_key).and_return(@user)
    end
    
    describe "POST #create with invalid params" do
      it "responds with 404" do
        post :create, :key => @user.api_key
        response.status.should == 401
      end
    end
    
    describe "POST #create with valid params" do
      it "responds 200 wth authenticated user" do
        t = (Time.now + 1.hour).to_i
        sig = @user.calc_signature(%|GET\nany options goes here\n#{t}\n/api/v1/models|).encode("UTF-8")
        post  :create,
              :key => @user.api_key,
              :method => 'GET',
              :url => '/api/v1/models',
              :signature => sig,
              :expire => t,
              :options => "any options goes here",
              :format => :json
        
        response.status.should == 200
        JSON.parse(response.body)["email"].should == @user.email
        JSON.parse(response.body)["key"].should == @user.api_key
        JSON.parse(response.body)["authenticated"].should == true
      end
    end
    
    describe "POST #create with signature signed with uploader" do
      it "responds 200 wth authenticated user" do
        t = (Time.now + 1.hour).to_i
        sig = @user.calc_signature(%|GET\nany options goes here\n#{t}\n/api/v1/models|, $tws_secret).encode("UTF-8")
        post  :create,
              :key => @user.api_key,
              :method => 'GET',
              :url => '/api/v1/models',
              :signature => sig,
              :expire => t,
              :options => "any options goes here",
              :format => :json
        
        response.status.should == 200
        JSON.parse(response.body)["email"].should == @user.email
        JSON.parse(response.body)["key"].should == @user.api_key
        JSON.parse(response.body)["authenticated"].should == true
      end
    end
    
  end
  
end