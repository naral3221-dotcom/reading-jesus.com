// Supabase 마이그레이션 실행 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://jfxbkjohppqmyjyhzolx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeGJram9ocHBxbXlqeWh6b2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0MzA5MCwiZXhwIjoyMDgxNTE5MDkwfQ.__mbK_ExNfjhF4WdkHwSdWwn03lmkW9v2jzEOg5jVP0';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('답글 테이블 생성 시작...\n');

  // 1. guest_comment_replies 테이블이 있는지 확인
  const { data: existingTable, error: checkError } = await supabase
    .from('guest_comment_replies')
    .select('id')
    .limit(1);

  if (checkError && checkError.code === '42P01') {
    console.log('guest_comment_replies 테이블이 없습니다.');
    console.log('\n⚠️  Supabase 대시보드에서 직접 SQL을 실행해야 합니다.');
    console.log('SQL 파일 위치: supabase/manual_sql/create_reply_tables.sql');
    console.log('\n1. https://supabase.com/dashboard 로 이동');
    console.log('2. 프로젝트 선택 후 SQL Editor 클릭');
    console.log('3. SQL 파일 내용 복사하여 붙여넣기');
    console.log('4. Run 버튼 클릭');
  } else if (checkError) {
    console.log('테이블 확인 에러:', checkError.message);
  } else {
    console.log('✅ guest_comment_replies 테이블이 이미 존재합니다.');
  }

  // 2. church_qt_post_replies 테이블이 있는지 확인
  const { data: existingTable2, error: checkError2 } = await supabase
    .from('church_qt_post_replies')
    .select('id')
    .limit(1);

  if (checkError2 && checkError2.code === '42P01') {
    console.log('church_qt_post_replies 테이블이 없습니다.');
  } else if (checkError2) {
    console.log('테이블 확인 에러:', checkError2.message);
  } else {
    console.log('✅ church_qt_post_replies 테이블이 이미 존재합니다.');
  }

  // 테이블이 없으면 SQL 파일 내용 출력
  if ((checkError && checkError.code === '42P01') || (checkError2 && checkError2.code === '42P01')) {
    console.log('\n======= SQL 내용 =======\n');
    const sqlPath = path.join(__dirname, '../supabase/manual_sql/create_reply_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    console.log(sqlContent);
  }
}

runMigration().catch(console.error);
