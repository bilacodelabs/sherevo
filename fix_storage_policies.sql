-- Fix storage policies for card-images bucket
-- Run this in your Supabase Dashboard SQL Editor

-- First, create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images',
  'card-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can upload card images for their own events" ON storage.objects;
DROP POLICY IF EXISTS "Users can view card images for their own events" ON storage.objects;
DROP POLICY IF EXISTS "Users can update card images for their own events" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete card images for their own events" ON storage.objects;
DROP POLICY IF EXISTS "Public can view card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete card images" ON storage.objects;

-- Create simple, permissive policies for authenticated users
CREATE POLICY "Users can upload card images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'card-images');

CREATE POLICY "Users can view card images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'card-images');

CREATE POLICY "Users can update card images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'card-images');

CREATE POLICY "Users can delete card images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'card-images');

-- Allow public access to view card images (for WhatsApp sharing)
CREATE POLICY "Public can view card images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'card-images'); 