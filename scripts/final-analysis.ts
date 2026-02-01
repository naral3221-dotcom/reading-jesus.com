/**
 * 최종 분석: 정확한 데이터 비교
 * 실행: npx tsx scripts/final-analysis.ts
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

async function finalAnalysis() {
  console.log('🔬 최종 분석\n')
  console.log('='.repeat(80))

  // ========================================
  // 1. 정확한 카운트
  // ========================================
  console.log('\n📊 1. 정확한 테이블 레코드 수\n')

  const { count: qtCount } = await supabase.from('church_qt_posts').select('*', { count: 'exact', head: true })
  const { count: guestCount } = await supabase.from('guest_comments').select('*', { count: 'exact', head: true })
  const { count: unifiedTotal } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true })
  const { count: unifiedChurch } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('source_type', 'church')

  const { count: unifiedFromQt } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'church_qt_posts')

  const { count: unifiedFromGuest } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'guest_comments')

  console.log('원본 테이블:')
  console.log(`  church_qt_posts: ${qtCount}개`)
  console.log(`  guest_comments: ${guestCount}개`)
  console.log(`  합계: ${(qtCount || 0) + (guestCount || 0)}개`)

  console.log('\nunified_meditations:')
  console.log(`  총: ${unifiedTotal}개`)
  console.log(`  source_type='church': ${unifiedChurch}개`)
  console.log(`  legacy_table='church_qt_posts': ${unifiedFromQt}개`)
  console.log(`  legacy_table='guest_comments': ${unifiedFromGuest}개`)

  // ========================================
  // 2. ID 매핑 상세 분석
  // ========================================
  console.log('\n🔗 2. ID 매핑 상세 분석\n')

  // church_qt_posts의 모든 ID
  const { data: qtIds } = await supabase.from('church_qt_posts').select('id')
  const qtIdSet = new Set(qtIds?.map(q => q.id))
  console.log(`church_qt_posts ID 수: ${qtIdSet.size}개`)

  // unified에서 church_qt_posts를 참조하는 legacy_id
  const { data: unifiedQtLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'church_qt_posts')
  const unifiedQtLegacySet = new Set(unifiedQtLegacy?.map(u => u.legacy_id).filter(Boolean))
  console.log(`unified의 church_qt_posts legacy_id 수: ${unifiedQtLegacySet.size}개`)

  // church_qt_posts에는 있지만 unified에 없는 ID
  const missingFromUnified = [...qtIdSet].filter(id => !unifiedQtLegacySet.has(id))
  console.log(`\n⚠️ church_qt_posts → unified 누락: ${missingFromUnified.length}개`)

  // unified에 있지만 church_qt_posts에 없는 legacy_id (삭제된 원본?)
  const orphanInUnified = [...unifiedQtLegacySet].filter(id => !qtIdSet.has(id))
  console.log(`⚠️ unified에만 있는 legacy_id (원본 삭제?): ${orphanInUnified.length}개`)

  // ========================================
  // 3. 누락된 데이터 상세
  // ========================================
  if (missingFromUnified.length > 0) {
    console.log('\n📋 3. 누락된 church_qt_posts 상세\n')

    // 최대 100개까지 조회
    const { data: missingData } = await supabase
      .from('church_qt_posts')
      .select('*')
      .in('id', missingFromUnified.slice(0, 100))
      .order('created_at', { ascending: false })

    if (missingData && missingData.length > 0) {
      // Day별 분포
      const dayDist: Record<number, number> = {}
      missingData.forEach(p => {
        const day = p.day_number || 0
        dayDist[day] = (dayDist[day] || 0) + 1
      })

      console.log('Day별 분포:')
      Object.entries(dayDist)
        .sort(([a], [b]) => Number(b) - Number(a))
        .forEach(([day, count]) => {
          console.log(`  Day ${day}: ${count}개`)
        })

      // 생성일별 분포
      const dateDist: Record<string, number> = {}
      missingData.forEach(p => {
        const date = p.created_at?.split('T')[0] || 'unknown'
        dateDist[date] = (dateDist[date] || 0) + 1
      })

      console.log('\n생성일별 분포:')
      Object.entries(dateDist)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([date, count]) => {
          console.log(`  ${date}: ${count}개`)
        })

      // 샘플
      console.log('\n샘플 (최근 15개):')
      console.table(missingData.slice(0, 15).map(p => ({
        id: p.id.slice(0, 8),
        user_id: p.user_id?.slice(0, 8) || 'guest',
        day: p.day_number,
        likes: p.likes_count,
        vis: p.visibility,
        my_sentence: (p.my_sentence || '').slice(0, 20) || '-',
        created: p.created_at?.slice(0, 16)
      })))

      // JSON 저장
      writeFileSync('missing_church_qt_posts.json', JSON.stringify(missingData, null, 2))
      console.log(`\n💾 전체 데이터가 missing_church_qt_posts.json에 저장됨`)
    }
  }

  // ========================================
  // 4. guest_comments 누락 분석
  // ========================================
  console.log('\n👻 4. guest_comments 누락 분석\n')

  const { data: guestIds } = await supabase.from('guest_comments').select('id')
  const guestIdSet = new Set(guestIds?.map(g => g.id))

  const { data: unifiedGuestLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')
  const unifiedGuestLegacySet = new Set(unifiedGuestLegacy?.map(u => u.legacy_id).filter(Boolean))

  const missingGuests = [...guestIdSet].filter(id => !unifiedGuestLegacySet.has(id))
  console.log(`guest_comments → unified 누락: ${missingGuests.length}개`)

  if (missingGuests.length > 0) {
    const { data: missingGuestData } = await supabase
      .from('guest_comments')
      .select('*')
      .in('id', missingGuests.slice(0, 20))
      .order('created_at', { ascending: false })

    console.log('\n누락된 guest_comments 샘플:')
    console.table(missingGuestData?.map(g => ({
      id: g.id.slice(0, 8),
      name: g.guest_name?.slice(0, 10),
      day: g.day_number,
      content: (g.content || '').slice(0, 20),
      created: g.created_at?.slice(0, 16)
    })))

    writeFileSync('missing_guest_comments.json', JSON.stringify(missingGuestData, null, 2))
    console.log(`\n💾 전체 데이터가 missing_guest_comments.json에 저장됨`)
  }

  // ========================================
  // 5. 동기화 상태 확인
  // ========================================
  console.log('\n🔄 5. 최근 글 동기화 확인 (Day 16, 17, 18)\n')

  for (const day of [16, 17, 18]) {
    const { count: qtDayCount } = await supabase
      .from('church_qt_posts')
      .select('*', { count: 'exact', head: true })
      .eq('day_number', day)

    const { count: unifiedDayCount } = await supabase
      .from('unified_meditations')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'church')
      .eq('day_number', day)

    const diff = (qtDayCount || 0) - (unifiedDayCount || 0)
    const status = diff === 0 ? '✅' : diff > 0 ? '⚠️ QT 더 많음' : 'ℹ️ Unified 더 많음'

    console.log(`Day ${day}: church_qt_posts=${qtDayCount}, unified=${unifiedDayCount} ${status}`)
  }

  // ========================================
  // 결론
  // ========================================
  console.log('\n' + '='.repeat(80))
  console.log('\n📋 최종 결론\n')

  const totalMissing = missingFromUnified.length + missingGuests.length

  if (totalMissing > 0) {
    console.log(`⚠️ 총 ${totalMissing}개 데이터가 unified_meditations에 누락됨:`)
    console.log(`   - church_qt_posts: ${missingFromUnified.length}개`)
    console.log(`   - guest_comments: ${missingGuests.length}개`)
    console.log('\n이 데이터들은 피드에서 보이지 않을 수 있습니다!')
  } else {
    console.log('✅ 모든 데이터가 올바르게 동기화되어 있습니다.')
  }

  console.log('\n✅ 분석 완료!')
}

finalAnalysis().catch(console.error)
