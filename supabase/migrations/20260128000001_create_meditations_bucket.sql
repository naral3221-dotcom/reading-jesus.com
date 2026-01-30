-- 묵상 길잡이 오디오 파일용 Storage 버킷 생성
-- 공개 버킷으로 설정 (오디오는 로그인 없이 접근 가능해야 함)

-- 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meditations',
  'meditations',
  true,
  52428800, -- 50MB limit per file
  ARRAY['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS 정책: 누구나 읽기 가능
CREATE POLICY "Anyone can read meditation audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'meditations');

-- RLS 정책: 인증된 사용자만 업로드 가능 (관리용)
CREATE POLICY "Authenticated users can upload meditation audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meditations'
  AND auth.role() = 'authenticated'
);

-- RLS 정책: 인증된 사용자만 삭제 가능 (관리용)
CREATE POLICY "Authenticated users can delete meditation audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meditations'
  AND auth.role() = 'authenticated'
);
