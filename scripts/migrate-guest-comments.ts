/**
 * guest_comments 누락분만 마이그레이션
 * 실행: npx tsx scripts/migrate-guest-comments.ts
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

async function migrateGuestComments() {
  console.log('='.repeat(60))
  console.log('guest_comments 누락분 마이그레이션')
  console.log('='.repeat(60))

  // 1. 누락된 guest_comments ID 찾기
  const { data: allGuestComments } = await supabase.from('guest_comments').select('id')
  const { data: unifiedGuestLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')

  const guestIdSet = new Set(allGuestComments?.map(g => g.id))
  const unifiedGuestLegacySet = new Set(unifiedGuestLegacy?.map(u => u.legacy_id).filter(Boolean))
  const missingGuestIds = [...guestIdSet].filter(id => !unifiedGuestLegacySet.has(id))

  console.log(`\n누락된 guest_comments: ${missingGuestIds.length}개`)

  if (missingGuestIds.length === 0) {
    console.log('✅ 누락된 데이터 없음')
    return
  }

  // 2. 누락된 guest_comments 전체 데이터 조회
  const { data: guestComments, error: fetchError } = await supabase
    .from('guest_comments')
    .select('*')
    .in('id', missingGuestIds)

  if (fetchError) {
    console.error('조회 실패:', fetchError.message)
    return
  }

  console.log(`\n조회된 데이터: ${guestComments?.length}개`)

  // 3. 데이터 샘플 출력
  if (guestComments && guestComments.length > 0) {
    console.log('\n샘플 데이터:')
    console.table(guestComments.slice(0, 5).map(gc => ({
      id: gc.id?.slice(0, 8),
      church_id: gc.church_id?.slice(0, 8),
      guest_name: gc.guest_name?.slice(0, 10),
      day: gc.day_number,
      content: (gc.content || '').slice(0, 20),
    })))
  }

  // 4. 마이그레이션 실행
  console.log('\n마이그레이션 시작...')

  const unifiedRecords = guestComments?.map(gc => ({
    user_id: gc.linked_user_id || null,
    guest_token: gc.device_id || null,
    author_name: gc.guest_name || '게스트',
    source_type: 'church',
    source_id: gc.church_id,
    content_type: 'free',
    day_number: gc.day_number,
    content: gc.content,
    bible_range: gc.bible_range,
    is_anonymous: gc.is_anonymous || false,
    is_pinned: false,
    likes_count: gc.likes_count || 0,
    replies_count: gc.replies_count || 0,
    created_at: gc.created_at,
    updated_at: gc.updated_at || gc.created_at,
    legacy_table: 'guest_comments',
    legacy_id: gc.id,
  })) || []

  // church_id가 없는 레코드 필터링
  const validRecords = unifiedRecords.filter(r => r.source_id)
  const invalidRecords = unifiedRecords.filter(r => !r.source_id)

  if (invalidRecords.length > 0) {
    console.log(`\n⚠️ church_id가 없는 레코드: ${invalidRecords.length}개 (건너뜀)`)
    console.log('건너뛴 레코드:', invalidRecords.map(r => r.legacy_id))
  }

  if (validRecords.length === 0) {
    console.log('❌ 유효한 레코드 없음')
    return
  }

  console.log(`\n삽입할 레코드: ${validRecords.length}개`)

  const { error: insertError, data: insertedData } = await supabase
    .from('unified_meditations')
    .insert(validRecords)
    .select()

  if (insertError) {
    console.error('삽입 실패:', insertError.message)
    console.error('상세:', insertError)

    // 개별 삽입 시도
    console.log('\n개별 삽입 시도...')
    let successCount = 0
    let failCount = 0

    for (const record of validRecords) {
      const { error } = await supabase.from('unified_meditations').insert([record])
      if (error) {
        console.error(`  실패 (${record.legacy_id}): ${error.message}`)
        failCount++
      } else {
        successCount++
      }
    }

    console.log(`\n개별 삽입 결과: 성공 ${successCount}개, 실패 ${failCount}개`)
  } else {
    console.log(`✅ ${insertedData?.length || validRecords.length}개 삽입 완료`)
  }

  // 5. 검증
  console.log('\n검증 중...')

  const { count: newUnifiedGuest } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'guest_comments')

  const { count: totalGuest } = await supabase
    .from('guest_comments')
    .select('*', { count: 'exact', head: true })

  console.log(`\n최종 상태:`)
  console.log(`  guest_comments 원본: ${totalGuest}개`)
  console.log(`  unified 내 guest_comments: ${newUnifiedGuest}개`)
  console.log(`  동기화율: ${Math.round((newUnifiedGuest || 0) / (totalGuest || 1) * 100)}%`)

  // 여전히 누락된 것 확인
  const { data: stillMissingCheck } = await supabase.from('guest_comments').select('id')
  const { data: newUnifiedLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')

  const newUnifiedSet = new Set(newUnifiedLegacy?.map(u => u.legacy_id).filter(Boolean))
  const stillMissing = stillMissingCheck?.filter(g => !newUnifiedSet.has(g.id)) || []

  if (stillMissing.length > 0) {
    console.log(`\n⚠️ 아직 누락: ${stillMissing.length}개`)
  } else {
    console.log(`\n✅ 모든 guest_comments 동기화 완료!`)
  }
}

migrateGuestComments().catch(console.error)
