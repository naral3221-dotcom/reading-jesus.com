/**
 * 오늘 작성된 글 개수 확인
 * 실행: npx tsx scripts/check-today-posts.ts
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

async function checkTodayPosts() {
  // 한국 시간 기준 오늘 날짜 계산
  const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000))
  const todayKST = kstNow.toISOString().split('T')[0]

  // KST 오늘 00:00:00 → UTC로 변환
  const todayStart = new Date(`${todayKST}T00:00:00+09:00`)
  const todayEnd = new Date(`${todayKST}T23:59:59+09:00`)

  console.log('📅 조회 기준일 (KST):', todayKST)
  console.log('📅 시작 시간 (UTC):', todayStart.toISOString())
  console.log('📅 종료 시간 (UTC):', todayEnd.toISOString())
  console.log('')

  // 1. 통합 묵상 테이블에서 오늘 작성된 글 조회
  const { count: unifiedCount, error: e1 } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  // 2. content_type별 분포 (참고용)
  const { data: contentTypeData } = await supabase
    .from('unified_meditations')
    .select('content_type')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  const contentTypeCount: Record<string, number> = {}
  contentTypeData?.forEach(item => {
    contentTypeCount[item.content_type || 'null'] = (contentTypeCount[item.content_type || 'null'] || 0) + 1
  })

  // 3. 소스별 상세 조회
  const { data: sourceBreakdown } = await supabase
    .from('unified_meditations')
    .select('source_type')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  // 소스 타입별 집계
  const sourceCount: Record<string, number> = {}
  sourceBreakdown?.forEach(item => {
    sourceCount[item.source_type] = (sourceCount[item.source_type] || 0) + 1
  })

  console.log('=== 📊 오늘 작성된 글 (KST 기준) ===')
  console.log('')
  console.log('📝 통합 테이블 (unified_meditations):', unifiedCount ?? 0, '개')
  if (Object.keys(sourceCount).length > 0) {
    console.log('   └─ 소스별 상세:')
    for (const [source, count] of Object.entries(sourceCount)) {
      console.log(`      • ${source}: ${count}개`)
    }
  }
  if (Object.keys(contentTypeCount).length > 0) {
    console.log('   └─ 타입별 상세:')
    for (const [type, count] of Object.entries(contentTypeCount)) {
      const label = type === 'qt' ? 'QT' : type === 'free' ? '묵상' : type
      console.log(`      • ${label}: ${count}개`)
    }
  }
  console.log('')
  console.log('✅ 오늘의 총 글 수:', unifiedCount ?? 0, '개')
  console.log('   (QT + 묵상 모두 포함)')

  if (e1) console.error('Error:', e1)
}

checkTodayPosts().catch(console.error)
