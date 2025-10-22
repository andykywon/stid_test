class KeySecret < ActiveRecord::Migration
  def change
    add_column :users, :api_key, :string
    add_column :users, :api_secret, :string
    add_index :users, :api_key
  end
end
