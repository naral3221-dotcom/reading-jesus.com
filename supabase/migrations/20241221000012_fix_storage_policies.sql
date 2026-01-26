-- Storage bucket policies for comment_attachments
-- Run this in Supabase SQL Editor

-- First, create the bucket if it doesn't exist (must be done via dashboard or API)
-- Then run these policies:

-- Drop existing policies if any
DO $$
BEGIN
  -- Try to drop existing policies
  DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access to attachments" ON storage.objects;
EXCEPTION WHEN others THEN
  NULL;
END $$;

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

-- Also add policies for avatars bucket if needed
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Policy: Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own avatars
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
