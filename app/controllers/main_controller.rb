class MainController < ApplicationController
  
  before_filter :authenticate_user!
  
  def index
    redirect_to '/account'
  end
  
  def account
  end

  def reset_credentials
    u = current_user
    u.reset_api_key_and_secret
    if u.save
      render :json => {:api_key=>u.api_key, :api_secret=>u.api_secret}, :code => 200
    else
      render :nothing => true, :code => 400
    end
  end
  
  def console
  end
  
end