/*
  # Fix Users Table Schema

  1. Schema Updates
    - Add missing columns to users table if they don't exist
    - Ensure proper constraints and defaults

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user access controls
*/

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users ADD COLUMN name text NOT NULL DEFAULT '';
  END IF;

  -- Add avatar column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar text;
  END IF;

  -- Add last_login column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing users to have proper names if they're empty
UPDATE users 
SET name = COALESCE(NULLIF(name, ''), split_part(email, '@', 1))
WHERE name = '' OR name IS NULL;

-- Ensure the role column has proper constraints
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  -- Add the role constraint
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role = ANY (ARRAY['customer'::text, 'super_admin'::text]));
END $$;

-- Ensure proper default for role
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer';