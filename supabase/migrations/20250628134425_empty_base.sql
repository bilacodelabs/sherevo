/*
  # Create card designs table

  1. New Tables
    - `card_designs`
      - `id` (uuid, primary key)
      - `name` (text, card design name)
      - `event_id` (uuid, foreign key to events)
      - `user_id` (uuid, foreign key to users)
      - `background_image` (text, background image URL)
      - `canvas_width` (integer, canvas width)
      - `canvas_height` (integer, canvas height)
      - `text_elements` (jsonb, array of text elements with positions)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `card_designs` table
    - Add policy for users to manage their own card designs
    - Add policy for admins to manage all card designs
*/

CREATE TABLE IF NOT EXISTS card_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  background_image text DEFAULT '',
  canvas_width integer DEFAULT 600,
  canvas_height integer DEFAULT 400,
  text_elements jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE card_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own card designs"
  ON card_designs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all card designs"
  ON card_designs
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'super_admin'
  ));

CREATE INDEX IF NOT EXISTS idx_card_designs_user_id ON card_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_card_designs_event_id ON card_designs(event_id);