-- =====================================================
-- church_admins RLS 무한 재귀 수정
-- 문제: church_admins_select_same_church 정책이 자기 테이블을 서브쿼리로 참조
-- =====================================================

-- 기존 문제 정책 삭제
DROP POLICY IF EXISTS "church_admins_select_same_church" ON church_admins;

-- 수정된 정책: 본인 조회만으로 충분 (같은 교회 관리자 목록은 시스템 관리자만)
-- 이미 church_admins_select_own 정책이 본인 조회를 허용함

-- 선택사항: 같은 교회 관리자 조회가 필요하면 SECURITY DEFINER 함수 사용
CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID AS $$
  SELECT church_id FROM church_admins WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 같은 교회 관리자 조회 (무한 재귀 방지)
CREATE POLICY "church_admins_select_same_church" ON church_admins
  FOR SELECT USING (
    church_id = get_my_church_id()
  );
