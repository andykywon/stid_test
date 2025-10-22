Stid::Application.routes.draw do

  devise_for :users, :path => '/', :path_names => {:sign_in => 'signin', :sign_out => 'signout', :sign_up => 'signup'}  
  
  namespace :api, :defaults => { :format => 'json' } do
    namespace :v1 do
      resource :authenticate, :controller => :authenticate
    end
  end

  get 'account' => 'main#account'
  put 'account/reset_credentials' => 'main#reset_credentials'
  get 'console' => 'main#console'
  
  resources :documentations
  
  resources :stors do
    collection do
      get 'presign'
    end
  end
  
  resources :stoms do
    member do
      post 'run'
      delete 'close'
      get 'result'
      get 'runs'
      get 'select'
    end
    collection do
      get 'sessions'
    end
  end
  
  resources :stopps do
    collection do
      get 'printers'
      get 'materials'
    end
  end
  
  root 'main#index'
  
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
