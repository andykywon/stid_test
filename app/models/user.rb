class User < ActiveRecord::Base
  
  attr_accessor :authenticated, :skip_check_domain
  before_create :init_api_key_and_secret
  
  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  devise  :database_authenticatable,
          :registerable,
          :recoverable,
          :rememberable,
          :trackable,
          :validatable,
          :confirmable
  
  validate :check_domain
  
  def as_json
    {
      :id => id,
      :email => email,
      :key => api_key,
      :authenticated => authenticated
    }
  end
  
  def check_domain
    if !skip_check_domain && !email.downcase.include?('@3dsystems.com') && !email.downcase.include?('@teamplatform.com')
      errors.add :email, 'is not valid.'
    end
  end
  
  def authenticate! params
    return false unless valid_params?(params)
    string_to_sign = "#{params[:method]}\n#{params[:options]}\n#{params[:expire]}\n#{params[:url]}".encode("UTF-8")
    signatures = []
    signatures << calc_signature(string_to_sign)
    signatures << calc_signature(string_to_sign, $tws_secret)
    self.authenticated = signatures.include?(params[:signature])
  end
  
  def valid_params? params
    !api_key.blank? &&
    !api_secret.blank? &&
    !params[:key].blank? &&
    params[:key] == api_key &&
    !params[:method].blank? &&
    !params[:url].blank? &&
    !params[:expire].blank? &&
    !params[:signature].blank? &&
    Time.at(params[:expire].to_i) >= Time.now
  end
  
  def calc_signature string_to_sign, secret = api_secret
    CGI.escape(
      Base64.encode64(
        OpenSSL::HMAC.digest(
          OpenSSL::Digest.new('sha1'),
          secret,
          string_to_sign
        )
      ).strip
    )
  end

  def reset_api_key_and_secret
    self.api_key = SecureRandom.hex
    self.api_secret = SecureRandom.hex
  end
  
  private #####
  
  def init_api_key_and_secret
    self.api_key = SecureRandom.hex
    self.api_secret = SecureRandom.hex
  end
  
end
