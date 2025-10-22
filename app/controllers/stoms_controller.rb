class StomsController < ApplicationController
  
  before_filter :authenticate_user!
  before_filter :init_tws
  before_filter :set_current_session
  
  def index
    @stoms = @tws.get_sessions(:state => 'active')[0..5]
  end
  
  def run
    @current_stom_session_state = @tws.get_session(@current_stom_session_id)['state']
    @run = @tws.create_run @current_stom_session_id, params[:run][:platform], params[:run][:code]
    render :layout => false
  end
  
  def select
    session[:current_stom_session_id] = params[:id]
    set_current_session
    render :layout => false
  end
  
  def result
    @run = @tws.get_runs(params[:id], params[:platform]).select{|r| r['id'] == params[:run_id].to_i}.first
    render :json => {:state => @run['state'], :result => ">> #{@run['result']}", :log => ">> #{@run['log']}"}
  end
  
  def runs
    # TODO
  end
  
  def close
    @tws.close_session(params[:id]) rescue nil
    session[:current_stom_session_id] = nil if params[:id] == @current_stom_session_id
    set_current_session
    render :layout => false
  end
  
  def sessions
    @stoms = @tws.get_sessions(:state => 'active')[0..5]
    render :partial => 'sessions'
  end
  
  def create
    @stom = @tws.create_session params[:timeout], params[:engine_version]
    session[:current_stom_session_id] = @stom['id']
    set_current_session
    render :layout => false
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
  
  def set_current_session
    @current_stom_session_id = session[:current_stom_session_id]
  end
  
end