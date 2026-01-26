-- =====================================================
-- 교회 코드 자동 생성 트리거
-- INSERT 시 code가 비어있으면 자동으로 생성
-- =====================================================

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION auto_generate_church_code()
RETURNS TRIGGER AS $$
BEGIN
  -- code가 비어있거나 NULL이면 자동 생성
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_church_code(COALESCE(NEW.region_code, 'SE'));
  END IF;

  -- write_token이 비어있으면 자동 생성
  IF NEW.write_token IS NULL OR NEW.write_token = '' THEN
    NEW.write_token := LOWER(NEW.code) || '-' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;

  -- admin_token이 비어있으면 자동 생성
  IF NEW.admin_token IS NULL OR NEW.admin_token = '' THEN
    NEW.admin_token := 'admin-' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5)) || '-' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 16));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- INSERT 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_generate_church_code ON churches;
CREATE TRIGGER trigger_auto_generate_church_code
  BEFORE INSERT ON churches
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_church_code();

-- 코멘트
COMMENT ON FUNCTION auto_generate_church_code() IS '교회 등록 시 code, write_token, admin_token 자동 생성';
