/**
 * church_reading_checks → unified_reading_checks 누락분 마이그레이션
 * 실행: npx tsx scripts/migrate-reading-checks.ts
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

async function migrateReadingChecks() {
  console.log('='.repeat(60))
  console.log('church_reading_checks → unified_reading_checks 마이그레이션')
  console.log('='.repeat(60))

  // 1. 현재 상태 확인
  const { count: originalCount } = await supabase
    .from('church_reading_checks')
    .select('*', { count: 'exact', head: true })

  const { count: unifiedCount } = await supabase
    .from('unified_reading_checks')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'church_reading_checks')

  console.log(`\n현재 상태:`)
  console.log(`  church_reading_checks: ${originalCount}개`)
  console.log(`  unified (church_reading_checks): ${unifiedCount}개`)
  console.log(`  예상 누락: ${(originalCount || 0) - (unifiedCount || 0)}개`)

  // 2. 누락된 데이터 찾기
  const { data: allOriginal } = await supabase
    .from('church_reading_checks')
    .select('id, user_id, church_id, day_number, checked_at, created_at')

  const { data: allUnified } = await supabase
    .from('unified_reading_checks')
    .select('legacy_id')
    .eq('legacy_table', 'church_reading_checks')

  const unifiedLegacyIds = new Set(allUnified?.map(u => u.legacy_id).filter(Boolean))
  const missingRecords = allOriginal?.filter(r => !unifiedLegacyIds.has(r.id)) || []

  console.log(`\n실제 누락: ${missingRecords.length}개`)

  if (missingRecords.length === 0) {
    console.log('✅ 누락된 데이터 없음')
    return
  }

  // 3. 샘플 출력
  console.log('\n샘플 (최대 10개):')
  console.table(missingRecords.slice(0, 10).map(r => ({
    id: r.id?.slice(0, 8),
    user_id: r.user_id?.slice(0, 8),
    church_id: r.church_id?.slice(0, 8),
    day: r.day_number,
    checked: r.checked_at?.slice(0, 16),
  })))

  // 4. 마이그레이션 실행
  console.log('\n마이그레이션 시작...')

  const unifiedRecords = missingRecords.map(r => ({
    user_id: r.user_id,
    source_type: 'church',
    source_id: r.church_id,
    day_number: r.day_number,
    checked_at: r.checked_at,
    created_at: r.created_at || r.checked_at,
    legacy_table: 'church_reading_checks',
    legacy_id: r.id,
  }))

  // user_id와 source_id가 있는 것만 필터
  const validRecords = unifiedRecords.filter(r => r.user_id && r.source_id)
  const invalidRecords = unifiedRecords.filter(r => !r.user_id || !r.source_id)

  if (invalidRecords.length > 0) {
    console.log(`⚠️ 유효하지 않은 레코드: ${invalidRecords.length}개 (user_id 또는 source_id 없음)`)
  }

  if (validRecords.length === 0) {
    console.log('❌ 유효한 레코드 없음')
    return
  }

  console.log(`삽입할 레코드: ${validRecords.length}개`)

  // 배치로 삽입 (UNIQUE 제약 위반 방지를 위해 upsert 사용 안 함)
  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const record of validRecords) {
    // 이미 존재하는지 확인 (같은 user, source, day)
    const { data: existing } = await supabase
      .from('unified_reading_checks')
      .select('id')
      .eq('user_id', record.user_id)
      .eq('source_type', record.source_type)
      .eq('source_id', record.source_id)
      .eq('day_number', record.day_number)
      .maybeSingle()

    if (existing) {
      // 이미 존재하면 legacy_id만 업데이트
      const { error: updateError } = await supabase
        .from('unified_reading_checks')
        .update({ legacy_table: record.legacy_table, legacy_id: record.legacy_id })
        .eq('id', existing.id)

      if (updateError) {
        errorCount++
      } else {
        skipCount++
      }
    } else {
      // 새로 삽입
      const { error: insertError } = await supabase
        .from('unified_reading_checks')
        .insert([record])

      if (insertError) {
        // UNIQUE 제약 위반은 무시
        if (insertError.code === '23505') {
          skipCount++
        } else {
          console.error(`삽입 실패 (${record.legacy_id}): ${insertError.message}`)
          errorCount++
        }
      } else {
        successCount++
      }
    }
  }

  console.log(`\n결과:`)
  console.log(`  성공: ${successCount}개`)
  console.log(`  건너뜀 (이미 존재): ${skipCount}개`)
  console.log(`  실패: ${errorCount}개`)

  // 5. 최종 확인
  const { count: newUnifiedCount } = await supabase
    .from('unified_reading_checks')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'church_reading_checks')

  console.log(`\n최종 상태:`)
  console.log(`  church_reading_checks: ${originalCount}개`)
  console.log(`  unified (church_reading_checks): ${newUnifiedCount}개`)

  if (originalCount === newUnifiedCount) {
    console.log(`\n✅ 완전 동기화 완료!`)
  } else {
    console.log(`\n⚠️ 아직 ${(originalCount || 0) - (newUnifiedCount || 0)}개 불일치`)
  }
}

migrateReadingChecks().catch(console.error)
