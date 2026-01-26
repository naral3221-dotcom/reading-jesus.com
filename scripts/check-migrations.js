#!/usr/bin/env node

/**
 * 마이그레이션 상태 확인 스크립트
 *
 * 사용법:
 *   node scripts/check-migrations.js
 *
 * 기능:
 *   1. Supabase에 실제 존재하는 테이블/컬럼 확인
 *   2. 로컬 마이그레이션 파일과 비교
 *   3. 누락된 테이블/컬럼 리포트
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드 (.env.local)
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 필수 테이블 목록 (마이그레이션에서 정의한 테이블들)
const REQUIRED_TABLES = {
  // 기본 테이블
  profiles: ['id', 'nickname', 'avatar_url', 'email', 'has_completed_onboarding'],
  groups: ['id', 'name', 'description', 'start_date', 'invite_code', 'created_by', 'bible_range_type', 'bible_range_books', 'schedule_mode', 'total_days'],
  group_members: ['id', 'group_id', 'user_id', 'role', 'rank_id'],
  daily_checks: ['id', 'user_id', 'group_id', 'day_number', 'is_read'],
  comments: ['id', 'user_id', 'group_id', 'day_number', 'content', 'is_anonymous', 'is_pinned', 'likes_count'],
  comment_likes: ['id', 'comment_id', 'user_id'],
  comment_replies: ['id', 'comment_id', 'user_id', 'content', 'is_anonymous'],

  // 그룹 관련
  group_notices: ['id', 'group_id', 'user_id', 'title', 'content', 'is_pinned'],
  group_meetings: ['id', 'group_id', 'created_by', 'title', 'meeting_type', 'location', 'meeting_link', 'purpose'],
  meeting_participants: ['id', 'meeting_id', 'user_id'],
  member_ranks: ['id', 'group_id', 'name', 'level', 'color', 'permissions'],

  // 알림
  notifications: ['id', 'user_id', 'type', 'title', 'message', 'is_read'],
  notification_settings: ['id', 'user_id', 'is_enabled', 'notify_time', 'notify_days', 'custom_message'],

  // 개인 프로젝트
  personal_projects: ['id', 'user_id', 'name', 'start_date', 'total_days'],
  project_daily_checks: ['id', 'project_id', 'day_number', 'is_read'],

  // 첨부파일
  comment_attachments: ['id', 'comment_id', 'file_url', 'file_type'],

  // 교회 관련
  churches: ['id', 'name', 'code', 'admin_token', 'address'],
  church_members: ['id', 'church_id', 'user_id', 'role'],
  church_qt_posts: ['id', 'church_id', 'date', 'title', 'content'],
  church_qt_comments: ['id', 'post_id', 'content', 'is_anonymous'],
  guest_comment_likes: ['id', 'comment_id', 'guest_id'],

  // 기도제목
  prayer_requests: ['id', 'group_id', 'user_id', 'content', 'is_anonymous', 'is_answered', 'support_count'],
  prayer_support: ['id', 'prayer_id', 'user_id'],

  // 배지 시스템
  badge_definitions: ['id', 'code', 'name', 'description', 'icon', 'category', 'requirement_type', 'requirement_value'],
  user_badges: ['id', 'user_id', 'badge_id', 'group_id', 'earned_at', 'is_notified'],
};

async function checkTable(tableName, requiredColumns) {
  try {
    // 테이블 존재 여부 확인 (1개 row만 가져와서 체크)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { exists: false, missingColumns: requiredColumns };
      }
      // RLS 등 다른 에러는 테이블은 존재하는 것으로 간주
      return { exists: true, missingColumns: [], note: error.message };
    }

    // 컬럼 확인 (첫 번째 row가 있으면 키 확인)
    const existingColumns = data && data.length > 0 ? Object.keys(data[0]) : [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    return { exists: true, missingColumns, existingColumns };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function main() {
  console.log('\n🔍 Supabase 마이그레이션 상태 확인\n');
  console.log('=' .repeat(60));

  const results = {
    existing: [],
    missing: [],
    partial: [],
    errors: [],
  };

  for (const [tableName, columns] of Object.entries(REQUIRED_TABLES)) {
    const result = await checkTable(tableName, columns);

    if (!result.exists) {
      results.missing.push({ table: tableName, columns });
      console.log(`❌ ${tableName} - 테이블 없음`);
    } else if (result.missingColumns && result.missingColumns.length > 0) {
      results.partial.push({ table: tableName, missingColumns: result.missingColumns });
      console.log(`⚠️  ${tableName} - 누락 컬럼: ${result.missingColumns.join(', ')}`);
    } else if (result.note) {
      results.errors.push({ table: tableName, note: result.note });
      console.log(`✅ ${tableName} (RLS 제한)`);
    } else {
      results.existing.push(tableName);
      console.log(`✅ ${tableName}`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 요약:\n');
  console.log(`   ✅ 정상: ${results.existing.length}개`);
  console.log(`   ⚠️  부분 누락: ${results.partial.length}개`);
  console.log(`   ❌ 테이블 없음: ${results.missing.length}개`);

  if (results.missing.length > 0) {
    console.log('\n🔧 누락된 테이블 생성이 필요합니다:\n');
    results.missing.forEach(({ table }) => {
      console.log(`   - ${table}`);
    });
  }

  if (results.partial.length > 0) {
    console.log('\n🔧 컬럼 추가가 필요한 테이블:\n');
    results.partial.forEach(({ table, missingColumns }) => {
      console.log(`   - ${table}: ${missingColumns.join(', ')}`);
    });
  }

  // 결과를 JSON으로 저장
  const outputPath = path.join(__dirname, '../migration-status.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    checkedAt: new Date().toISOString(),
    summary: {
      existing: results.existing.length,
      partial: results.partial.length,
      missing: results.missing.length,
    },
    details: results,
  }, null, 2));

  console.log(`\n📁 상세 결과: migration-status.json\n`);
}

main().catch(console.error);
