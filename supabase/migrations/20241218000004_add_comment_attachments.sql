-- Comment attachments table
CREATE TABLE IF NOT EXISTS comment_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL, -- 'image' | 'pdf'
  file_name text NOT NULL,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comment_attachments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all attachments in their groups"
ON comment_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM comments c
    JOIN group_members gm ON c.group_id = gm.group_id
    WHERE c.id = comment_attachments.comment_id
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own attachments"
ON comment_attachments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own attachments"
ON comment_attachments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id);

-- Storage bucket setup instructions:
/*
1. Go to Supabase Dashboard > Storage
2. Create a new bucket named "comment-attachments"
3. Set it to "Public" (or configure signed URLs for private)
4. Add the following policies:

-- Policy: Allow authenticated users to upload attachments
CREATE POLICY "Users can upload comment attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comment-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own attachments
CREATE POLICY "Users can delete own comment attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comment-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access
CREATE POLICY "Public read access to comment attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'comment-attachments');
*/
