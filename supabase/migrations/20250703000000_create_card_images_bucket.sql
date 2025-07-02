/*
  # Create card-images storage bucket
  This migration creates the storage bucket for storing generated card images
  and sets up appropriate RLS policies for access control.
*/

-- Create the storage bucket for card images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images',
  'card-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload card images for their own events" ON storage.objects;
DROP POLICY IF EXISTS "Users can view card images for their own events" ON storage.objects;
DROP POLICY IF EXISTS "Users can update card images for their own events" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete card images for their own events" ON storage.objects;
DROP POLICY IF EXISTS "Public can view card images" ON storage.objects;

-- Enable RLS on the storage.objects table for the card-images bucket
-- Allow authenticated users to upload to card-images bucket
CREATE POLICY "Users can upload card images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'card-images');

-- Allow authenticated users to view card images
CREATE POLICY "Users can view card images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'card-images');

-- Allow authenticated users to update card images
CREATE POLICY "Users can update card images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'card-images');

-- Allow authenticated users to delete card images
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