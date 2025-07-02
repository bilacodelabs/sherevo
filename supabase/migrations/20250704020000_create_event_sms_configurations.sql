/*
  # Event SMS Configurations Table
  Stores which SMS template is used for reminders and invitations for each event
*/

CREATE TABLE IF NOT EXISTS event_sms_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('reminder', 'invitation')),
  sms_template_id uuid NOT NULL REFERENCES sms_templates(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, purpose)
);

-- Enable RLS
ALTER TABLE event_sms_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to manage configs for their own events
CREATE POLICY "Users can manage sms configs for own events"
  ON event_sms_configurations
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_sms_configurations.event_id AND user_id = auth.uid()));

-- Policy: Admins can manage all event sms configs
CREATE POLICY "Admins can manage all event sms configs"
  ON event_sms_configurations
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_event_sms_configurations_event_id ON event_sms_configurations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sms_configurations_sms_template_id ON event_sms_configurations(sms_template_id); 