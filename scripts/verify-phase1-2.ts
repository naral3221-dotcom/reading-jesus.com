/**
 * Phase 1-2 검증 스크립트
 * unified_meditations 스키마 확장 및 public_meditations 동기화 검증
 * 실행: npx tsx scripts/verify-phase1-2.ts
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
  console.log('=== 1차 검증: 데이터 무결성 확인 ===')
  console.log('='.repeat(60))

  // 1. unified_meditations source_type 분포 확인
  const { data: allData } = await supabase
    .from('unified_meditations')
    .select('source_type')

  const sourceTypeCounts: Record<string, number> = {}
  allData?.forEach(row => {
    sourceTypeCounts[row.source_type] = (sourceTypeCounts[row.source_type] || 0) + 1
  })

  console.log('\n1. unified_meditations source_type 분포:')
  Object.entries(sourceTypeCounts).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}개`)
  })

  // 2. 각 레거시 테이블과 동기화 상태 확인
  const tables = ['church_qt_posts', 'guest_comments', 'comments', 'public_meditations']

  console.log('\n2. 레거시 테이블 동기화 상태:')
  for (const table of tables) {
    const { count: totalCount } = await supabase.from(table).select('*', { count: 'exact', head: true })
    const { count: syncedCount } = await supabase
      .from('unified_meditations')
      .select('*', { count: 'exact', head: true })
      .eq('legacy_table', table)

    const syncRate = totalCount && totalCount > 0 ? ((syncedCount! / totalCount) * 100).toFixed(1) : '100.0'
    const status = syncRate === '100.0' ? '✅' : '⚠️'
    console.log(`   ${status} ${table}: ${totalCount}개 → 동기화: ${syncedCount}개 (${syncRate}%)`)
  }

  // 3. unified_meditations 총 개수
  const { count: totalUnified } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true })
  console.log(`\n3. unified_meditations 총 개수: ${totalUnified}개`)

  // 4. source_id NULL 허용 테스트 (public 타입)
  const { data: publicItems } = await supabase
    .from('unified_meditations')
    .select('id, source_type, source_id, content')
    .eq('source_type', 'public')
    .limit(3)

  console.log('\n4. public 타입 데이터 샘플 (source_id NULL 허용 확인):')
  if (publicItems && publicItems.length > 0) {
    publicItems.forEach((item, idx) => {
      const contentPreview = item.content?.slice(0, 30) || ''
      console.log(`   [${idx + 1}] id: ${item.id.slice(0, 8)}..., source_id: ${item.source_id}, content: "${contentPreview}..."`)
    })
  } else {
    console.log('   (public 타입 데이터 없음 - public_meditations 테이블이 비어있음)')
  }

  // 5. 트리거 작동 확인 (public_meditations에 데이터가 있는 경우)
  const { count: publicCount } = await supabase.from('public_meditations').select('*', { count: 'exact', head: true })
  const { count: syncedPublicCount } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'public_meditations')

  console.log('\n5. public_meditations 트리거 동기화 결과:')
  if (publicCount === 0) {
    console.log('   ℹ️  public_meditations 테이블에 데이터 없음 (향후 작성 시 자동 동기화됨)')
  } else if (publicCount === syncedPublicCount) {
    console.log(`   ✅ 완벽히 동기화됨: ${publicCount}개 → ${syncedPublicCount}개`)
  } else {
    console.log(`   ⚠️  동기화 불완전: ${publicCount}개 중 ${syncedPublicCount}개만 동기화됨`)
  }

  // 6. 스키마 제약조건 테스트 - public 타입 INSERT 테스트
  console.log('\n6. 스키마 제약조건 테스트:')

  // 실제 사용자 ID 가져오기
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single()

  if (!existingUser) {
    console.log('   ⚠️  테스트할 사용자 없음')
  } else {
    // 6.1 source_type='public' 허용 테스트
    const testId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('unified_meditations')
      .insert({
        id: testId,
        user_id: existingUser.id,
        source_type: 'public',
        source_id: null,
        content_type: 'free',
        content: '스키마 테스트 데이터 - 자동 삭제됨',
        author_name: null,
        is_anonymous: true,
        visibility: 'public',
        likes_count: 0,
        replies_count: 0,
        legacy_table: 'test',
        legacy_id: testId
      })

    if (insertError) {
      console.log(`   ❌ source_type='public', source_id=NULL INSERT 실패: ${insertError.message}`)
    } else {
      console.log(`   ✅ source_type='public', source_id=NULL INSERT 성공`)
      // 테스트 데이터 삭제
      await supabase.from('unified_meditations').delete().eq('id', testId)
      console.log(`   ✅ 테스트 데이터 정리 완료`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('=== 1차 검증 완료 ===')
  console.log('='.repeat(60))
}

verify().catch(console.error)
