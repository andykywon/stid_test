require "spec_helper"

describe StorsController do
  
  render_views
  
  before(:each) do
    @user = FactoryBot.build :user
  end
  
  context "without current user" do
    describe "GET #index" do
      it "will redirect to sign in page" do
        get :index
        response.status.should == 302
      end
    end
  end
  
  context "with authenticated user" do
    
    before(:each) do
      allow(@controller).to receive(:authenticate_user!).and_return(true)
      allow(@controller).to receive(:current_user).and_return(@user)
    end
    
    describe "GET #index" do
      it "will respond with 200" do
        @models = [{'id' => 'abc'}]
        allow_any_instance_of(TWS).to receive(:get_models).and_return(@models)
        get :index
        response.status.should == 200
      end
    end
  end
  
end
