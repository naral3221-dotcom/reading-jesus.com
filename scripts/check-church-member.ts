/**
 * 교회 멤버 등록 상태 확인
 * 실행: npx tsx scripts/check-church-member.ts
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

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkChurchMember() {
  console.log('=== 🏛️ 교회 멤버 상태 확인 ===\n')

  // 1. 교회 정보
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name, code')

  console.log('=== 📍 교회 목록 ===')
  churches?.forEach(c => {
    console.log(`  ${c.name} (${c.code}): ${c.id}`)
  })
  console.log('')

  const churchId = churches?.[0]?.id
  if (!churchId) {
    console.log('교회 없음')
    return
  }

  // 2. church_members 테이블 확인
  console.log('=== 👥 교회 멤버 (church_members 테이블) ===')
  const { data: members, error: membersError } = await supabase
    .from('church_members')
    .select('user_id, role, joined_at')
    .eq('church_id', churchId)

  if (membersError) {
    console.log('Error:', membersError.message)
  } else {
    console.log(`총 ${members?.length || 0}명\n`)

    // 프로필 정보 조회
    const userIds = members?.map(m => m.user_id) || []
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, email')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    members?.slice(0, 20).forEach((m, idx) => {
      const profile = profileMap.get(m.user_id)
      console.log(`${idx + 1}. ${profile?.nickname || 'N/A'} (${profile?.email || 'N/A'}) - ${m.role}`)
    })
  }
  console.log('')

  // 3. profiles 테이블에서 church_id 확인
  console.log('=== 👤 프로필에 church_id 설정된 사용자 ===')
  const { data: profilesWithChurch } = await supabase
    .from('profiles')
    .select('id, nickname, email, church_id')
    .eq('church_id', churchId)

  console.log(`총 ${profilesWithChurch?.length || 0}명\n`)
  profilesWithChurch?.slice(0, 20).forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.nickname} (${p.email})`)
  })
  console.log('')

  // 4. 불일치 확인
  console.log('=== ⚠️ 불일치 확인 ===')
  const memberUserIds = new Set(members?.map(m => m.user_id) || [])
  const profileUserIds = new Set(profilesWithChurch?.map(p => p.id) || [])

  const inProfileNotInMember = profilesWithChurch?.filter(p => !memberUserIds.has(p.id)) || []
  const inMemberNotInProfile = members?.filter(m => !profileUserIds.has(m.user_id)) || []

  if (inProfileNotInMember.length > 0) {
    console.log(`\n❌ profiles.church_id는 있지만 church_members에 없는 사용자: ${inProfileNotInMember.length}명`)
    inProfileNotInMember.forEach(p => {
      console.log(`   - ${p.nickname} (${p.email})`)
    })
  }

  if (inMemberNotInProfile.length > 0) {
    console.log(`\n❌ church_members에는 있지만 profiles.church_id가 다른 사용자: ${inMemberNotInProfile.length}명`)
  }

  if (inProfileNotInMember.length === 0 && inMemberNotInProfile.length === 0) {
    console.log('✅ 모든 데이터 일치')
  }

  // 5. RLS 정책 조건 확인
  console.log('\n=== 📋 RLS 정책 조건 ===')
  console.log('unified_meditations SELECT 정책:')
  console.log('  - visibility = "public" → 누구나')
  console.log('  - user_id = auth.uid() → 본인')
  console.log('  - visibility = "church" AND church_members에 등록 → 교회 멤버')
  console.log('')
  console.log('⚠️ 주의: RLS는 church_members 테이블을 확인함!')
  console.log('   profiles.church_id가 있어도 church_members에 없으면 교회 글 못 봄!')
}

checkChurchMember().catch(console.error)
