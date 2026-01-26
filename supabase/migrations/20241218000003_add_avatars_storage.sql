-- Create avatars storage bucket
-- Run this in Supabase SQL Editor or create the bucket manually in the dashboard

-- Note: Storage bucket creation must be done through Supabase Dashboard or API
-- This file documents the required setup

/*
1. Go to Supabase Dashboard > Storage
2. Create a new bucket named "avatars"
3. Set it to "Public" for avatar images
4. Add the following policies:

-- Policy: Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all avatars
CREATE POLICY "Public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
*/

-- If using Supabase CLI, you can run:
-- supabase storage create avatars --public
