-- =============================================
-- 교회 테이블 RLS 정책 수정
-- 인증된 사용자가 교회를 등록할 수 있도록 수정
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "churches_insert" ON churches;
DROP POLICY IF EXISTS "churches_update" ON churches;
DROP POLICY IF EXISTS "churches_delete" ON churches;
DROP POLICY IF EXISTS "churches_select_active" ON churches;

-- 새 정책 생성

-- SELECT: 활성화된 교회는 누구나 볼 수 있음
CREATE POLICY "churches_select_active" ON churches
  FOR SELECT USING (is_active = true);

-- SELECT: 인증된 사용자는 모든 교회 볼 수 있음 (관리 목적)
CREATE POLICY "churches_select_auth" ON churches
  FOR SELECT TO authenticated USING (true);

-- INSERT: 인증된 사용자만 등록 가능
CREATE POLICY "churches_insert" ON churches
  FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE: 인증된 사용자만 수정 가능
CREATE POLICY "churches_update" ON churches
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DELETE: 인증된 사용자만 삭제 가능
CREATE POLICY "churches_delete" ON churches
  FOR DELETE TO authenticated USING (true);
