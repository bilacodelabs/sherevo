/*
  # Event Attributes Table
  Stores dynamic attributes for events that may vary between different event types
  Examples: church, church location, bride name, groom name, etc.
*/

CREATE TABLE IF NOT EXISTS event_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attribute_key text NOT NULL,
  attribute_value text NOT NULL,
  attribute_type text DEFAULT 'text' CHECK (attribute_type IN ('text', 'number', 'date', 'boolean')),
  display_name text NOT NULL,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, attribute_key)
);

-- Enable RLS
ALTER TABLE event_attributes ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to manage attributes for their own events
CREATE POLICY "Users can manage attributes for own events"
  ON event_attributes
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_attributes.event_id AND user_id = auth.uid()));

-- Policy: Admins can read all event attributes
CREATE POLICY "Admins can read all event attributes"
  ON event_attributes
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_attributes_event_id ON event_attributes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attributes_key ON event_attributes(attribute_key); 