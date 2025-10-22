set :stage, :production
role :app, %w{ubuntu@54.83.19.140}
role :web, %w{ubuntu@54.83.19.140}
role :db,  %w{ubuntu@54.83.19.140}
set :delayed_job_args, "-n 15"

set :puma_threads,    [4, 16]
set :puma_workers,    12