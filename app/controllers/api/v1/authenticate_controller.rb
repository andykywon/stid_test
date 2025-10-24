class Api::V1::AuthenticateController < ApplicationController
  #skip_before_filter :verify_authenticity_token
  layout false
  
  def create
    render_api(400) and return if params[:key].blank?
    
    @user = User.find_by_api_key(params[:key])
    render_api(404) and return unless @user
    render_api(401) and return unless @user.authenticate!(params)
    
    render :json => @user.as_json
  end
  
  protected #####
  
  def render_api code, response = {}
    if response.blank?
      render :nothing => true, :status => code
    else
      render :json => response, :status => code
    end
  end
  
  private #####
  
end