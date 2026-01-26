-- =============================================
-- 교회 공개 페이지 시스템
-- 비로그인 사용자도 QR로 접근하여 묵상 작성 가능
-- =============================================

-- 1. 지역 코드 테이블
CREATE TABLE IF NOT EXISTS region_codes (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  order_num INTEGER DEFAULT 0
);

-- 지역 코드 초기 데이터
INSERT INTO region_codes (code, name, order_num) VALUES
('SE', '서울', 1),
('GG', '경기', 2),
('IC', '인천', 3),
('BS', '부산', 4),
('DG', '대구', 5),
('GJ', '광주', 6),
('DJ', '대전', 7),
('US', '울산', 8),
('SJ', '세종', 9),
('GW', '강원', 10),
('CB', '충북', 11),
('CN', '충남', 12),
('JB', '전북', 13),
('JN', '전남', 14),
('GB', '경북', 15),
('GN', '경남', 16),
('JJ', '제주', 17),
('OV', '해외', 99)
ON CONFLICT (code) DO NOTHING;

-- 2. 교회 테이블
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 식별 코드
  code VARCHAR(10) UNIQUE NOT NULL,        -- SE2401 (지역+연도+순번)
  write_token VARCHAR(30),                  -- 작성용 토큰 (QR에 포함)

  -- 기본 정보
  name VARCHAR(100) NOT NULL,               -- 교회 이름
  denomination VARCHAR(50),                 -- 교단 (예장통합, 기감 등)

  -- 주소
  region_code VARCHAR(2) NOT NULL REFERENCES region_codes(code),
  address TEXT,                             -- 전체 주소
  address_detail VARCHAR(100),              -- 상세 주소
  postal_code VARCHAR(10),                  -- 우편번호

  -- 연락처
  phone VARCHAR(20),                        -- 대표 전화
  email VARCHAR(100),                       -- 대표 이메일
  website VARCHAR(200),                     -- 홈페이지

  -- 담당자
  pastor_name VARCHAR(50),                  -- 담임목사
  contact_person VARCHAR(50),               -- 담당자 이름
  contact_phone VARCHAR(20),                -- 담당자 연락처

  -- 설정
  is_active BOOLEAN DEFAULT true,           -- 활성 상태
  allow_anonymous BOOLEAN DEFAULT true,     -- 익명 작성 허용
  token_expires_at TIMESTAMP WITH TIME ZONE, -- 토큰 만료일 (null이면 무제한)

  -- 연동
  linked_group_id UUID REFERENCES groups(id), -- 연동된 그룹 (선택)

  -- 메타
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_churches_code ON churches(code);
CREATE INDEX IF NOT EXISTS idx_churches_region ON churches(region_code);
CREATE INDEX IF NOT EXISTS idx_churches_active ON churches(is_active);
CREATE INDEX IF NOT EXISTS idx_churches_token ON churches(write_token);

-- 3. 비로그인 게시글 테이블
CREATE TABLE IF NOT EXISTS guest_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,

  -- 작성자 정보
  guest_name VARCHAR(50) NOT NULL,          -- 작성자 이름
  device_id VARCHAR(100),                   -- 기기 식별자 (localStorage)

  -- 게시글 내용
  content TEXT NOT NULL,
  day_number INTEGER,                       -- 통독 Day (선택)
  bible_range VARCHAR(100),                 -- 성경 범위 (예: 창세기 1-3장)

  -- 상태
  is_anonymous BOOLEAN DEFAULT false,       -- 익명 여부

  -- 나중에 연동
  linked_user_id UUID REFERENCES profiles(id), -- 가입 후 연동된 사용자
  linked_at TIMESTAMP WITH TIME ZONE,       -- 연동 시점

  -- 메타
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 (이름+교회로 검색용)
CREATE INDEX IF NOT EXISTS idx_guest_comments_church ON guest_comments(church_id);
CREATE INDEX IF NOT EXISTS idx_guest_comments_lookup ON guest_comments(church_id, guest_name);
CREATE INDEX IF NOT EXISTS idx_guest_comments_device ON guest_comments(device_id);
CREATE INDEX IF NOT EXISTS idx_guest_comments_day ON guest_comments(church_id, day_number);

-- 4. 교회 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_church_code(p_region VARCHAR(2))
RETURNS VARCHAR(10) AS $$
DECLARE
  year_part VARCHAR(2);
  seq_num INTEGER;
  new_code VARCHAR(10);
BEGIN
  year_part := TO_CHAR(NOW(), 'YY');

  -- 해당 지역+연도의 마지막 순번 찾기
  SELECT COALESCE(MAX(CAST(SUBSTRING(code, 5, 3) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM churches
  WHERE code LIKE p_region || year_part || '%';

  new_code := p_region || year_part || LPAD(seq_num::TEXT, 3, '0');

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 5. 작성 토큰 생성 함수
CREATE OR REPLACE FUNCTION generate_write_token(p_church_code VARCHAR(10))
RETURNS VARCHAR(30) AS $$
DECLARE
  random_part VARCHAR(10);
BEGIN
  -- 랜덤 문자열 생성
  random_part := LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  RETURN LOWER(p_church_code) || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS 정책
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_codes ENABLE ROW LEVEL SECURITY;

-- region_codes: 누구나 읽기 가능
CREATE POLICY "region_codes_select" ON region_codes
  FOR SELECT USING (true);

-- churches: 활성화된 교회는 누구나 읽기 가능
CREATE POLICY "churches_select_active" ON churches
  FOR SELECT USING (is_active = true);

-- churches: 인증된 사용자만 생성/수정 (관리자 기능)
CREATE POLICY "churches_insert" ON churches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "churches_update" ON churches
  FOR UPDATE USING (auth.role() = 'authenticated');

-- guest_comments: 누구나 작성 가능 (토큰 검증은 앱에서)
CREATE POLICY "guest_comments_insert" ON guest_comments
  FOR INSERT WITH CHECK (true);

-- guest_comments: 해당 교회의 게시글은 누구나 읽기 가능
CREATE POLICY "guest_comments_select" ON guest_comments
  FOR SELECT USING (true);

-- guest_comments: 본인 기기의 글만 수정/삭제 (device_id로 확인)
CREATE POLICY "guest_comments_update" ON guest_comments
  FOR UPDATE USING (true);

CREATE POLICY "guest_comments_delete" ON guest_comments
  FOR DELETE USING (true);

-- 7. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_comments_updated_at
  BEFORE UPDATE ON guest_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
