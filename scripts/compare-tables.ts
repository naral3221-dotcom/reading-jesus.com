/**
 * church_qt_posts vs unified_meditations 비교 분석
 * 실행: npx tsx scripts/compare-tables.ts
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

async function compareData() {
  console.log('🔍 church_qt_posts vs unified_meditations 비교 분석\n')
  console.log('='.repeat(80))

  // ========================================
  // 1. 기본 통계
  // ========================================
  console.log('\n📊 1. 기본 통계\n')

  const { count: qtCount } = await supabase.from('church_qt_posts').select('*', { count: 'exact', head: true })
  const { count: unifiedCount } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true })
  const { count: unifiedChurchCount } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('source_type', 'church')

  console.log(`church_qt_posts 총 레코드: ${qtCount}`)
  console.log(`unified_meditations 총 레코드: ${unifiedCount}`)
  console.log(`unified_meditations (source_type='church'): ${unifiedChurchCount}`)
  console.log(`\n⚠️ 차이: ${(qtCount || 0) - (unifiedChurchCount || 0)}개`)

  // ========================================
  // 2. Day별 분포 비교
  // ========================================
  console.log('\n📅 2. Day별 데이터 분포 비교\n')

  // church_qt_posts는 date 기반
  const { data: qtByDate } = await supabase
    .from('church_qt_posts')
    .select('date')
    .order('date', { ascending: true })

  // unified_meditations는 day_number 기반
  const { data: unifiedByDay } = await supabase
    .from('unified_meditations')
    .select('day_number, qt_date')
    .eq('source_type', 'church')
    .order('day_number', { ascending: true })

  // 날짜별 카운트
  const qtDateCount: Record<string, number> = {}
  qtByDate?.forEach(item => {
    const date = item.date
    qtDateCount[date] = (qtDateCount[date] || 0) + 1
  })

  const unifiedDayCount: Record<number, number> = {}
  unifiedByDay?.forEach(item => {
    const day = item.day_number
    if (day) unifiedDayCount[day] = (unifiedDayCount[day] || 0) + 1
  })

  console.log('church_qt_posts (날짜별 분포 - 최근 10일):')
  const sortedDates = Object.keys(qtDateCount).sort().reverse().slice(0, 10)
  sortedDates.forEach(date => {
    console.log(`  ${date}: ${qtDateCount[date]}개`)
  })

  console.log('\nunified_meditations (day_number별 분포 - 최근 10일):')
  const sortedDays = Object.keys(unifiedDayCount).map(Number).sort((a, b) => b - a).slice(0, 10)
  sortedDays.forEach(day => {
    console.log(`  Day ${day}: ${unifiedDayCount[day]}개`)
  })

  // ========================================
  // 3. 사용자별 비교
  // ========================================
  console.log('\n👤 3. 사용자별 데이터 비교\n')

  const { data: qtUsers } = await supabase
    .from('church_qt_posts')
    .select('user_id')

  const { data: unifiedUsers } = await supabase
    .from('unified_meditations')
    .select('user_id')
    .eq('source_type', 'church')

  const qtUserIds = new Set(qtUsers?.map(u => u.user_id).filter(Boolean))
  const unifiedUserIds = new Set(unifiedUsers?.map(u => u.user_id).filter(Boolean))

  console.log(`church_qt_posts 작성자 수 (user_id 있는): ${qtUserIds.size}명`)
  console.log(`unified_meditations 작성자 수 (user_id 있는): ${unifiedUserIds.size}명`)

  // church_qt_posts에만 있는 user_id
  const onlyInQt = [...qtUserIds].filter(id => !unifiedUserIds.has(id))
  console.log(`\n⚠️ church_qt_posts에만 있는 사용자: ${onlyInQt.length}명`)
  if (onlyInQt.length > 0) {
    console.log('  IDs:', onlyInQt.slice(0, 5).join(', '), onlyInQt.length > 5 ? '...' : '')
  }

  // ========================================
  // 4. 누락된 데이터 상세 분석
  // ========================================
  console.log('\n🔎 4. 누락된 데이터 상세 분석\n')

  // church_qt_posts 전체 조회
  const { data: allQtPosts } = await supabase
    .from('church_qt_posts')
    .select('id, user_id, date, title, created_at, likes_count')
    .order('created_at', { ascending: false })

  // unified_meditations에서 legacy_id 조회
  const { data: allUnified } = await supabase
    .from('unified_meditations')
    .select('id, legacy_id, legacy_table, user_id, day_number, created_at')
    .eq('source_type', 'church')

  // legacy_id로 매핑
  const unifiedLegacyIds = new Set(allUnified?.map(u => u.legacy_id).filter(Boolean))
  const unifiedUserCreatedMap = new Map(
    allUnified?.map(u => [`${u.user_id}_${u.day_number}`, u]) || []
  )

  // church_qt_posts에는 있지만 unified에 없는 것들
  const missingPosts = allQtPosts?.filter(qt => {
    // legacy_id로 찾기
    if (unifiedLegacyIds.has(qt.id)) return false
    return true
  }) || []

  console.log(`✅ unified_meditations에 마이그레이션된 레코드: ${unifiedLegacyIds.size}개`)
  console.log(`❌ 마이그레이션 안된 레코드 (legacy_id 기준): ${missingPosts.length}개`)

  if (missingPosts.length > 0) {
    console.log('\n📋 마이그레이션 안된 게시물 샘플 (최근 10개):')
    console.table(missingPosts.slice(0, 10).map(p => ({
      id: p.id.slice(0, 8) + '...',
      user_id: p.user_id?.slice(0, 8) + '...',
      date: p.date,
      title: p.title?.slice(0, 20) || '(제목없음)',
      likes: p.likes_count,
      created_at: p.created_at?.slice(0, 19)
    })))
  }

  // ========================================
  // 5. visibility 필드 분석
  // ========================================
  console.log('\n👁️ 5. visibility 필드 분석\n')

  const { data: qtVisibility } = await supabase
    .from('church_qt_posts')
    .select('visibility')

  const { data: unifiedVisibility } = await supabase
    .from('unified_meditations')
    .select('visibility')
    .eq('source_type', 'church')

  // visibility별 카운트
  const qtVisCount: Record<string, number> = {}
  qtVisibility?.forEach(item => {
    const vis = item.visibility || 'null'
    qtVisCount[vis] = (qtVisCount[vis] || 0) + 1
  })

  const unifiedVisCount: Record<string, number> = {}
  unifiedVisibility?.forEach(item => {
    const vis = item.visibility || 'null'
    unifiedVisCount[vis] = (unifiedVisCount[vis] || 0) + 1
  })

  console.log('church_qt_posts visibility 분포:')
  Object.entries(qtVisCount).forEach(([vis, count]) => {
    console.log(`  ${vis}: ${count}개`)
  })

  console.log('\nunified_meditations visibility 분포:')
  Object.entries(unifiedVisCount).forEach(([vis, count]) => {
    console.log(`  ${vis}: ${count}개`)
  })

  // ========================================
  // 6. 최근 데이터 상세 비교 (오늘/어제)
  // ========================================
  console.log('\n📆 6. 최근 데이터 상세 비교 (Day 17, 18)\n')

  // Day 17, 18의 데이터 비교
  for (const dayNum of [17, 18]) {
    console.log(`\n--- Day ${dayNum} ---`)

    // church_qt_posts (date 기반으로 day 계산 필요)
    // 시작일이 2026-01-12라고 가정하면, Day 17 = 2026-01-28, Day 18 = 2026-01-29
    const targetDate = new Date('2026-01-12')
    targetDate.setDate(targetDate.getDate() + dayNum - 1)
    const dateStr = targetDate.toISOString().split('T')[0]

    const { data: qtDay, count: qtDayCount } = await supabase
      .from('church_qt_posts')
      .select('id, user_id, title, created_at', { count: 'exact' })
      .eq('date', dateStr)

    const { data: unifiedDay, count: unifiedDayCount } = await supabase
      .from('unified_meditations')
      .select('id, user_id, author_name, created_at', { count: 'exact' })
      .eq('source_type', 'church')
      .eq('day_number', dayNum)

    console.log(`church_qt_posts (date=${dateStr}): ${qtDayCount}개`)
    console.log(`unified_meditations (day_number=${dayNum}): ${unifiedDayCount}개`)

    if ((qtDayCount || 0) !== (unifiedDayCount || 0)) {
      console.log(`⚠️ 차이 발생! ${Math.abs((qtDayCount || 0) - (unifiedDayCount || 0))}개 차이`)

      // 세부 비교
      const qtIds = new Set(qtDay?.map(q => q.id))
      const unifiedLegacyIds = new Set(
        (await supabase
          .from('unified_meditations')
          .select('legacy_id')
          .eq('source_type', 'church')
          .eq('day_number', dayNum)
        ).data?.map(u => u.legacy_id)
      )

      const missingInUnified = qtDay?.filter(q => !unifiedLegacyIds.has(q.id)) || []
      if (missingInUnified.length > 0) {
        console.log(`\n❌ unified에 없는 church_qt_posts:`)
        console.table(missingInUnified.map(p => ({
          id: p.id.slice(0, 8) + '...',
          user_id: p.user_id?.slice(0, 8) + '...',
          title: p.title?.slice(0, 30) || '(없음)',
          created_at: p.created_at?.slice(0, 19)
        })))
      }
    }
  }

  // ========================================
  // 7. 결론 및 권장사항
  // ========================================
  console.log('\n' + '='.repeat(80))
  console.log('📋 7. 분석 결과 요약\n')

  const totalMissing = (qtCount || 0) - (unifiedChurchCount || 0)
  if (totalMissing > 0) {
    console.log(`⚠️ 총 ${totalMissing}개의 데이터가 unified_meditations에 마이그레이션되지 않았습니다.`)
    console.log('\n권장 조치:')
    console.log('1. 누락된 데이터를 unified_meditations에 마이그레이션')
    console.log('2. 피드 쿼리가 올바른 테이블을 사용하는지 확인')
    console.log('3. visibility 필드 일관성 확인')
  } else if (totalMissing < 0) {
    console.log(`ℹ️ unified_meditations가 ${Math.abs(totalMissing)}개 더 많습니다.`)
    console.log('   (guest_comments 등 다른 소스에서 마이그레이션된 데이터 포함)')
  } else {
    console.log('✅ 데이터 개수가 일치합니다.')
  }

  console.log('\n✅ 분석 완료!')
}

compareData().catch(console.error)
