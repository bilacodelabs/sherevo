/*
  # Add missing WhatsApp Cloud API fields and clean up duplicates

  This migration adds the missing WhatsApp Cloud API fields to the user_configurations table
  for existing installations that may not have these fields, and cleans up any duplicate entries.
*/

-- Add whatsapp_phone_number_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_configurations' AND column_name = 'whatsapp_phone_number_id'
  ) THEN
    ALTER TABLE user_configurations ADD COLUMN whatsapp_phone_number_id text DEFAULT '';
  END IF;
END $$;

-- Add whatsapp_business_account_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_configurations' AND column_name = 'whatsapp_business_account_id'
  ) THEN
    ALTER TABLE user_configurations ADD COLUMN whatsapp_business_account_id text DEFAULT '';
  END IF;
END $$;

-- Clean up duplicate user_configurations entries
-- Keep only the most recent entry for each user
DELETE FROM user_configurations 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM user_configurations 
  ORDER BY user_id, created_at DESC
);

-- Ensure the unique constraint is properly enforced
ALTER TABLE user_configurations DROP CONSTRAINT IF EXISTS user_configurations_user_id_key;
ALTER TABLE user_configurations ADD CONSTRAINT user_configurations_user_id_key UNIQUE (user_id); 