/*
  # Add default card design and configuration settings

  1. New Tables
    - Add default_card_design_id to events table
    - Create user_configurations table for WhatsApp and SMS settings
  
  2. Security
    - Enable RLS on user_configurations table
    - Add policies for user configurations
  
  3. Changes
    - Add foreign key constraint for default card design
    - Add indexes for performance
*/

-- Add default_card_design_id to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'default_card_design_id'
  ) THEN
    ALTER TABLE events ADD COLUMN default_card_design_id uuid REFERENCES card_designs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create user_configurations table
CREATE TABLE IF NOT EXISTS user_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_api_key text DEFAULT '',
  whatsapp_phone_number text DEFAULT '',
  whatsapp_phone_number_id text DEFAULT '',
  whatsapp_business_account_id text DEFAULT '',
  whatsapp_enabled boolean DEFAULT false,
  sms_api_key text DEFAULT '',
  sms_provider text DEFAULT 'twilio',
  sms_phone_number text DEFAULT '',
  sms_enabled boolean DEFAULT false,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_configurations
ALTER TABLE user_configurations ENABLE ROW LEVEL SECURITY;

-- Add policies for user_configurations
CREATE POLICY "Users can manage own configurations"
  ON user_configurations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all configurations"
  ON user_configurations
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'super_admin'
  ));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_default_card_design ON events(default_card_design_id);
CREATE INDEX IF NOT EXISTS idx_user_configurations_user_id ON user_configurations(user_id);

-- Insert default configurations for existing users
INSERT INTO user_configurations (user_id)
SELECT id FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_configurations WHERE user_configurations.user_id = users.id
);