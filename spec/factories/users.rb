# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "email#{n}@example.com"}
    password {"password"}
    password_confirmation{ |u| u.password }
    api_key {SecureRandom.hex}
    api_secret {SecureRandom.hex}
  end
end
