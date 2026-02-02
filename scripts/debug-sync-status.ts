/**
 * 레거시 테이블과 unified_meditations 동기화 상태 확인
 * 실행: npx tsx scripts/debug-sync-status.ts
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

async function debugSyncStatus() {
  console.log('=== 🔄 동기화 상태 확인 ===\n')

  // KST 오늘/어제 날짜
  const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000))
  const todayKST = kstNow.toISOString().split('T')[0]
  const yesterdayKST = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const twoDaysAgo = new Date(`${yesterdayKST}T00:00:00+09:00`)

  console.log(`📅 오늘 (KST): ${todayKST}`)
  console.log(`📅 어제 (KST): ${yesterdayKST}\n`)

  // 1. guest_comments 최근 데이터
  console.log('=== 📝 guest_comments (레거시) ===')
  const { data: guestComments } = await supabase
    .from('guest_comments')
    .select('id, guest_name, day_number, visibility, created_at')
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  console.log(`총 ${guestComments?.length || 0}개\n`)
  guestComments?.slice(0, 5).forEach((gc, idx) => {
    const createdKST = new Date(new Date(gc.created_at).getTime() + (9 * 60 * 60 * 1000))
    console.log(`${idx + 1}. ${gc.guest_name} - Day ${gc.day_number} - ${gc.visibility} - ${createdKST.toISOString().split('T')[0]}`)
  })

  // 2. church_qt_posts 최근 데이터
  console.log('\n=== 📖 church_qt_posts (레거시) ===')
  const { data: churchQtPosts } = await supabase
    .from('church_qt_posts')
    .select('id, author_name, day_number, visibility, created_at')
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  console.log(`총 ${churchQtPosts?.length || 0}개\n`)
  churchQtPosts?.slice(0, 5).forEach((post, idx) => {
    const createdKST = new Date(new Date(post.created_at).getTime() + (9 * 60 * 60 * 1000))
    console.log(`${idx + 1}. ${post.author_name} - Day ${post.day_number} - ${post.visibility} - ${createdKST.toISOString().split('T')[0]}`)
  })

  // 3. unified_meditations에서 legacy_table별 분포
  console.log('\n=== 🔗 unified_meditations legacy_table 분포 ===')
  const { data: unifiedLegacy } = await supabase
    .from('unified_meditations')
    .select('legacy_table, legacy_id')
    .gte('created_at', twoDaysAgo.toISOString())

  const legacyCount: Record<string, number> = { 'null': 0 }
  unifiedLegacy?.forEach(item => {
    const key = item.legacy_table || 'null'
    legacyCount[key] = (legacyCount[key] || 0) + 1
  })

  for (const [table, count] of Object.entries(legacyCount)) {
    console.log(`  ${table}: ${count}개`)
  }

  // 4. 동기화 누락 확인 - guest_comments
  console.log('\n=== ⚠️ 동기화 누락 확인 (guest_comments) ===')
  const guestIds = guestComments?.map(gc => gc.id) || []
  const { data: syncedGuest } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')
    .in('legacy_id', guestIds)

  const syncedGuestIds = new Set(syncedGuest?.map(s => s.legacy_id) || [])
  const missingSyncGuest = guestComments?.filter(gc => !syncedGuestIds.has(gc.id)) || []

  if (missingSyncGuest.length > 0) {
    console.log(`❌ 동기화 누락: ${missingSyncGuest.length}개`)
    missingSyncGuest.forEach(gc => {
      console.log(`   - ${gc.id}: ${gc.guest_name} (Day ${gc.day_number})`)
    })
  } else {
    console.log(`✅ 모든 guest_comments 동기화됨`)
  }

  // 5. 동기화 누락 확인 - church_qt_posts
  console.log('\n=== ⚠️ 동기화 누락 확인 (church_qt_posts) ===')
  const qtIds = churchQtPosts?.map(p => p.id) || []
  const { data: syncedQt } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'church_qt_posts')
    .in('legacy_id', qtIds)

  const syncedQtIds = new Set(syncedQt?.map(s => s.legacy_id) || [])
  const missingSyncQt = churchQtPosts?.filter(p => !syncedQtIds.has(p.id)) || []

  if (missingSyncQt.length > 0) {
    console.log(`❌ 동기화 누락: ${missingSyncQt.length}개`)
    missingSyncQt.forEach(p => {
      console.log(`   - ${p.id}: ${p.author_name} (Day ${p.day_number})`)
    })
  } else {
    console.log(`✅ 모든 church_qt_posts 동기화됨`)
  }

  // 6. visibility 불일치 확인
  console.log('\n=== 🔍 visibility 불일치 확인 ===')

  // guest_comments vs unified_meditations
  for (const gc of (guestComments || [])) {
    const { data: unified } = await supabase
      .from('unified_meditations')
      .select('visibility')
      .eq('legacy_table', 'guest_comments')
      .eq('legacy_id', gc.id)
      .single()

    if (unified && unified.visibility !== gc.visibility) {
      console.log(`❌ guest_comments ${gc.id}: ${gc.visibility} ≠ unified ${unified.visibility}`)
    }
  }

  // church_qt_posts vs unified_meditations
  for (const p of (churchQtPosts || [])) {
    const { data: unified } = await supabase
      .from('unified_meditations')
      .select('visibility')
      .eq('legacy_table', 'church_qt_posts')
      .eq('legacy_id', p.id)
      .single()

    if (unified && unified.visibility !== p.visibility) {
      console.log(`❌ church_qt_posts ${p.id}: ${p.visibility} ≠ unified ${unified.visibility}`)
    }
  }

  console.log('\n✅ 확인 완료!')
}

debugSyncStatus().catch(console.error)
