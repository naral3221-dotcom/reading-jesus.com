/**
 * DB 데이터 확인 스크립트
 * 실행: npx tsx scripts/check-db-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// .env.local 파일 직접 파싱
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

async function checkData() {
  console.log('🔍 데이터베이스 조회 시작...\n')

  // 1. 교회 목록
  console.log('=== 📍 교회 목록 ===')
  const { data: churches } = await supabase.from('churches').select('id, name, code, created_at').limit(10)
  console.table(churches)

  // 2. 프로필 (최근 10명)
  console.log('\n=== 👤 최근 가입 사용자 ===')
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, email, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  console.table(profiles)

  // 3. 그룹 목록
  console.log('\n=== 👥 그룹 목록 ===')
  const { data: groups } = await supabase.from('groups').select('id, name, invite_code, created_at').limit(10)
  console.table(groups)

  // 4. 통합 묵상 (최근 5개)
  console.log('\n=== 📝 최근 통합 묵상 ===')
  const { data: meditations } = await supabase
    .from('unified_meditations')
    .select('id, author_name, source_type, content_type, day_number, likes_count, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  console.table(meditations)

  // 5. 교회 QT 게시물 (최근 5개)
  console.log('\n=== 📖 최근 교회 QT 게시물 ===')
  const { data: qtPosts } = await supabase
    .from('church_qt_posts')
    .select('id, title, date, likes_count, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  console.table(qtPosts)

  // 6. 팔로우 관계
  console.log('\n=== 🤝 팔로우 관계 ===')
  const { data: follows } = await supabase
    .from('user_follows')
    .select(`
      id,
      follower:follower_id(nickname),
      following:following_id(nickname),
      created_at
    `)
    .limit(10)
  console.table(follows)

  // 7. 통계 요약
  console.log('\n=== 📊 통계 요약 ===')
  const stats = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('unified_meditations').select('*', { count: 'exact', head: true }),
    supabase.from('church_qt_posts').select('*', { count: 'exact', head: true }),
    supabase.from('user_follows').select('*', { count: 'exact', head: true }),
  ])

  console.log({
    총_사용자: stats[0].count,
    통합_묵상: stats[1].count,
    교회_QT_게시물: stats[2].count,
    팔로우_관계: stats[3].count,
  })

  console.log('\n✅ 조회 완료!')
}

checkData().catch(console.error)
