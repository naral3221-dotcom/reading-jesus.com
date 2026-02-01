/**
 * 누락된 데이터 마이그레이션 스크립트
 * 실행: npx tsx scripts/migrate-missing-data.ts
 *
 * 이 스크립트는 church_qt_posts와 guest_comments에서
 * unified_meditations로 누락된 데이터를 안전하게 마이그레이션합니다.
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

// 로그 파일에 기록
const logEntries: string[] = []
function log(message: string) {
  const timestamp = new Date().toISOString()
  const entry = `[${timestamp}] ${message}`
  console.log(entry)
  logEntries.push(entry)
}

function saveLog() {
  const logFile = `migration_log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
  writeFileSync(logFile, logEntries.join('\n'))
  console.log(`\n로그 저장됨: ${logFile}`)
}

async function phase0_dryRun() {
  log('========================================')
  log('Phase 0: DRY-RUN - 현재 상태 확인')
  log('========================================')

  // 1. 현재 카운트
  const { count: qtCount } = await supabase.from('church_qt_posts').select('*', { count: 'exact', head: true })
  const { count: guestCount } = await supabase.from('guest_comments').select('*', { count: 'exact', head: true })
  const { count: unifiedCount } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true })
  const { count: unifiedQt } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('legacy_table', 'church_qt_posts')
  const { count: unifiedGuest } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('legacy_table', 'guest_comments')

  log(`\n현재 상태:`)
  log(`  church_qt_posts: ${qtCount}개`)
  log(`  guest_comments: ${guestCount}개`)
  log(`  unified_meditations: ${unifiedCount}개`)
  log(`    - church_qt_posts에서 마이그레이션된: ${unifiedQt}개`)
  log(`    - guest_comments에서 마이그레이션된: ${unifiedGuest}개`)

  // 2. 누락된 데이터 확인
  const { data: missingQt } = await supabase.rpc('exec_sql', {
    query: `
      SELECT qt.id, qt.day_number, qt.created_at
      FROM church_qt_posts qt
      LEFT JOIN unified_meditations um
        ON um.legacy_table = 'church_qt_posts' AND um.legacy_id = qt.id::text
      WHERE um.id IS NULL
    `
  })

  // RPC가 없을 수 있으므로 대안 사용
  const { data: allQtPosts } = await supabase.from('church_qt_posts').select('id')
  const { data: unifiedQtLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'church_qt_posts')

  const qtIdSet = new Set(allQtPosts?.map(q => q.id))
  const unifiedQtLegacySet = new Set(unifiedQtLegacy?.map(u => u.legacy_id).filter(Boolean))
  const missingQtIds = [...qtIdSet].filter(id => !unifiedQtLegacySet.has(id))

  const { data: allGuestComments } = await supabase.from('guest_comments').select('id')
  const { data: unifiedGuestLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')

  const guestIdSet = new Set(allGuestComments?.map(g => g.id))
  const unifiedGuestLegacySet = new Set(unifiedGuestLegacy?.map(u => u.legacy_id).filter(Boolean))
  const missingGuestIds = [...guestIdSet].filter(id => !unifiedGuestLegacySet.has(id))

  log(`\n누락된 데이터:`)
  log(`  church_qt_posts → unified: ${missingQtIds.length}개 누락`)
  log(`  guest_comments → unified: ${missingGuestIds.length}개 누락`)
  log(`  총: ${missingQtIds.length + missingGuestIds.length}개`)

  return {
    qtCount,
    guestCount,
    unifiedCount,
    missingQtIds,
    missingGuestIds
  }
}

async function phase1_backup() {
  log('\n========================================')
  log('Phase 1: 백업 생성')
  log('========================================')

  // Supabase에서 직접 백업 테이블 생성은 SQL Editor에서 해야 함
  // 대신 로컬에 JSON 백업 생성
  const { data: allUnified, error } = await supabase
    .from('unified_meditations')
    .select('*')

  if (error) {
    log(`백업 실패: ${error.message}`)
    throw error
  }

  const backupFile = `unified_meditations_backup_${new Date().toISOString().split('T')[0]}.json`
  writeFileSync(backupFile, JSON.stringify(allUnified, null, 2))
  log(`로컬 백업 생성됨: ${backupFile} (${allUnified?.length}개 레코드)`)

  return allUnified?.length || 0
}

async function phase2_validation() {
  log('\n========================================')
  log('Phase 2: 사전 검증')
  log('========================================')

  // 1. 기존 중복 확인
  const { data: allUnified } = await supabase
    .from('unified_meditations')
    .select('legacy_table, legacy_id')
    .in('legacy_table', ['church_qt_posts', 'guest_comments'])

  const legacyMap = new Map<string, number>()
  allUnified?.forEach(u => {
    if (u.legacy_id) {
      const key = `${u.legacy_table}:${u.legacy_id}`
      legacyMap.set(key, (legacyMap.get(key) || 0) + 1)
    }
  })

  const duplicates = [...legacyMap.entries()].filter(([_, count]) => count > 1)

  if (duplicates.length > 0) {
    log(`경고: 중복된 legacy_id 발견: ${duplicates.length}개`)
    duplicates.forEach(([key, count]) => {
      log(`  ${key}: ${count}개`)
    })
  } else {
    log(`기존 중복 없음`)
  }

  return duplicates.length === 0
}

async function phase3_migrate(missingQtIds: string[], missingGuestIds: string[]) {
  log('\n========================================')
  log('Phase 3: 마이그레이션 실행')
  log('========================================')

  let qtMigrated = 0
  let guestMigrated = 0
  const errors: string[] = []

  // 3-1. church_qt_posts 마이그레이션
  if (missingQtIds.length > 0) {
    log(`\n3-1. church_qt_posts 마이그레이션 (${missingQtIds.length}개)`)

    // 배치로 가져오기 (한번에 50개씩)
    for (let i = 0; i < missingQtIds.length; i += 50) {
      const batchIds = missingQtIds.slice(i, i + 50)

      const { data: qtPosts, error: fetchError } = await supabase
        .from('church_qt_posts')
        .select('*')
        .in('id', batchIds)

      if (fetchError) {
        log(`  배치 ${i / 50 + 1} 조회 실패: ${fetchError.message}`)
        errors.push(`QT 조회 실패: ${fetchError.message}`)
        continue
      }

      if (!qtPosts || qtPosts.length === 0) continue

      // unified_meditations로 변환
      const unifiedRecords = qtPosts.map(qt => ({
        user_id: qt.user_id || null,
        guest_token: null,  // QT는 게스트 토큰 없음
        source_type: 'church' as const,
        source_id: qt.church_id,
        content_type: 'qt',
        legacy_table: 'church_qt_posts',
        legacy_id: qt.id,
        day_number: qt.day_number,
        qt_date: qt.qt_date,
        my_sentence: qt.my_sentence,
        meditation_answer: qt.meditation_answer,
        gratitude: qt.gratitude,
        my_prayer: qt.my_prayer,
        day_review: qt.day_review,
        is_pinned: qt.is_pinned || false,
        likes_count: qt.likes_count || 0,
        replies_count: qt.replies_count || 0,
        author_name: qt.author_name,
        is_anonymous: qt.is_anonymous || false,
        created_at: qt.created_at,
        updated_at: qt.updated_at || qt.created_at
      }))

      const { error: insertError } = await supabase
        .from('unified_meditations')
        .insert(unifiedRecords)

      if (insertError) {
        log(`  배치 ${i / 50 + 1} 삽입 실패: ${insertError.message}`)
        errors.push(`QT 삽입 실패: ${insertError.message}`)
      } else {
        qtMigrated += unifiedRecords.length
        log(`  배치 ${i / 50 + 1} 완료: ${unifiedRecords.length}개`)
      }
    }
  }

  // 3-2. guest_comments 마이그레이션
  if (missingGuestIds.length > 0) {
    log(`\n3-2. guest_comments 마이그레이션 (${missingGuestIds.length}개)`)

    for (let i = 0; i < missingGuestIds.length; i += 50) {
      const batchIds = missingGuestIds.slice(i, i + 50)

      const { data: guestComments, error: fetchError } = await supabase
        .from('guest_comments')
        .select('*')
        .in('id', batchIds)

      if (fetchError) {
        log(`  배치 ${i / 50 + 1} 조회 실패: ${fetchError.message}`)
        errors.push(`Guest 조회 실패: ${fetchError.message}`)
        continue
      }

      if (!guestComments || guestComments.length === 0) continue

      const unifiedRecords = guestComments.map(gc => ({
        user_id: gc.linked_user_id || null,  // 연결된 user_id가 있으면 사용
        guest_token: gc.device_id || null,  // guest_token으로 device_id 사용
        source_type: 'church' as const,  // guest_comments도 교회 소속
        source_id: gc.church_id,  // church_id 사용 (NOT NULL 필수)
        content_type: 'free',
        legacy_table: 'guest_comments',
        legacy_id: gc.id,
        day_number: gc.day_number,
        content: gc.content,
        bible_range: gc.bible_range,
        is_anonymous: gc.is_anonymous || false,
        is_pinned: false,
        likes_count: gc.likes_count || 0,
        replies_count: gc.replies_count || 0,
        author_name: gc.guest_name,
        created_at: gc.created_at,
        updated_at: gc.updated_at || gc.created_at
      }))

      const { error: insertError } = await supabase
        .from('unified_meditations')
        .insert(unifiedRecords)

      if (insertError) {
        log(`  배치 ${i / 50 + 1} 삽입 실패: ${insertError.message}`)
        errors.push(`Guest 삽입 실패: ${insertError.message}`)
      } else {
        guestMigrated += unifiedRecords.length
        log(`  배치 ${i / 50 + 1} 완료: ${unifiedRecords.length}개`)
      }
    }
  }

  log(`\n마이그레이션 결과:`)
  log(`  church_qt_posts: ${qtMigrated}개 완료`)
  log(`  guest_comments: ${guestMigrated}개 완료`)

  if (errors.length > 0) {
    log(`\n에러 발생: ${errors.length}개`)
    errors.forEach(e => log(`  - ${e}`))
  }

  return { qtMigrated, guestMigrated, errors }
}

async function phase4_postValidation() {
  log('\n========================================')
  log('Phase 4: 사후 검증')
  log('========================================')

  // 1. 최종 카운트
  const { count: qtCount } = await supabase.from('church_qt_posts').select('*', { count: 'exact', head: true })
  const { count: guestCount } = await supabase.from('guest_comments').select('*', { count: 'exact', head: true })
  const { count: unifiedCount } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true })
  const { count: unifiedQt } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('legacy_table', 'church_qt_posts')
  const { count: unifiedGuest } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('legacy_table', 'guest_comments')

  log(`\n최종 카운트:`)
  log(`  church_qt_posts: ${qtCount}개`)
  log(`  guest_comments: ${guestCount}개`)
  log(`  원본 합계: ${(qtCount || 0) + (guestCount || 0)}개`)
  log(`  unified_meditations: ${unifiedCount}개`)
  log(`    - from church_qt_posts: ${unifiedQt}개`)
  log(`    - from guest_comments: ${unifiedGuest}개`)

  // 2. 누락 확인
  const { data: allQtPosts } = await supabase.from('church_qt_posts').select('id')
  const { data: unifiedQtLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'church_qt_posts')

  const qtIdSet = new Set(allQtPosts?.map(q => q.id))
  const unifiedQtLegacySet = new Set(unifiedQtLegacy?.map(u => u.legacy_id).filter(Boolean))
  const stillMissingQt = [...qtIdSet].filter(id => !unifiedQtLegacySet.has(id))

  const { data: allGuestComments } = await supabase.from('guest_comments').select('id')
  const { data: unifiedGuestLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')

  const guestIdSet = new Set(allGuestComments?.map(g => g.id))
  const unifiedGuestLegacySet = new Set(unifiedGuestLegacy?.map(u => u.legacy_id).filter(Boolean))
  const stillMissingGuest = [...guestIdSet].filter(id => !unifiedGuestLegacySet.has(id))

  log(`\n누락 확인:`)
  log(`  church_qt_posts 누락: ${stillMissingQt.length}개`)
  log(`  guest_comments 누락: ${stillMissingGuest.length}개`)

  // 3. Day별 확인
  log(`\n특정 Day 검증:`)
  for (const day of [13, 14, 15, 16, 17, 18]) {
    const { count: qtDayCount } = await supabase
      .from('church_qt_posts')
      .select('*', { count: 'exact', head: true })
      .eq('day_number', day)

    const { count: unifiedDayCount } = await supabase
      .from('unified_meditations')
      .select('*', { count: 'exact', head: true })
      .eq('legacy_table', 'church_qt_posts')
      .eq('day_number', day)

    const match = qtDayCount === unifiedDayCount ? '✅' : '⚠️'
    log(`  Day ${day}: QT=${qtDayCount}, Unified=${unifiedDayCount} ${match}`)
  }

  const success = stillMissingQt.length === 0 && stillMissingGuest.length === 0

  if (success) {
    log(`\n✅ 모든 데이터가 성공적으로 동기화되었습니다!`)
  } else {
    log(`\n⚠️ 일부 데이터가 아직 동기화되지 않았습니다.`)
  }

  return {
    success,
    stillMissingQt: stillMissingQt.length,
    stillMissingGuest: stillMissingGuest.length
  }
}

async function runMigration() {
  log('='.repeat(60))
  log('데이터 마이그레이션 시작')
  log(`시작 시간: ${new Date().toISOString()}`)
  log('='.repeat(60))

  try {
    // Phase 0: DRY-RUN
    const phase0Result = await phase0_dryRun()

    if (phase0Result.missingQtIds.length === 0 && phase0Result.missingGuestIds.length === 0) {
      log('\n✅ 누락된 데이터가 없습니다. 마이그레이션 불필요.')
      saveLog()
      return
    }

    // Phase 1: 백업
    await phase1_backup()

    // Phase 2: 검증
    const isValid = await phase2_validation()
    if (!isValid) {
      log('\n⚠️ 기존 중복 데이터가 있습니다. 수동 확인 필요.')
      // 계속 진행 (중복은 있지만 마이그레이션은 가능)
    }

    // Phase 3: 마이그레이션
    const phase3Result = await phase3_migrate(
      phase0Result.missingQtIds,
      phase0Result.missingGuestIds
    )

    // Phase 4: 검증
    const phase4Result = await phase4_postValidation()

    // 최종 요약
    log('\n' + '='.repeat(60))
    log('마이그레이션 완료 요약')
    log('='.repeat(60))
    log(`마이그레이션된 데이터:`)
    log(`  church_qt_posts: ${phase3Result.qtMigrated}개`)
    log(`  guest_comments: ${phase3Result.guestMigrated}개`)
    log(`  총: ${phase3Result.qtMigrated + phase3Result.guestMigrated}개`)
    log(`\n최종 상태: ${phase4Result.success ? '✅ 성공' : '⚠️ 부분 성공'}`)

    if (!phase4Result.success) {
      log(`  아직 누락: QT ${phase4Result.stillMissingQt}개, Guest ${phase4Result.stillMissingGuest}개`)
    }

  } catch (error) {
    log(`\n에러 발생: ${error}`)
  }

  saveLog()
}

// 실행
runMigration().catch(console.error)
