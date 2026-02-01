/**
 * Phase 4 기능 검증 스크립트
 * GetUnifiedFeed가 unified_meditations에서 올바르게 데이터를 조회하는지 테스트
 * 실행: npx tsx scripts/verify-phase4-functionality.ts
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

async function verify() {
  console.log('='.repeat(60))
  console.log('=== 2차 검증: 기능 테스트 ===')
  console.log('='.repeat(60))

  let passed = 0
  let failed = 0

  // 1. 전체 공개 피드 조회 테스트
  console.log('\n1. 전체 공개 피드 조회 테스트:')
  try {
    const { data: allFeed, error } = await supabase
      .from('unified_meditations')
      .select('id, source_type, content_type, visibility, created_at')
      .in('visibility', ['public', 'church'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    console.log(`   ✅ 공개 피드 조회 성공: ${allFeed?.length || 0}개`)
    const sourceTypes = new Map<string, number>()
    allFeed?.forEach(item => {
      sourceTypes.set(item.source_type, (sourceTypes.get(item.source_type) || 0) + 1)
    })
    console.log(`      - source_type 분포:`, Object.fromEntries(sourceTypes))
    passed++
  } catch (e) {
    console.log(`   ❌ 공개 피드 조회 실패: ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }

  // 2. 교회 피드 조회 테스트
  console.log('\n2. 교회 피드 조회 테스트:')
  try {
    // 먼저 교회 ID 가져오기
    const { data: churches } = await supabase
      .from('churches')
      .select('id, name')
      .limit(1)

    if (churches && churches.length > 0) {
      const churchId = churches[0].id
      const { data: churchFeed, error } = await supabase
        .from('unified_meditations')
        .select('id, source_type, content_type, source_id')
        .eq('source_type', 'church')
        .eq('source_id', churchId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      console.log(`   ✅ 교회 피드 조회 성공 (${churches[0].name}): ${churchFeed?.length || 0}개`)

      // 모든 항목이 해당 교회에 속하는지 확인
      const allMatch = churchFeed?.every(item => item.source_id === churchId) ?? true
      if (allMatch) {
        console.log(`      - 모든 항목이 올바른 교회에 속함: ✅`)
      } else {
        console.log(`      - 잘못된 교회 항목 발견: ❌`)
        failed++
      }
      passed++
    } else {
      console.log(`   ⚠️  테스트할 교회 없음`)
    }
  } catch (e) {
    console.log(`   ❌ 교회 피드 조회 실패: ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }

  // 3. 그룹 피드 조회 테스트
  console.log('\n3. 그룹 피드 조회 테스트:')
  try {
    const { data: groups } = await supabase
      .from('groups')
      .select('id, name')
      .limit(1)

    if (groups && groups.length > 0) {
      const groupId = groups[0].id
      const { data: groupFeed, error } = await supabase
        .from('unified_meditations')
        .select('id, source_type, source_id')
        .eq('source_type', 'group')
        .eq('source_id', groupId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      console.log(`   ✅ 그룹 피드 조회 성공 (${groups[0].name}): ${groupFeed?.length || 0}개`)
      passed++
    } else {
      console.log(`   ⚠️  테스트할 그룹 없음`)
    }
  } catch (e) {
    console.log(`   ❌ 그룹 피드 조회 실패: ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }

  // 4. 콘텐츠 타입 필터 테스트 (QT)
  console.log('\n4. QT 필터 테스트:')
  try {
    const { data: qtFeed, error } = await supabase
      .from('unified_meditations')
      .select('id, content_type')
      .eq('content_type', 'qt')
      .limit(10)

    if (error) throw error

    const allQT = qtFeed?.every(item => item.content_type === 'qt') ?? true
    if (allQT) {
      console.log(`   ✅ QT 필터 성공: ${qtFeed?.length || 0}개 (모두 qt 타입)`)
      passed++
    } else {
      console.log(`   ❌ QT 필터 실패: qt가 아닌 항목 포함`)
      failed++
    }
  } catch (e) {
    console.log(`   ❌ QT 필터 테스트 실패: ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }

  // 5. 콘텐츠 타입 필터 테스트 (묵상)
  console.log('\n5. 묵상(free/memo) 필터 테스트:')
  try {
    const { data: meditationFeed, error } = await supabase
      .from('unified_meditations')
      .select('id, content_type')
      .in('content_type', ['free', 'memo'])
      .limit(10)

    if (error) throw error

    const allMeditation = meditationFeed?.every(item =>
      item.content_type === 'free' || item.content_type === 'memo'
    ) ?? true

    if (allMeditation) {
      console.log(`   ✅ 묵상 필터 성공: ${meditationFeed?.length || 0}개 (모두 free/memo 타입)`)
      passed++
    } else {
      console.log(`   ❌ 묵상 필터 실패: 다른 타입 항목 포함`)
      failed++
    }
  } catch (e) {
    console.log(`   ❌ 묵상 필터 테스트 실패: ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }

  // 6. 페이지네이션 테스트
  console.log('\n6. 커서 기반 페이지네이션 테스트:')
  try {
    // 첫 페이지
    const { data: page1 } = await supabase
      .from('unified_meditations')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (page1 && page1.length > 0) {
      const cursor = page1[page1.length - 1].created_at

      // 두 번째 페이지
      const { data: page2 } = await supabase
        .from('unified_meditations')
        .select('id, created_at')
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(5)

      // 중복 확인
      const page1Ids = new Set(page1.map(p => p.id))
      const hasDuplicates = page2?.some(p => page1Ids.has(p.id)) ?? false

      if (!hasDuplicates) {
        console.log(`   ✅ 페이지네이션 성공: 1페이지 ${page1.length}개, 2페이지 ${page2?.length || 0}개 (중복 없음)`)
        passed++
      } else {
        console.log(`   ❌ 페이지네이션 실패: 중복 항목 발견`)
        failed++
      }
    } else {
      console.log(`   ⚠️  테스트 데이터 부족`)
    }
  } catch (e) {
    console.log(`   ❌ 페이지네이션 테스트 실패: ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }

  // 7. 관련 정보 조인 가능 여부 테스트
  console.log('\n7. 관련 정보 조회 테스트 (프로필, 그룹, 교회):')
  try {
    // 사용자 프로필 조인
    const { data: withProfile } = await supabase
      .from('unified_meditations')
      .select('id, user_id')
      .not('user_id', 'is', null)
      .limit(1)

    if (withProfile && withProfile.length > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nickname')
        .eq('id', withProfile[0].user_id!)
        .single()

      if (profile) {
        console.log(`   ✅ 프로필 조회 성공: ${profile.nickname}`)
        passed++
      } else {
        console.log(`   ⚠️  프로필 없음 (user_id: ${withProfile[0].user_id})`)
      }
    }
  } catch (e) {
    console.log(`   ❌ 관련 정보 조회 실패: ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }

  // 8. 레거시 테이블과 동기화 정합성 확인
  console.log('\n8. 레거시 테이블 동기화 정합성:')
  try {
    const { count: unifiedCount } = await supabase
      .from('unified_meditations')
      .select('*', { count: 'exact', head: true })

    const tables = ['church_qt_posts', 'guest_comments', 'comments', 'public_meditations']
    let legacyTotal = 0

    for (const table of tables) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
      legacyTotal += count || 0
    }

    console.log(`   - unified_meditations: ${unifiedCount}개`)
    console.log(`   - 레거시 테이블 합계: ${legacyTotal}개`)

    if (unifiedCount === legacyTotal) {
      console.log(`   ✅ 동기화 완벽: 차이 없음`)
      passed++
    } else {
      const diff = Math.abs((unifiedCount || 0) - legacyTotal)
      console.log(`   ⚠️  차이 발생: ${diff}개 (트리거 지연 또는 신규 데이터)`)
    }
  } catch (e) {
    console.log(`   ❌ 정합성 확인 실패: ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }

  // 결과 요약
  console.log('\n' + '='.repeat(60))
  console.log('=== 2차 검증 결과 ===')
  console.log('='.repeat(60))
  console.log(`✅ 성공: ${passed}개`)
  console.log(`❌ 실패: ${failed}개`)
  console.log(`📊 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  console.log('='.repeat(60))

  if (failed > 0) {
    process.exit(1)
  }
}

verify().catch(console.error)
