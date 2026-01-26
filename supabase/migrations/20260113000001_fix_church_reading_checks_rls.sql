-- ============================================
-- church_reading_checks RLS 정책 수정
-- 목적: 교회 등록 여부를 profiles.church_id 뿐만 아니라
--       church_joined_at 필드로도 확인하여 정책 완화
-- ============================================

-- 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "Users can insert own church reading checks" ON church_reading_checks;

-- 새로운 INSERT 정책: 교회 등록 여부를 더 유연하게 확인
-- profiles.church_id가 일치하거나, church_joined_at이 있으면 허용
CREATE POLICY "Users can insert own church reading checks"
  ON church_reading_checks FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- 방법 1: profiles.church_id가 일치하는 경우
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.church_id = church_reading_checks.church_id
      )
      OR
      -- 방법 2: church_joined_at이 설정되어 있는 경우 (교회에 가입된 상태)
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.church_joined_at IS NOT NULL
      )
    )
  );

-- UPDATE 정책 추가 (upsert를 위해 필요)
DROP POLICY IF EXISTS "Users can update own church reading checks" ON church_reading_checks;

CREATE POLICY "Users can update own church reading checks"
  ON church_reading_checks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
