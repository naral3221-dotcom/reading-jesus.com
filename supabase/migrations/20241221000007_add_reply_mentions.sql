-- 댓글 답글에 대댓글 및 멘션 기능 추가
-- parent_reply_id: 대댓글인 경우 부모 답글 ID
-- mentioned_user_id: 멘션된 사용자 ID (@username 형태)

-- 1. comment_replies 테이블에 parent_reply_id 컬럼 추가
ALTER TABLE comment_replies
ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES comment_replies(id) ON DELETE CASCADE;

-- 2. comment_replies 테이블에 mentioned_user_id 컬럼 추가
ALTER TABLE comment_replies
ADD COLUMN IF NOT EXISTS mentioned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_comment_replies_parent_reply_id ON comment_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_mentioned_user_id ON comment_replies(mentioned_user_id);
