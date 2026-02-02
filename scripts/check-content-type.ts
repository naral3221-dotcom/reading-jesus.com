/**
 * 오늘 content_type별 분포 확인
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnv() {
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
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000))
  const todayKST = kstNow.toISOString().split('T')[0]
  const todayStart = `${todayKST}T00:00:00+09:00`
  const todayEnd = `${todayKST}T23:59:59+09:00`

  console.log(`📅 오늘 (KST): ${todayKST}\n`)

  // 1. unified_meditations content_type별 분포
  console.log('=== 📊 오늘 unified_meditations 분포 ===')
  const { data: unifiedData } = await supabase
    .from('unified_meditations')
    .select('content_type, legacy_table, author_name')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd)

  const contentTypeCount: Record<string, number> = {}
  const legacyTableCount: Record<string, number> = {}

  unifiedData?.forEach(item => {
    contentTypeCount[item.content_type || 'null'] = (contentTypeCount[item.content_type || 'null'] || 0) + 1
    legacyTableCount[item.legacy_table || 'null'] = (legacyTableCount[item.legacy_table || 'null'] || 0) + 1
  })

  console.log('content_type별:')
  for (const [type, count] of Object.entries(contentTypeCount)) {
    console.log(`  ${type}: ${count}개`)
  }

  console.log('\nlegacy_table별:')
  for (const [table, count] of Object.entries(legacyTableCount)) {
    console.log(`  ${table}: ${count}개`)
  }

  console.log(`\n총: ${unifiedData?.length}개`)

  // 2. church_qt_posts와 비교
  console.log('\n=== 📖 오늘 church_qt_posts (레거시) ===')
  const { data: qtData } = await supabase
    .from('church_qt_posts')
    .select('id, author_name')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd)

  console.log(`총: ${qtData?.length}개`)
  qtData?.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.author_name}`)
  })

  // 3. guest_comments와 비교
  console.log('\n=== 💬 오늘 guest_comments (레거시) ===')
  const { data: commentData } = await supabase
    .from('guest_comments')
    .select('id, guest_name')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd)

  console.log(`총: ${commentData?.length}개`)
  commentData?.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.guest_name}`)
  })

  // 4. 동기화 상태 확인
  console.log('\n=== 🔄 동기화 상태 ===')
  const qtIds = qtData?.map(q => q.id) || []
  const commentIds = commentData?.map(c => c.id) || []

  const { data: syncedQt } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'church_qt_posts')
    .in('legacy_id', qtIds.map(id => id.toString()))

  const { data: syncedComments } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')
    .in('legacy_id', commentIds.map(id => id.toString()))

  console.log(`church_qt_posts 동기화: ${syncedQt?.length}/${qtData?.length}`)
  console.log(`guest_comments 동기화: ${syncedComments?.length}/${commentData?.length}`)
}

check().catch(console.error)
