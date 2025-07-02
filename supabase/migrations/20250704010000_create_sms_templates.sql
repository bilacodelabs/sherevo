/*
  # SMS Templates Table
  Stores user-defined SMS templates for invitations and reminders
*/

CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  purpose text NOT NULL DEFAULT 'invitation' CHECK (purpose IN ('reminder', 'invitation'))
);

-- Enable RLS
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to manage their own templates
CREATE POLICY "Users can manage own sms templates"
  ON sms_templates
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can manage all sms templates
CREATE POLICY "Admins can manage all sms templates"
  ON sms_templates
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_templates(user_id);

-- Optionally, update all existing rows to 'invitation' (if needed)
UPDATE sms_templates SET purpose = 'invitation' WHERE purpose IS NULL; 