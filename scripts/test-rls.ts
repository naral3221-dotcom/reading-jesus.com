/**
 * RLS 적용 여부 테스트
 * Service Role (RLS 무시) vs Anon Key (RLS 적용) 비교
 * 실행: npx tsx scripts/test-rls.ts
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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Service Role Client (RLS 무시)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

// Anon Client (RLS 적용 - 비로그인 사용자)
const supabaseAnon = createClient(supabaseUrl, anonKey)

async function testRLS() {
  console.log('=== 🔐 RLS 적용 테스트 ===\n')

  // KST 오늘 날짜
  const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000))
  const todayKST = kstNow.toISOString().split('T')[0]

  // 방법 1: 타임존 없는 문자열 (현재 코드 방식)
  const todayStartNoTZ = `${todayKST}T00:00:00`
  const todayEndNoTZ = `${todayKST}T23:59:59`

  // 방법 2: KST 타임존 명시
  const todayStartKST = `${todayKST}T00:00:00+09:00`
  const todayEndKST = `${todayKST}T23:59:59+09:00`

  console.log(`📅 오늘 (KST): ${todayKST}`)
  console.log(`📅 방법1 (타임존 없음): ${todayStartNoTZ} ~ ${todayEndNoTZ}`)
  console.log(`📅 방법2 (KST 명시): ${todayStartKST} ~ ${todayEndKST}`)
  console.log('')

  // ============================================
  // 1. 전체 카운트 비교
  // ============================================
  console.log('=== 📊 전체 카운트 비교 ===')

  const { count: adminTotal } = await supabaseAdmin
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })

  const { count: anonTotal } = await supabaseAnon
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })

  console.log(`Service Role (RLS 무시): ${adminTotal}개`)
  console.log(`Anon Key (RLS 적용): ${anonTotal}개`)
  console.log(`차이: ${(adminTotal || 0) - (anonTotal || 0)}개 (RLS로 숨겨진 글)`)
  console.log('')

  // ============================================
  // 2. 오늘 카운트 비교 (방법 1: 타임존 없음)
  // ============================================
  console.log('=== 📊 오늘 카운트 (방법1: 타임존 없음) ===')

  const { count: adminTodayNoTZ } = await supabaseAdmin
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartNoTZ)
    .lte('created_at', todayEndNoTZ)

  const { count: anonTodayNoTZ } = await supabaseAnon
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartNoTZ)
    .lte('created_at', todayEndNoTZ)

  console.log(`Service Role (RLS 무시): ${adminTodayNoTZ}개`)
  console.log(`Anon Key (RLS 적용): ${anonTodayNoTZ}개`)
  console.log('')

  // ============================================
  // 3. 오늘 카운트 비교 (방법 2: KST 명시)
  // ============================================
  console.log('=== 📊 오늘 카운트 (방법2: KST 타임존 명시) ===')

  const { count: adminTodayKST } = await supabaseAdmin
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartKST)
    .lte('created_at', todayEndKST)

  const { count: anonTodayKST } = await supabaseAnon
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartKST)
    .lte('created_at', todayEndKST)

  console.log(`Service Role (RLS 무시): ${adminTodayKST}개`)
  console.log(`Anon Key (RLS 적용): ${anonTodayKST}개`)
  console.log('')

  // ============================================
  // 4. visibility별 카운트 (Service Role)
  // ============================================
  console.log('=== 📊 오늘 visibility별 카운트 (Service Role) ===')

  const { data: visibilityData } = await supabaseAdmin
    .from('unified_meditations')
    .select('visibility')
    .gte('created_at', todayStartKST)
    .lte('created_at', todayEndKST)

  const visCounts: Record<string, number> = {}
  visibilityData?.forEach(item => {
    visCounts[item.visibility || 'null'] = (visCounts[item.visibility || 'null'] || 0) + 1
  })

  for (const [vis, count] of Object.entries(visCounts)) {
    console.log(`  ${vis}: ${count}개`)
  }
  console.log('')

  // ============================================
  // 5. Anon으로 조회되는 글 상세
  // ============================================
  console.log('=== 📝 Anon Key로 조회되는 오늘 글 (비로그인 사용자) ===')

  const { data: anonData, error: anonError } = await supabaseAnon
    .from('unified_meditations')
    .select('id, author_name, visibility, source_type, created_at')
    .gte('created_at', todayStartKST)
    .lte('created_at', todayEndKST)
    .order('created_at', { ascending: false })

  if (anonError) {
    console.log('Error:', anonError.message)
  } else {
    console.log(`총 ${anonData?.length || 0}개\n`)
    anonData?.forEach((item, idx) => {
      const createdKST = new Date(new Date(item.created_at).getTime() + (9 * 60 * 60 * 1000))
      const timeStr = createdKST.toISOString().split('T')[1].substring(0, 5)
      console.log(`${idx + 1}. [${item.visibility}] ${item.author_name} - ${item.source_type} - ${timeStr} KST`)
    })
  }
  console.log('')

  // ============================================
  // 6. Service Role으로 조회되는 글 상세
  // ============================================
  console.log('=== 📝 Service Role로 조회되는 오늘 글 (전체) ===')

  const { data: adminData } = await supabaseAdmin
    .from('unified_meditations')
    .select('id, author_name, visibility, source_type, created_at')
    .gte('created_at', todayStartKST)
    .lte('created_at', todayEndKST)
    .order('created_at', { ascending: false })

  console.log(`총 ${adminData?.length || 0}개\n`)
  adminData?.forEach((item, idx) => {
    const createdKST = new Date(new Date(item.created_at).getTime() + (9 * 60 * 60 * 1000))
    const timeStr = createdKST.toISOString().split('T')[1].substring(0, 5)
    const hiddenFromAnon = !anonData?.find(a => a.id === item.id)
    const marker = hiddenFromAnon ? '🔒' : '✅'
    console.log(`${idx + 1}. ${marker} [${item.visibility}] ${item.author_name} - ${item.source_type} - ${timeStr} KST`)
  })

  console.log('\n🔒 = RLS로 비로그인 사용자에게 숨겨짐')
  console.log('✅ = 비로그인 사용자도 볼 수 있음')
}

testRLS().catch(console.error)
