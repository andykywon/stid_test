class StoppsController < ApplicationController
  
  before_filter :authenticate_user!
  before_filter :init_tws
  
  def printers
    @printers = @tws.get_printers :state => params[:state]
    @keys = @printers.inject([]){|a, p| a += p["properties"].keys}.uniq
    respond_to do |format|
      format.html
      format.xls{ render :layout => false }
    end
  end
  
  def materials
    @materials = @tws.get_materials :state => params[:state]
    @keys = @materials.inject([]){|a, m| a += m["properties"].keys}.uniq
    respond_to do |format|
      format.html
      format.xls{ render :layout => false }
    end
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