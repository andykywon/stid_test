$tws_secret = "at4JuflRRyTjECYb4AEVG5WSJ33yOMvo3JZTcaAU"

case Rails.env
when 'production'
  if ENV["TWS_ENVIRONMENT"] == 'staging'
    $stid_host = "https://#{ENV['STID_HOST']}"
    $stor_host = "https://#{ENV['STOR_HOST']}"
    $stom_host = "https://#{ENV['STOM_HOST']}"
    $stopp_host = "https://#{ENV['STOPP_HOST']}"
  else
    $stid_host = "https://stid.dddws.com"
    $stor_host = "https://stor.dddws.com"
    $stom_host = "https://stom.dddws.com"
    $stopp_host = "https://stopp.dddws.com"
  end
else
	ip = Socket.ip_address_list.detect{|intf| intf.ipv4_private?}.ip_address
  $stid_host = "https://stid.dddws.com"
  $stor_host = "https://stor.dddws.com"
  $stom_host = "https://stom.dddws.com"
  $stopp_host = "https://stopp.dddws.com"
  # $stid_host = "http://#{ip}:3001"
  # $stor_host = "http://#{ip}:3002"
  # $stom_host = "http://#{ip}:3003"
  # $stopp_host = "http://#{ip}:3004"
end

require "#{Rails.root}/lib/tws_sdk/ruby/tws"