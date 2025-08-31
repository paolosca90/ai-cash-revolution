-- Use the existing migrations and seed files
-- This file is included for compatibility

-- The actual database setup is in:
-- - backend/migrations/001_initial_setup.sql
-- - backend/migrations/002_seed_data.sql

-- Create a test user for demo purposes
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'demo@aitradingbot.com',
  crypt('demo123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Demo User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Note: The main database schema and data is managed via migrations in backend/migrations/