Airbrake.configure do |config|
	config.project_id = 106315	
	config.project_key = '570e1a8aa50c64e0d3771ba4e5cf30a1'
  config.environment = Rails.env
  config.ignore_environments = ['test', 'development']
end
