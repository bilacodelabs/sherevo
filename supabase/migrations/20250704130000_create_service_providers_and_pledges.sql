-- Service Providers Table
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('caterer', 'social_hall', 'mc', 'photographer', 'videographer', 'other')),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event-ServiceProvider Link Table
CREATE TABLE IF NOT EXISTS event_service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  role text NOT NULL, -- e.g., 'caterer', 'mc', etc.
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Pledges Table
CREATE TABLE IF NOT EXISTS pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  amount numeric,
  type text, -- e.g., 'cash', 'item', etc.
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_event_service_providers_event_id ON event_service_providers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_service_providers_provider_id ON event_service_providers(provider_id);
CREATE INDEX IF NOT EXISTS idx_pledges_guest_id ON pledges(guest_id);
CREATE INDEX IF NOT EXISTS idx_pledges_event_id ON pledges(event_id);

-- Enable RLS
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_providers
CREATE POLICY "Providers can manage own profile" ON service_providers FOR ALL TO authenticated USING (user_id = uid());

-- RLS Policies for event_service_providers
CREATE POLICY "Providers and event owners can view links" ON event_service_providers FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM service_providers WHERE id = event_service_providers.provider_id AND user_id = uid())
  OR EXISTS (SELECT 1 FROM events WHERE id = event_service_providers.event_id AND user_id = uid())
);

-- RLS Policies for pledges
CREATE POLICY "Event owners can manage pledges for their events" ON pledges FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM events WHERE id = pledges.event_id AND user_id = uid())
);

-- Allow 'service_provider' as a valid user role (if not already updated)
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'super_admin', 'service_provider'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Skip test user insert - this will be created via auth signup
-- Note: To create a service provider user, they must sign up via auth first 