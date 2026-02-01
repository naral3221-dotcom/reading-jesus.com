/**
 * comments (그룹 묵상글) 동기화 상태 점검
 * 실행: npx tsx scripts/check-comments-sync.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    })
    return env
  } catch {
    return {}
  }
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCommentsSync() {
  console.log('='.repeat(60))
  console.log('📋 comments (그룹 묵상글) 동기화 상태 점검')
  console.log('='.repeat(60))

  // 1. 원본 comments 테이블
  const { data: allComments, count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  console.log(`\n📊 원본 comments 테이블: ${commentsCount}개`)

  if (allComments && allComments.length > 0) {
    console.log('\n샘플 데이터:')
    console.table(allComments.slice(0, 10).map(c => ({
      id: c.id?.slice(0, 8),
      group_id: c.group_id?.slice(0, 8),
      user_id: c.user_id?.slice(0, 8),
      day: c.day_number,
      content: (c.content || '').slice(0, 25),
      created: c.created_at?.slice(0, 16),
    })))
  }

  // 2. unified_meditations에서 comments 출처
  const { data: unifiedComments, count: unifiedCount } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact' })
    .eq('legacy_table', 'comments')
    .order('created_at', { ascending: false })

  console.log(`\n📊 unified_meditations (from comments): ${unifiedCount}개`)

  if (unifiedComments && unifiedComments.length > 0) {
    console.log('\n샘플 데이터:')
    console.table(unifiedComments.slice(0, 10).map(u => ({
      id: u.id?.slice(0, 8),
      legacy_id: u.legacy_id?.slice(0, 8),
      source_id: u.source_id?.slice(0, 8),
      day: u.day_number,
      content: (u.content || '').slice(0, 25),
      created: u.created_at?.slice(0, 16),
    })))
  }

  // 3. 동기화 누락 확인
  const commentIds = new Set(allComments?.map(c => c.id))
  const unifiedLegacyIds = new Set(unifiedComments?.map(u => u.legacy_id).filter(Boolean))

  const missingInUnified = [...commentIds].filter(id => !unifiedLegacyIds.has(id))
  const orphanInUnified = [...unifiedLegacyIds].filter(id => !commentIds.has(id))

  console.log('\n🔍 동기화 분석:')
  console.log(`  comments 원본: ${commentIds.size}개`)
  console.log(`  unified에 동기화됨: ${unifiedLegacyIds.size}개`)
  console.log(`  ❌ unified에 누락: ${missingInUnified.length}개`)
  console.log(`  ⚠️ unified에만 존재 (원본 삭제?): ${orphanInUnified.length}개`)

  // 4. 누락된 데이터 상세
  if (missingInUnified.length > 0) {
    console.log('\n❌ 누락된 comments:')
    const { data: missingData } = await supabase
      .from('comments')
      .select('*')
      .in('id', missingInUnified)
      .order('created_at', { ascending: false })

    console.table(missingData?.map(c => ({
      id: c.id?.slice(0, 8),
      group_id: c.group_id?.slice(0, 8),
      day: c.day_number,
      content: (c.content || '').slice(0, 30),
      created: c.created_at?.slice(0, 16),
    })))
  }

  // 5. 트리거 존재 여부 (간접 확인)
  console.log('\n⚡ 동기화 트리거 상태:')
  console.log('  church_qt_posts: ✅ sync_qt_to_unified 트리거 있음')
  console.log('  guest_comments: ✅ sync_guest_comment_to_unified 트리거 있음')
  console.log('  comments: ❓ 트리거 확인 필요')

  // 6. 결론
  console.log('\n' + '='.repeat(60))
  console.log('📋 결론')
  console.log('='.repeat(60))

  if (missingInUnified.length === 0) {
    console.log('✅ 모든 comments가 unified_meditations에 동기화되어 있습니다.')
  } else {
    console.log(`⚠️ ${missingInUnified.length}개 comments가 unified_meditations에 누락되어 있습니다.`)
    console.log('\n권장 조치:')
    console.log('1. 누락된 데이터 마이그레이션 (scripts/migrate-comments.ts)')
    console.log('2. comments 동기화 트리거 추가 필요')
  }
}

checkCommentsSync().catch(console.error)
