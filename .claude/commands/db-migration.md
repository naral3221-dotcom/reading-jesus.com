# Supabase DB 마이그레이션 생성

Supabase 데이터베이스 마이그레이션 파일을 생성합니다.

## 입력
- 마이그레이션 설명: $ARGUMENTS

## 작업
1. `supabase/migrations/` 폴더에 마이그레이션 파일 생성
2. 파일명: `{timestamp}_{설명}.sql`
3. RLS 정책 포함

## 현재 테이블 구조

### profiles
```sql
- id (uuid, PK, FK -> auth.users)
- nickname (text)
- avatar_url (text)
- created_at, updated_at
```

### groups
```sql
- id (uuid, PK)
- name (text)
- description (text)
- start_date (date)
- invite_code (text, unique)
- created_by (uuid, FK -> auth.users)
- created_at
```

### group_members
```sql
- id (uuid, PK)
- group_id (uuid, FK -> groups)
- user_id (uuid, FK -> auth.users)
- role (text: 'admin' | 'member')
- joined_at
```

### daily_checks
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- group_id (uuid, FK -> groups)
- day_number (integer)
- is_read (boolean)
- checked_at
- UNIQUE(user_id, group_id, day_number)
```

### comments
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- group_id (uuid, FK -> groups)
- day_number (integer)
- content (text)
- likes_count (integer, default 0)
- created_at, updated_at
```

### comment_likes
```sql
- id (uuid, PK)
- comment_id (uuid, FK -> comments)
- user_id (uuid, FK -> auth.users)
- created_at
- UNIQUE(comment_id, user_id)
```

## 마이그레이션 템플릿

### 컬럼 추가
```sql
-- Add is_anonymous column to comments table
ALTER TABLE comments
ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;

-- Update RLS if needed
```

### 테이블 생성
```sql
-- Create new_table
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON new_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## RLS 정책 패턴
- SELECT: `auth.uid() = user_id` 또는 그룹 멤버 확인
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

## 체크리스트
- [ ] 테이블/컬럼 이름은 snake_case
- [ ] UUID는 gen_random_uuid() 사용
- [ ] 타임스탬프는 TIMESTAMPTZ
- [ ] FK에 ON DELETE CASCADE 설정
- [ ] RLS 활성화 및 정책 추가
