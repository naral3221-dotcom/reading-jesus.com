/**
 * 피드 쿼리 디버깅
 * 실행: npx tsx scripts/debug-feed-query.ts
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

async function debugFeedQuery() {
  console.log('=== 🔍 피드 쿼리 디버깅 ===\n')

  // 1. 모든 교회 목록 확인
  console.log('=== 📍 교회 목록 ===')
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name, code')

  churches?.forEach(c => {
    console.log(`  - ${c.name} (code: ${c.code}, id: ${c.id})`)
  })
  console.log('')

  // 2. unified_meditations의 source_id별 분포
  console.log('=== 📊 unified_meditations source_id 분포 ===')
  const { data: sourceDistribution } = await supabase
    .from('unified_meditations')
    .select('source_type, source_id')
    .order('created_at', { ascending: false })
    .limit(100)

  const sourceCount: Record<string, number> = {}
  sourceDistribution?.forEach(item => {
    const key = `${item.source_type}:${item.source_id}`
    sourceCount[key] = (sourceCount[key] || 0) + 1
  })

  for (const [key, count] of Object.entries(sourceCount)) {
    console.log(`  ${key}: ${count}개`)
  }
  console.log('')

  // 3. 메인 피드 쿼리 시뮬레이션 (public + church visibility)
  console.log('=== 🌍 메인 피드 쿼리 (all 탭) ===')
  const { data: mainFeed, error: mainError } = await supabase
    .from('unified_meditations')
    .select('id, author_name, source_type, visibility, created_at')
    .in('visibility', ['public', 'church'])
    .order('created_at', { ascending: false })
    .limit(20)

  if (mainError) {
    console.error('Error:', mainError)
  } else {
    console.log(`총 ${mainFeed?.length}개 조회됨\n`)
    mainFeed?.slice(0, 10).forEach((item, idx) => {
      const createdKST = new Date(new Date(item.created_at).getTime() + (9 * 60 * 60 * 1000))
      console.log(`${idx + 1}. [${item.visibility}] ${item.author_name} - ${createdKST.toISOString().split('T')[0]}`)
    })
  }
  console.log('')

  // 4. 각 교회별 피드 쿼리 시뮬레이션
  if (churches) {
    for (const church of churches) {
      console.log(`=== 🏛️ 교회 피드 (${church.name}) ===`)
      const { data: churchFeed, error: churchError } = await supabase
        .from('unified_meditations')
        .select('id, author_name, source_type, source_id, visibility, created_at')
        .eq('source_type', 'church')
        .eq('source_id', church.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (churchError) {
        console.error('Error:', churchError)
      } else {
        console.log(`총 ${churchFeed?.length}개 조회됨`)
        churchFeed?.forEach((item, idx) => {
          const createdKST = new Date(new Date(item.created_at).getTime() + (9 * 60 * 60 * 1000))
          console.log(`  ${idx + 1}. [${item.visibility}] ${item.author_name} - ${createdKST.toISOString().split('T')[0]}`)
        })
      }
      console.log('')
    }
  }

  // 5. RLS 확인을 위해 anon key로 동일 쿼리 (옵션)
  console.log('=== 🔐 visibility 분포 확인 ===')
  const { data: visibilityData } = await supabase
    .from('unified_meditations')
    .select('visibility')
    .order('created_at', { ascending: false })
    .limit(100)

  const visCount: Record<string, number> = {}
  visibilityData?.forEach(item => {
    visCount[item.visibility || 'null'] = (visCount[item.visibility || 'null'] || 0) + 1
  })

  for (const [vis, count] of Object.entries(visCount)) {
    console.log(`  ${vis}: ${count}개`)
  }
}

debugFeedQuery().catch(console.error)
