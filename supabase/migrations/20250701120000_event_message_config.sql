/*
  # Event Message Configuration Table
  Stores WhatsApp template assignment and variable mapping per event
*/

CREATE TABLE IF NOT EXISTS event_message_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  template_name text NOT NULL,
  template_language text NOT NULL,
  variable_mapping jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, channel)
);

-- Enable RLS
ALTER TABLE event_message_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to manage configs for their own events
CREATE POLICY "Users can manage configs for own events"
  ON event_message_configurations
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_message_configurations.event_id AND user_id = auth.uid())); 