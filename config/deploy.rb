require './config/boot'
#require 'airbrake/capistrano3'

# config valid only for Capistrano 3.1
lock '3.6.1'

set :application, 'stid'
set :repo_url, 'git@github.com:workon3d/stid.git'
set :user, 'ubuntu'

# Don't change these unless you know what you're doing
set :pty,             true
set :use_sudo,        false
set :ssh_options, {
  forward_agent: true,
  auth_methods: ["publickey"],
  keys: ["sync.pem"]
}

set :deploy_via,      :remote_cache
set :deploy_to,       "/home/#{fetch(:user)}/#{fetch(:application)}"
set :log_level, :debug

def current_git_branch
  branch = `git symbolic-ref HEAD 2> /dev/null`.strip.gsub(/^refs\/heads\//, '')
  puts "Deploying branch ===== #{branch} ====="
  branch
end

# Set the deploy branch to the current branch
set :branch, current_git_branch

# Puma
set :puma_bind,       "unix://#{shared_path}/tmp/sockets/#{fetch(:application)}-puma.sock"
set :puma_state,      "#{shared_path}/tmp/pids/puma.state"
set :puma_pid,        "#{shared_path}/tmp/pids/puma.pid"
set :puma_access_log, "#{release_path}/log/puma.access.log"
set :puma_error_log,  "#{release_path}/log/puma.error.log"
set :puma_preload_app, false
set :prune_bundler, true # doesn't work? if this works, no need for "set :puma_init_active_record, true"
set :puma_worker_timeout, nil
set :puma_init_active_record, false  # Change to true if using ActiveRecord

set :linked_dirs,  %w{log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system public/assets}

# for rails 4 binstub warning
set :bundle_binstubs, nil

set :tests, ['spec']

namespace :git do
  desc 'Copy repo to releases'
  task create_release: :'git:update' do
    on roles(:all) do
      with fetch(:git_environmental_variables) do
        within repo_path do
          execute :git, :clone, '-b', fetch(:branch), '--recursive', '.', release_path
        end
      end
    end
  end
end

namespace :deploy do
  desc 'Initial Deploy'
  task :initial do
    on roles(:app) do
      before 'deploy:restart', 'puma:start'
      invoke 'deploy'
    end
  end

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      #invoke 'puma:restart'
      # capistrano/puma gem already binding the after_finished hook for smart_restart for puma
      
      #invoke 'delayed_job:restart'
    end
  end
  
  #before :deploy, "deploy:run_tests"

  after  :finishing,    :compile_assets
  after  :finishing,    :cleanup
  after  :finishing,    :restart
  #after :finished, 'airbrake:deploy'
  
  #Rake::Task["deploy:compile_assets"].clear_actions
  #task :compile_assets => [:set_rails_env] do
  #end
end

namespace :puma do
  desc 'Create Directories for Puma Pids and Socket'
  task :make_dirs do
    on roles(:app) do
      execute "mkdir #{shared_path}/tmp/sockets -p"
      execute "mkdir #{shared_path}/tmp/pids -p"
    end
  end

  before :start, :make_dirs
end