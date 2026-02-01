/**
 * 누락된 데이터 정확히 찾기
 * 실행: npx tsx scripts/find-missing-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
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

async function findMissingData() {
  console.log('🔍 누락된 데이터 정확히 찾기\n')
  console.log('='.repeat(80))

  // ========================================
  // 1. 모든 church_qt_posts ID 가져오기
  // ========================================
  const { data: allQtPosts } = await supabase
    .from('church_qt_posts')
    .select('id, user_id, church_id, day_number, title, content, my_sentence, meditation_answer, gratitude, my_prayer, day_review, likes_count, is_anonymous, visibility, created_at')
    .order('created_at', { ascending: false })

  // ========================================
  // 2. unified_meditations의 모든 legacy_id 가져오기
  // ========================================
  const { data: allUnified } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('source_type', 'church')
    .eq('legacy_table', 'church_qt_posts')

  const unifiedLegacyIds = new Set(allUnified?.map(u => u.legacy_id).filter(Boolean))

  console.log(`\n📊 기본 통계:`)
  console.log(`church_qt_posts 총: ${allQtPosts?.length}개`)
  console.log(`unified (church_qt_posts에서 마이그레이션): ${unifiedLegacyIds.size}개`)

  // ========================================
  // 3. 누락된 데이터 찾기
  // ========================================
  const missingPosts = allQtPosts?.filter(qt => !unifiedLegacyIds.has(qt.id)) || []

  console.log(`\n❌ unified_meditations에 없는 church_qt_posts: ${missingPosts.length}개`)

  if (missingPosts.length > 0) {
    // Day별 분포
    const dayDistribution: Record<number, number> = {}
    missingPosts.forEach(p => {
      const day = p.day_number || 0
      dayDistribution[day] = (dayDistribution[day] || 0) + 1
    })

    console.log('\n📅 누락 데이터 Day별 분포:')
    Object.entries(dayDistribution)
      .sort(([a], [b]) => Number(b) - Number(a))
      .forEach(([day, count]) => {
        console.log(`  Day ${day}: ${count}개`)
      })

    // 날짜별 분포
    const dateDistribution: Record<string, number> = {}
    missingPosts.forEach(p => {
      const date = p.created_at?.split('T')[0] || 'unknown'
      dateDistribution[date] = (dateDistribution[date] || 0) + 1
    })

    console.log('\n📆 누락 데이터 생성일별 분포:')
    Object.entries(dateDistribution)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 15)
      .forEach(([date, count]) => {
        console.log(`  ${date}: ${count}개`)
      })

    // 샘플 출력
    console.log('\n📋 누락된 데이터 샘플 (최근 20개):')
    console.table(missingPosts.slice(0, 20).map(p => ({
      id: p.id.slice(0, 8),
      user_id: p.user_id?.slice(0, 8) || 'guest',
      day: p.day_number,
      title: (p.title || '').slice(0, 15) || '-',
      my_sentence: (p.my_sentence || '').slice(0, 15) || '-',
      likes: p.likes_count,
      anon: p.is_anonymous,
      vis: p.visibility,
      created: p.created_at?.slice(0, 16)
    })))

    // 누락된 ID 전체 저장
    console.log('\n💾 누락된 ID 목록 저장...')
    const missingIds = missingPosts.map(p => p.id)
    writeFileSync('missing_qt_post_ids.json', JSON.stringify(missingIds, null, 2))
    console.log(`missing_qt_post_ids.json에 ${missingIds.length}개 ID 저장됨`)

    // ========================================
    // 4. 패턴 분석 - 왜 누락되었는지
    // ========================================
    console.log('\n🔬 누락 원인 분석:')

    // user_id 유무
    const withUserId = missingPosts.filter(p => p.user_id).length
    const withoutUserId = missingPosts.filter(p => !p.user_id).length
    console.log(`\n- user_id 있음: ${withUserId}개`)
    console.log(`- user_id 없음 (게스트): ${withoutUserId}개`)

    // visibility 분포
    const visibilityDist: Record<string, number> = {}
    missingPosts.forEach(p => {
      const vis = p.visibility || 'null'
      visibilityDist[vis] = (visibilityDist[vis] || 0) + 1
    })
    console.log('\n- visibility 분포:')
    Object.entries(visibilityDist).forEach(([vis, count]) => {
      console.log(`    ${vis}: ${count}개`)
    })

    // is_anonymous 분포
    const anonCount = missingPosts.filter(p => p.is_anonymous).length
    console.log(`\n- is_anonymous=true: ${anonCount}개`)

    // content 유무
    const hasContent = missingPosts.filter(p => p.content || p.my_sentence || p.meditation_answer).length
    console.log(`- 실제 콘텐츠 있음: ${hasContent}개`)
    console.log(`- 콘텐츠 없음 (빈 글): ${missingPosts.length - hasContent}개`)
  }

  // ========================================
  // 5. guest_comments 분석
  // ========================================
  console.log('\n' + '='.repeat(80))
  console.log('\n👻 guest_comments 분석:\n')

  const { data: allGuestComments } = await supabase
    .from('guest_comments')
    .select('id')

  const { data: guestInUnified } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')

  const guestIds = new Set(allGuestComments?.map(g => g.id))
  const guestLegacyIds = new Set(guestInUnified?.map(u => u.legacy_id).filter(Boolean))

  const missingGuests = [...guestIds].filter(id => !guestLegacyIds.has(id))

  console.log(`guest_comments 총: ${guestIds.size}개`)
  console.log(`unified에 마이그레이션됨: ${guestLegacyIds.size}개`)
  console.log(`누락됨: ${missingGuests.length}개`)

  if (missingGuests.length > 0) {
    const { data: missingGuestData } = await supabase
      .from('guest_comments')
      .select('id, guest_name, day_number, created_at')
      .in('id', missingGuests.slice(0, 10))

    console.log('\n누락된 guest_comments 샘플:')
    console.table(missingGuestData?.map(g => ({
      id: g.id.slice(0, 8),
      name: g.guest_name?.slice(0, 10),
      day: g.day_number,
      created: g.created_at?.slice(0, 16)
    })))
  }

  // ========================================
  // 결론
  // ========================================
  console.log('\n' + '='.repeat(80))
  console.log('\n📋 결론:\n')

  const totalMissing = missingPosts.length + missingGuests.length
  console.log(`⚠️ 총 ${totalMissing}개의 데이터가 unified_meditations에 누락됨:`)
  console.log(`   - church_qt_posts: ${missingPosts.length}개`)
  console.log(`   - guest_comments: ${missingGuests.length}개`)

  console.log('\n🔧 권장 조치:')
  console.log('1. 누락된 데이터를 unified_meditations에 마이그레이션')
  console.log('2. 피드가 어떤 테이블을 사용하는지 코드 확인')
  console.log('3. 새 글 작성 시 두 테이블에 모두 저장되는지 확인')

  console.log('\n✅ 분석 완료!')
}

findMissingData().catch(console.error)
