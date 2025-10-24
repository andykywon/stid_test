class StorsController < ApplicationController
  
  before_action :authenticate_user!
  before_action :init_tws
  
  def index
    @query = params[:search][:query] rescue ""
    @current_page = params[:page] || 1
    @stors = @tws.get_models Rack::Utils.parse_query(@query).merge({:page=>@current_page})
  end
  
  def destroy
    @result = @tws.delete_model params[:id]
    redirect_to '/stors', :notice => "#{params[:id]} has been deleted"
  end
  
  def presign
    @presign = @tws.presigned_upload_form({:name => '', :Filename => ''}, (Rails.env.production? ? request.remote_ip : '64.71.26.218'))
    render :json => @presign
  end
  
  def create
    meta = params['meta'].blank? ? {} : (JSON.parse(params['meta']) rescue {})
    begin
      @tws.create_model meta, params['upload_id']
    rescue
      render status: 400 and return
    end
    render :layout => false and return
  end
  
  private
  
  def init_tws
    @tws = TWS.new  :api_key => current_user.api_key,
                    :api_secret => current_user.api_secret,
                    :stor_host => $stor_host,
                    :stom_host => $stom_host,
                    :stid_host => $stid_host,
                    :stopp_host => $stopp_host
  end
  
end