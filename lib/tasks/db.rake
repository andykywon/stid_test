namespace :db do

	DB_NAME = case Rails.env # along database.yml
	when 'development'
		"guid_dev"
	when 'test'
		"guid_test"
	when 'production'
		"guid_prod"
	when 'onpremise'
		"guid_guid_onpremise"
	else
		"guid_prod"
	end

	BUCKET_NAME = "3ws-stid-db-backup"

	def s3_upload(filename, key, bucket_name)
		require 'aws-sdk-v1'

		bucket = s3.buckets[bucket_name]
		key = key || File.basename(filename)
		puts "sending #{key} to #{bucket_name}..."
		begin
			bucket.objects[key].write(:file => filename)
			puts "done."
		rescue
			puts "Fail to sending!!!"
		end
	end

	def s3_delete(key, bucket_name)
		require 'aws-sdk-v1'

		bucket = s3.buckets[bucket_name]
		if bucket.objects[key].exists?
			bucket.objects[key].delete
			puts "#{key} has been deleted from #{bucket_name}."
		end
	end

	def s3_download(dir, key, bucket_name)
		require 'aws-sdk-v1'

		bucket = s3.buckets[bucket_name]

		unless bucket.objects[key].exists?
			puts "there is no object (#{key}) on S3."
			return nil
		end
		
		begin
			filename = "#{dir}/#{key}"
			File.open(filename, 'wb') do |file|
				bucket.objects[key].read do |chunk|
					file.write(chunk)
				end
			end
			puts "#{key} has been downloaded."
			return filename
		end
		return nil
	end

	def backup
		dir = "#{Rails.root}/tmp/backup"
		# new_name = "#{dir}/#{DB_NAME}.psql".gsub('_', '-')
		# prev_name = "#{dir}/#{DB_NAME}-prev.psql".gsub('_', '-')
		s3_name = "#{dir}/#{DB_NAME}-#{Time.now.strftime("%Y-%m-%d")}.psql.gz".gsub('_', '-')
		old_one = "#{DB_NAME}-#{(Time.now - 90.days).strftime("%Y-%m-%d")}.psql.gz".gsub('_', '-')

		FileUtils.mkdir_p(dir)
		# `pg_dump #{DB_NAME} | gzip > #{new_name}`
		# if File.exist? new_name
		# 	if File.exist? prev_name
		# 		puts "comparing with the latest backup..."
		# 		unless FileUtils.compare_stream(File.new(prev_name), File.new(new_name))
		# 			`rm #{prev_name}`
		# 			`mv #{new_name} #{prev_name}`
		# 			s3_upload(prev_name, s3_name, BUCKET_NAME)
		# 		else
		# 			puts "backups are identical."
		# 		end
		# 	else
		# 		`mv #{new_name} #{prev_name}`
		# 		s3_upload(prev_name, s3_name, BUCKET_NAME)
		# 	end
		# end

		`pg_dump #{DB_NAME} | gzip > #{s3_name}`
		s3_upload(s3_name, nil, BUCKET_NAME)
		`rm #{s3_name}`

		s3_delete(old_one, BUCKET_NAME)
	end

	def restore s3_key
		dir = "#{Rails.root}/tmp/backup"
		filename = s3_download(dir, s3_key, BUCKET_NAME)
		if filename and File.exist? filename
			`dropdb #{DB_NAME}`
			`createdb #{DB_NAME}`
			`gunzip -c #{filename} | psql #{DB_NAME}`
		else
			puts "failed to download of #{s3_key}"
		end
	end

	desc "backup PG and upload to S3"
  task :backup => :environment do
    list = backup
  end

  desc "restore PG from S3"
  task :restore, [:arg1] => :environment do |t, args|
  	puts "Usage: rake db:restore['<backup date (format of YYYY-MM-DD)>']"
    restore "#{DB_NAME}-#{args[:arg1]}.psql.gz".gsub('_', '-')
  end
end