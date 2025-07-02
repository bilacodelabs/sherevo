/*
  # Complete Nialike Platform Database Schema

  1. New Tables
    - `users` - User profiles with role-based access
    - `events` - Event management with status tracking
    - `guests` - Guest lists with RSVP and contact info
    - `guest_categories` - Custom categories for guest organization
    - `guest_notes` - Notes and comments about guests
    - `card_templates` - Invitation card templates
    - `activity_items` - User activity tracking
    - `event_analytics` - Event performance metrics
    - `invitation_analytics` - Invitation tracking and analytics

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access control
    - Role-based permissions for customers and super_admins

  3. Features
    - Automatic timestamp updates
    - Default card templates
    - Proper foreign key relationships
    - Check constraints for data validation
*/

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies for users table
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Allow user registration" ON users;
  DROP POLICY IF EXISTS "Admin can read all users" ON users;
  DROP POLICY IF EXISTS "Admin can update all users" ON users;
  
  -- Drop policies for events table
  DROP POLICY IF EXISTS "Users can read own events" ON events;
  DROP POLICY IF EXISTS "Users can create own events" ON events;
  DROP POLICY IF EXISTS "Users can update own events" ON events;
  DROP POLICY IF EXISTS "Users can delete own events" ON events;
  DROP POLICY IF EXISTS "Users can manage own events" ON events;
  DROP POLICY IF EXISTS "Admins can read all events" ON events;
  
  -- Drop policies for guests table
  DROP POLICY IF EXISTS "Users can read guests of own events" ON guests;
  DROP POLICY IF EXISTS "Users can manage guests of own events" ON guests;
  DROP POLICY IF EXISTS "Users can manage guests for own events" ON guests;
  DROP POLICY IF EXISTS "Admins can read all guests" ON guests;
  
  -- Drop policies for guest_categories table
  DROP POLICY IF EXISTS "Users can manage categories of own events" ON guest_categories;
  DROP POLICY IF EXISTS "Users can manage categories for own events" ON guest_categories;
  DROP POLICY IF EXISTS "Admins can manage all guest categories" ON guest_categories;
  
  -- Drop policies for guest_notes table
  DROP POLICY IF EXISTS "Users can manage notes of own event guests" ON guest_notes;
  DROP POLICY IF EXISTS "Users can manage notes for guests in own events" ON guest_notes;
  DROP POLICY IF EXISTS "Admins can manage all guest notes" ON guest_notes;
  
  -- Drop policies for card_templates table
  DROP POLICY IF EXISTS "Users can read all templates" ON card_templates;
  DROP POLICY IF EXISTS "All users can read templates" ON card_templates;
  DROP POLICY IF EXISTS "Admins can manage templates" ON card_templates;
  
  -- Drop policies for activity_items table
  DROP POLICY IF EXISTS "Users can read own activity" ON activity_items;
  DROP POLICY IF EXISTS "Users can create own activity" ON activity_items;
  DROP POLICY IF EXISTS "Admins can read all activity" ON activity_items;
  
  -- Drop policies for event_analytics table
  DROP POLICY IF EXISTS "Users can read analytics of own events" ON event_analytics;
  DROP POLICY IF EXISTS "Users can manage analytics of own events" ON event_analytics;
  DROP POLICY IF EXISTS "Users can manage analytics for own events" ON event_analytics;
  DROP POLICY IF EXISTS "Users can read analytics for own events" ON event_analytics;
  DROP POLICY IF EXISTS "Admins can read all event analytics" ON event_analytics;
  
  -- Drop policies for invitation_analytics table
  DROP POLICY IF EXISTS "Users can read invitation analytics of own events" ON invitation_analytics;
  DROP POLICY IF EXISTS "Users can manage invitation analytics of own events" ON invitation_analytics;
  DROP POLICY IF EXISTS "Users can manage invitation analytics for own events" ON invitation_analytics;
  DROP POLICY IF EXISTS "Users can read invitation analytics for own events" ON invitation_analytics;
  DROP POLICY IF EXISTS "Admins can read all invitation analytics" ON invitation_analytics;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Ignore if tables don't exist yet
  WHEN undefined_object THEN
    NULL; -- Ignore if policies don't exist
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'super_admin')),
  avatar text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Add foreign key constraint to auth.users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey' AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('wedding', 'send-off', 'birthday', 'anniversary', 'other')),
  date date NOT NULL,
  time text NOT NULL,
  venue text NOT NULL,
  dress_code text,
  cover_image text,
  description text DEFAULT '',
  user_id uuid NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  guest_count integer DEFAULT 0,
  rsvp_count integer DEFAULT 0,
  invitations_sent integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key for events.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_user_id_fkey' AND table_name = 'events'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create guest_categories table
CREATE TABLE IF NOT EXISTS guest_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, name)
);

-- Add foreign key for guest_categories.event_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'guest_categories_event_id_fkey' AND table_name = 'guest_categories'
  ) THEN
    ALTER TABLE guest_categories ADD CONSTRAINT guest_categories_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  category text DEFAULT 'General' CHECK (category IN ('General', 'Family', 'Friends', 'Colleagues', 'VIP')),
  rsvp_status text DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined')),
  invitation_sent boolean DEFAULT false,
  qr_code text,
  delivery_status text DEFAULT 'not_sent' CHECK (delivery_status IN ('not_sent', 'sent', 'delivered', 'viewed')),
  invited_at timestamptz,
  responded_at timestamptz,
  plus_one_allowed boolean DEFAULT false,
  plus_one_name text,
  dietary_restrictions text,
  table_number integer
);

-- Add foreign key for guests.event_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'guests_event_id_fkey' AND table_name = 'guests'
  ) THEN
    ALTER TABLE guests ADD CONSTRAINT guests_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create guest_notes table
CREATE TABLE IF NOT EXISTS guest_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL,
  note text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign keys for guest_notes if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'guest_notes_guest_id_fkey' AND table_name = 'guest_notes'
  ) THEN
    ALTER TABLE guest_notes ADD CONSTRAINT guest_notes_guest_id_fkey 
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'guest_notes_created_by_fkey' AND table_name = 'guest_notes'
  ) THEN
    ALTER TABLE guest_notes ADD CONSTRAINT guest_notes_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create card_templates table
CREATE TABLE IF NOT EXISTS card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  preview text NOT NULL,
  background_color text DEFAULT '#f8fafc',
  text_color text DEFAULT '#1e293b',
  accent_color text DEFAULT '#9333ea',
  font_family text DEFAULT 'serif',
  is_popular boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create activity_items table
CREATE TABLE IF NOT EXISTS activity_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN (
    'event_created', 
    'event_updated', 
    'event_deleted',
    'invitation_sent', 
    'rsvp_received', 
    'guest_added',
    'guest_updated',
    'guest_removed',
    'card_design_created',
    'card_design_updated',
    'card_design_deleted',
    'default_card_set',
    'configuration_updated',
    'template_assigned'
  )),
  message text NOT NULL,
  event_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Add foreign keys for activity_items if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_items_user_id_fkey' AND table_name = 'activity_items'
  ) THEN
    ALTER TABLE activity_items ADD CONSTRAINT activity_items_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_items_event_id_fkey' AND table_name = 'activity_items'
  ) THEN
    ALTER TABLE activity_items ADD CONSTRAINT activity_items_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create event_analytics table
CREATE TABLE IF NOT EXISTS event_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL,
  total_invitations integer DEFAULT 0,
  total_responses integer DEFAULT 0,
  accepted_count integer DEFAULT 0,
  declined_count integer DEFAULT 0,
  pending_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add foreign key for event_analytics.event_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_analytics_event_id_fkey' AND table_name = 'event_analytics'
  ) THEN
    ALTER TABLE event_analytics ADD CONSTRAINT event_analytics_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create invitation_analytics table
CREATE TABLE IF NOT EXISTS invitation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  guest_id uuid,
  opened_at timestamptz,
  responded_at timestamptz,
  ip_address text,
  user_agent text,
  device_type text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now()
);

-- Add foreign keys for invitation_analytics if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invitation_analytics_event_id_fkey' AND table_name = 'invitation_analytics'
  ) THEN
    ALTER TABLE invitation_analytics ADD CONSTRAINT invitation_analytics_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invitation_analytics_guest_id_fkey' AND table_name = 'invitation_analytics'
  ) THEN
    ALTER TABLE invitation_analytics ADD CONSTRAINT invitation_analytics_guest_id_fkey 
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_table_number ON guests(table_number);
CREATE INDEX IF NOT EXISTS idx_guest_categories_event_id ON guest_categories(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_notes_guest_id ON guest_notes(guest_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_id ON event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_invitation_analytics_event_id ON invitation_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_invitation_analytics_guest_id ON invitation_analytics(guest_id);
CREATE INDEX IF NOT EXISTS idx_invitation_analytics_opened_at ON invitation_analytics(opened_at);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_analytics ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get current user ID
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (uid() = id);

CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (uid() = id);

CREATE POLICY "Admin can read all users"
  ON users FOR SELECT
  TO authenticated
  USING ((uid() = id) OR (uid()::text = 'admin-user-id'::text));

CREATE POLICY "Admin can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING ((uid() = id) OR (uid()::text = 'admin-user-id'::text));

-- RLS Policies for events table
CREATE POLICY "Users can manage own events"
  ON events FOR ALL
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Admins can read all events"
  ON events FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'super_admin'));

-- RLS Policies for guests table
CREATE POLICY "Users can manage guests for own events"
  ON guests FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = guests.event_id AND user_id = uid()));

CREATE POLICY "Admins can read all guests"
  ON guests FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'super_admin'));

-- RLS Policies for guest_categories table
CREATE POLICY "Users can manage categories for own events"
  ON guest_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = guest_categories.event_id AND user_id = uid()));

CREATE POLICY "Admins can manage all guest categories"
  ON guest_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'super_admin'));

-- RLS Policies for guest_notes table
CREATE POLICY "Users can manage notes for guests in own events"
  ON guest_notes FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM guests g
    JOIN events e ON g.event_id = e.id
    WHERE g.id = guest_notes.guest_id AND e.user_id = uid()
  ));

CREATE POLICY "Admins can manage all guest notes"
  ON guest_notes FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'super_admin'));

-- RLS Policies for card_templates table
CREATE POLICY "All users can read templates"
  ON card_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON card_templates FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'super_admin'));

-- RLS Policies for activity_items table
CREATE POLICY "Users can read own activity"
  ON activity_items FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create own activity"
  ON activity_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Admins can read all activity"
  ON activity_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'super_admin'));

-- RLS Policies for event_analytics table
CREATE POLICY "Users can manage analytics for own events"
  ON event_analytics FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_analytics.event_id AND user_id = uid()));

CREATE POLICY "Users can read analytics for own events"
  ON event_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_analytics.event_id AND user_id = uid()));

CREATE POLICY "Admins can read all event analytics"
  ON event_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'super_admin'));

-- RLS Policies for invitation_analytics table
CREATE POLICY "Users can manage invitation analytics for own events"
  ON invitation_analytics FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = invitation_analytics.event_id AND user_id = uid()));

CREATE POLICY "Users can read invitation analytics for own events"
  ON invitation_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = invitation_analytics.event_id AND user_id = uid()));

CREATE POLICY "Admins can read all invitation analytics"
  ON invitation_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'super_admin'));

-- Create function to update event analytics
CREATE OR REPLACE FUNCTION update_event_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert event analytics
  INSERT INTO event_analytics (
    event_id,
    total_invitations,
    total_responses,
    accepted_count,
    declined_count,
    pending_count,
    last_updated
  )
  SELECT 
    e.id,
    COUNT(g.id) as total_invitations,
    COUNT(CASE WHEN g.rsvp_status != 'pending' THEN 1 END) as total_responses,
    COUNT(CASE WHEN g.rsvp_status = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN g.rsvp_status = 'declined' THEN 1 END) as declined_count,
    COUNT(CASE WHEN g.rsvp_status = 'pending' THEN 1 END) as pending_count,
    now()
  FROM events e
  LEFT JOIN guests g ON e.id = g.event_id
  WHERE e.id = COALESCE(NEW.event_id, OLD.event_id)
  GROUP BY e.id
  ON CONFLICT (event_id) 
  DO UPDATE SET
    total_invitations = EXCLUDED.total_invitations,
    total_responses = EXCLUDED.total_responses,
    accepted_count = EXCLUDED.accepted_count,
    declined_count = EXCLUDED.declined_count,
    pending_count = EXCLUDED.pending_count,
    last_updated = EXCLUDED.last_updated;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating event analytics
DROP TRIGGER IF EXISTS trigger_update_event_analytics ON guests;
CREATE TRIGGER trigger_update_event_analytics
  AFTER INSERT OR UPDATE OR DELETE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_event_analytics();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Insert default card templates (only if they don't exist)
INSERT INTO card_templates (name, type, preview, background_color, text_color, accent_color, font_family, is_popular, usage_count)
SELECT * FROM (VALUES 
  ('Elegant Wedding', 'wedding', 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg', '#ffffff', '#2d3748', '#f46036', 'serif', true, 150),
  ('Modern Birthday', 'birthday', 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg', '#fff5f5', '#1a202c', '#e53e3e', 'sans-serif', true, 120),
  ('Professional Send-off', 'send-off', 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg', '#f7fafc', '#2d3748', '#3182ce', 'sans-serif', false, 80),
  ('Golden Anniversary', 'anniversary', 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg', '#fffbeb', '#744210', '#d69e2e', 'serif', true, 95),
  ('Classic Invitation', 'other', 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg', '#f9fafb', '#374151', '#6b7280', 'sans-serif', false, 200)
) AS t(name, type, preview, background_color, text_color, accent_color, font_family, is_popular, usage_count)
WHERE NOT EXISTS (SELECT 1 FROM card_templates WHERE card_templates.name = t.name);