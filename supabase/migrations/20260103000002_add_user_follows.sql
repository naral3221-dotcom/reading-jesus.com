-- =====================================================
-- 팔로우 시스템 테이블 마이그레이션
-- 목적: 사용자 간 팔로우/팔로잉 기능 지원
-- =====================================================

-- 1. user_follows 테이블 생성
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 팔로우 방지
  UNIQUE(follower_id, following_id),

  -- 자기 자신 팔로우 방지
  CHECK (follower_id != following_id)
);

-- 2. 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created ON user_follows(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
-- 모든 사용자가 팔로우 관계 조회 가능
CREATE POLICY "Anyone can view follows"
  ON user_follows FOR SELECT
  USING (true);

-- 로그인한 사용자가 본인의 팔로우 추가 가능
CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- 로그인한 사용자가 본인의 팔로우 삭제 가능 (언팔로우)
CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- 5. profiles 테이블에 팔로워/팔로잉 카운트 추가 (선택적 - 성능 최적화용)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 6. 트리거 함수: 팔로우 시 카운트 업데이트
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 팔로워 증가 (팔로우 당한 사람)
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- 팔로잉 증가 (팔로우 한 사람)
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 팔로워 감소
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    -- 팔로잉 감소
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 트리거 생성
DROP TRIGGER IF EXISTS on_follow_change ON user_follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();
