/**
 * 오늘 작성된 글 상세 디버깅
 * 실행: npx tsx scripts/debug-today-posts.ts
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

async function debugTodayPosts() {
  // 한국 시간 기준 오늘/어제 날짜 계산
  const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000))
  const todayKST = kstNow.toISOString().split('T')[0]

  // 어제 날짜
  const yesterdayKST = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // 이틀 전부터 조회
  const twoDaysAgo = new Date(`${yesterdayKST}T00:00:00+09:00`)

  console.log('📅 오늘 (KST):', todayKST)
  console.log('📅 어제 (KST):', yesterdayKST)
  console.log('')

  // 1. unified_meditations 상세 조회 (최근 2일) - 전체 컬럼
  console.log('=== 📝 unified_meditations (최근 2일) ===')
  const { data: unifiedPosts, error: e1 } = await supabase
    .from('unified_meditations')
    .select('*')
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (e1) {
    console.error('Error:', e1)
  } else if (unifiedPosts) {
    console.log(`총 ${unifiedPosts.length}개 조회됨\n`)
    if (unifiedPosts.length > 0) {
      console.log('첫 번째 레코드 컬럼들:', Object.keys(unifiedPosts[0]).join(', '))
      console.log('')
    }
    unifiedPosts.forEach((post, idx) => {
      const createdKST = new Date(new Date(post.created_at).getTime() + (9 * 60 * 60 * 1000))
      const dateStr = createdKST.toISOString().split('T')[0]
      const timeStr = createdKST.toISOString().split('T')[1].substring(0, 8)
      const isToday = dateStr === todayKST
      console.log(`${idx + 1}. [${isToday ? '오늘' : '어제'}] ${dateStr} ${timeStr} KST`)
      console.log(`   ID: ${post.id}`)
      console.log(`   작성자: ${post.author_name || post.user_id || 'N/A'}`)
      console.log(`   타입: ${post.source_type} / ${post.content_type}`)
      console.log(`   공개범위: ${post.visibility}`)
      console.log(`   일차: ${post.day_number}`)
      console.log('')
    })
  }

  // 2. church_qt_posts 상세 조회 (최근 2일)
  console.log('=== 📖 church_qt_posts (최근 2일) ===')
  const { data: churchPosts, error: e2 } = await supabase
    .from('church_qt_posts')
    .select('*')
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (e2) {
    console.error('Error:', e2)
  } else if (churchPosts) {
    console.log(`총 ${churchPosts.length}개 조회됨\n`)
    if (churchPosts.length > 0) {
      console.log('첫 번째 레코드 컬럼들:', Object.keys(churchPosts[0]).join(', '))
      console.log('')
    }
    churchPosts.forEach((post, idx) => {
      const createdKST = new Date(new Date(post.created_at).getTime() + (9 * 60 * 60 * 1000))
      const dateStr = createdKST.toISOString().split('T')[0]
      const timeStr = createdKST.toISOString().split('T')[1].substring(0, 8)
      const isToday = dateStr === todayKST
      console.log(`${idx + 1}. [${isToday ? '오늘' : '어제'}] ${dateStr} ${timeStr} KST`)
      console.log(`   ID: ${post.id}`)
      console.log(`   날짜 필드: ${post.date}`)
      console.log(`   공개범위: ${post.visibility}`)
      console.log(`   user_id: ${post.user_id}`)
      console.log('')
    })
  }

  // 3. guest_comments 확인 (레거시 테이블)
  console.log('=== 💬 guest_comments (최근 2일, 레거시) ===')
  const { data: guestComments, error: e3 } = await supabase
    .from('guest_comments')
    .select('*')
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (e3) {
    console.error('Error:', e3)
  } else if (guestComments) {
    console.log(`총 ${guestComments.length}개 조회됨\n`)
    if (guestComments.length > 0) {
      console.log('첫 번째 레코드 컬럼들:', Object.keys(guestComments[0]).join(', '))
      console.log('')
    }
    guestComments.forEach((post, idx) => {
      const createdKST = new Date(new Date(post.created_at).getTime() + (9 * 60 * 60 * 1000))
      const dateStr = createdKST.toISOString().split('T')[0]
      const timeStr = createdKST.toISOString().split('T')[1].substring(0, 8)
      const isToday = dateStr === todayKST
      console.log(`${idx + 1}. [${isToday ? '오늘' : '어제'}] ${dateStr} ${timeStr} KST`)
      console.log(`   ID: ${post.id}`)
      console.log(`   작성자: ${post.author_name || post.profile_id || 'N/A'}`)
      console.log(`   일차: ${post.day_number}`)
      console.log(`   공개범위: ${post.visibility}`)
      console.log('')
    })
  }

  // 4. 요약 통계
  console.log('=== 📊 요약 ===')
  const todayUnified = unifiedPosts?.filter(p => {
    const createdKST = new Date(new Date(p.created_at).getTime() + (9 * 60 * 60 * 1000))
    return createdKST.toISOString().split('T')[0] === todayKST
  }) || []

  const todayChurch = churchPosts?.filter(p => {
    const createdKST = new Date(new Date(p.created_at).getTime() + (9 * 60 * 60 * 1000))
    return createdKST.toISOString().split('T')[0] === todayKST
  }) || []

  const todayGuest = guestComments?.filter(p => {
    const createdKST = new Date(new Date(p.created_at).getTime() + (9 * 60 * 60 * 1000))
    return createdKST.toISOString().split('T')[0] === todayKST
  }) || []

  console.log(`오늘 unified_meditations: ${todayUnified.length}개`)
  if (todayUnified.length > 0) {
    console.log(`  - visibility별: ${JSON.stringify(todayUnified.reduce((acc, p) => {
      acc[p.visibility || 'null'] = (acc[p.visibility || 'null'] || 0) + 1
      return acc
    }, {} as Record<string, number>))}`)
  }

  console.log(`오늘 church_qt_posts: ${todayChurch.length}개`)
  if (todayChurch.length > 0) {
    console.log(`  - visibility별: ${JSON.stringify(todayChurch.reduce((acc, p) => {
      acc[p.visibility || 'null'] = (acc[p.visibility || 'null'] || 0) + 1
      return acc
    }, {} as Record<string, number>))}`)
  }

  console.log(`오늘 guest_comments: ${todayGuest.length}개`)
  if (todayGuest.length > 0) {
    console.log(`  - visibility별: ${JSON.stringify(todayGuest.reduce((acc, p) => {
      acc[p.visibility || 'null'] = (acc[p.visibility || 'null'] || 0) + 1
      return acc
    }, {} as Record<string, number>))}`)
  }
}

debugTodayPosts().catch(console.error)
