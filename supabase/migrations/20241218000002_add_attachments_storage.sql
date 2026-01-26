-- Create comment_attachments storage bucket
-- Run this in Supabase SQL Editor or create the bucket manually in the dashboard

-- Note: Storage bucket creation must be done through Supabase Dashboard or API
-- This file documents the required setup

/*
1. Go to Supabase Dashboard > Storage
2. Create a new bucket named "comment_attachments"
3. Set it to "Public" for viewing attachments
4. Add the following policies:

-- Policy: Allow authenticated users to upload attachments
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comment_attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own attachments
CREATE POLICY "Users can update own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'comment_attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comment_attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all attachments
CREATE POLICY "Public read access to attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'comment_attachments');
*/

-- If using Supabase CLI, you can run:
-- supabase storage create comment_attachments --public
