/**
 * 심층 분석: church_qt_posts vs unified_meditations
 * 실행: npx tsx scripts/deep-analysis.ts
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

async function deepAnalysis() {
  console.log('🔬 심층 분석 시작\n')
  console.log('='.repeat(80))

  // ========================================
  // 1. church_qt_posts 실제 데이터 샘플
  // ========================================
  console.log('\n📝 1. church_qt_posts 샘플 데이터 (최근 20개)\n')

  const { data: qtSample } = await supabase
    .from('church_qt_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (qtSample) {
    console.table(qtSample.map(p => ({
      id: p.id?.slice(0, 8),
      user_id: p.user_id?.slice(0, 8) || 'null',
      date: p.date,
      day_number: p.day_number,
      title: (p.title || '').slice(0, 15),
      content: (p.content || '').slice(0, 20),
      likes: p.likes_count,
      visibility: p.visibility,
      created: p.created_at?.slice(0, 16)
    })))
  }

  // ========================================
  // 2. unified_meditations 실제 데이터 샘플
  // ========================================
  console.log('\n📝 2. unified_meditations (church) 샘플 데이터 (최근 20개)\n')

  const { data: unifiedSample } = await supabase
    .from('unified_meditations')
    .select('*')
    .eq('source_type', 'church')
    .order('created_at', { ascending: false })
    .limit(20)

  if (unifiedSample) {
    console.table(unifiedSample.map(p => ({
      id: p.id?.slice(0, 8),
      legacy_id: p.legacy_id?.slice(0, 8) || 'null',
      user_id: p.user_id?.slice(0, 8) || 'null',
      author: p.author_name?.slice(0, 8),
      day: p.day_number,
      qt_date: p.qt_date,
      content_type: p.content_type,
      likes: p.likes_count,
      visibility: p.visibility,
      legacy_table: p.legacy_table,
      created: p.created_at?.slice(0, 16)
    })))
  }

  // ========================================
  // 3. legacy_id 매핑 분석
  // ========================================
  console.log('\n🔗 3. legacy_id 매핑 분석\n')

  const { data: unifiedWithLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id, legacy_table')
    .eq('source_type', 'church')
    .not('legacy_id', 'is', null)

  const legacyTableCount: Record<string, number> = {}
  unifiedWithLegacy?.forEach(item => {
    const table = item.legacy_table || 'unknown'
    legacyTableCount[table] = (legacyTableCount[table] || 0) + 1
  })

  console.log('unified_meditations의 legacy_table 분포:')
  Object.entries(legacyTableCount).forEach(([table, count]) => {
    console.log(`  ${table}: ${count}개`)
  })

  // legacy_id가 null인 레코드
  const { count: noLegacyCount } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'church')
    .is('legacy_id', null)

  console.log(`\nlegacy_id가 null인 레코드: ${noLegacyCount}개`)
  console.log('→ 이 레코드들은 unified_meditations에 직접 생성된 새 데이터')

  // ========================================
  // 4. 생성일 기준 분석
  // ========================================
  console.log('\n📆 4. 생성일 기준 분석\n')

  // 마이그레이션 이후 생성된 데이터 확인
  // 마이그레이션 날짜 추정 (가장 오래된 unified_meditations)
  const { data: oldestUnified } = await supabase
    .from('unified_meditations')
    .select('created_at')
    .eq('source_type', 'church')
    .order('created_at', { ascending: true })
    .limit(1)

  const { data: newestQt } = await supabase
    .from('church_qt_posts')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  console.log('가장 오래된 unified_meditations:', oldestUnified?.[0]?.created_at)
  console.log('가장 최근 church_qt_posts:', newestQt?.[0]?.created_at)

  // ========================================
  // 5. ID 기반 정확한 매핑 분석
  // ========================================
  console.log('\n🔍 5. ID 기반 정확한 매핑 분석\n')

  // church_qt_posts의 모든 ID
  const { data: allQtIds } = await supabase
    .from('church_qt_posts')
    .select('id')

  // unified_meditations의 모든 legacy_id
  const { data: allLegacyIds } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('source_type', 'church')

  const qtIdSet = new Set(allQtIds?.map(q => q.id))
  const legacyIdSet = new Set(allLegacyIds?.map(u => u.legacy_id).filter(Boolean))

  // church_qt_posts에는 있지만 unified에 없는 ID
  const onlyInQt = [...qtIdSet].filter(id => !legacyIdSet.has(id))

  // unified에는 있지만 church_qt_posts에 없는 legacy_id
  const onlyInUnified = [...legacyIdSet].filter(id => !qtIdSet.has(id))

  console.log(`church_qt_posts 총 ID: ${qtIdSet.size}개`)
  console.log(`unified_meditations legacy_id (non-null): ${legacyIdSet.size}개`)
  console.log(`\n⚠️ church_qt_posts에만 있는 ID: ${onlyInQt.length}개`)
  console.log(`⚠️ unified에만 있는 legacy_id: ${onlyInUnified.length}개`)

  if (onlyInQt.length > 0) {
    console.log('\n❌ church_qt_posts에는 있지만 unified에 없는 게시물:')
    const { data: missingPosts } = await supabase
      .from('church_qt_posts')
      .select('id, user_id, date, title, created_at')
      .in('id', onlyInQt.slice(0, 10))

    console.table(missingPosts?.map(p => ({
      id: p.id?.slice(0, 8),
      user_id: p.user_id?.slice(0, 8) || 'null',
      date: p.date,
      title: (p.title || '').slice(0, 20),
      created: p.created_at?.slice(0, 16)
    })))
  }

  // ========================================
  // 6. 데이터 흐름 추적 (최근 글이 어디로 가는지)
  // ========================================
  console.log('\n🔄 6. 데이터 흐름 분석\n')

  // 오늘 날짜 기준
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  console.log(`오늘: ${today}, 어제: ${yesterday}`)

  // 오늘/어제 church_qt_posts
  const { data: recentQt, count: recentQtCount } = await supabase
    .from('church_qt_posts')
    .select('id, user_id, date, title, created_at', { count: 'exact' })
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })

  console.log(`\n최근 24시간 church_qt_posts: ${recentQtCount}개`)
  if (recentQt && recentQt.length > 0) {
    console.table(recentQt.slice(0, 5).map(p => ({
      id: p.id?.slice(0, 8),
      date: p.date,
      title: (p.title || '').slice(0, 20),
      created: p.created_at?.slice(0, 16)
    })))
  }

  // 오늘/어제 unified_meditations
  const { data: recentUnified, count: recentUnifiedCount } = await supabase
    .from('unified_meditations')
    .select('id, legacy_id, user_id, author_name, day_number, created_at', { count: 'exact' })
    .eq('source_type', 'church')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })

  console.log(`\n최근 24시간 unified_meditations (church): ${recentUnifiedCount}개`)
  if (recentUnified && recentUnified.length > 0) {
    console.table(recentUnified.slice(0, 5).map(p => ({
      id: p.id?.slice(0, 8),
      legacy: p.legacy_id?.slice(0, 8) || 'NEW',
      author: p.author_name?.slice(0, 8),
      day: p.day_number,
      created: p.created_at?.slice(0, 16)
    })))
  }

  // ========================================
  // 7. guest_comments 분석
  // ========================================
  console.log('\n👻 7. guest_comments 분석\n')

  const { count: guestCount } = await supabase
    .from('guest_comments')
    .select('*', { count: 'exact', head: true })

  const { data: guestSample } = await supabase
    .from('guest_comments')
    .select('id, church_id, guest_name, day_number, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log(`guest_comments 총: ${guestCount}개`)
  if (guestSample) {
    console.table(guestSample.map(g => ({
      id: g.id?.slice(0, 8),
      name: g.guest_name?.slice(0, 10),
      day: g.day_number,
      created: g.created_at?.slice(0, 16)
    })))
  }

  // guest_comments가 unified에 마이그레이션 되었는지
  const { count: guestInUnified } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'guest_comments')

  console.log(`\nunified_meditations에 마이그레이션된 guest_comments: ${guestInUnified}개`)

  // ========================================
  // 결론
  // ========================================
  console.log('\n' + '='.repeat(80))
  console.log('📋 심층 분석 결론\n')

  console.log('1. 데이터 구조:')
  console.log(`   - church_qt_posts: ${qtIdSet.size}개`)
  console.log(`   - unified_meditations (church): legacy_id 있는 것 ${legacyIdSet.size}개`)
  console.log(`   - unified_meditations (church): legacy_id 없는 것 ${noLegacyCount}개 (새로 생성된 데이터)`)

  console.log('\n2. 데이터 흐름:')
  if ((noLegacyCount || 0) > 0) {
    console.log(`   ✅ unified_meditations에 직접 데이터가 생성되고 있음 (${noLegacyCount}개)`)
    console.log(`   → 새 글 작성 시 unified_meditations에 직접 저장되는 것으로 추정`)
  }

  console.log('\n3. 피드 노출 이슈 가능성:')
  console.log('   - 피드가 church_qt_posts를 읽는 경우: 새 글이 안 보일 수 있음')
  console.log('   - 피드가 unified_meditations를 읽는 경우: 레거시 글이 안 보일 수 있음')
  console.log('   → 코드에서 어떤 테이블을 사용하는지 확인 필요')

  console.log('\n✅ 심층 분석 완료!')
}

deepAnalysis().catch(console.error)
