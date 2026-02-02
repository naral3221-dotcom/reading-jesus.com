/**
 * RLS 정책 업데이트 (Service Role로 실행)
 * 실행: npx tsx scripts/update-rls-policies.ts
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

async function updateRLSPolicies() {
  console.log('=== 🔐 RLS 정책 업데이트 ===\n')

  const sql = `
-- unified_meditations RLS 정책 변경
DROP POLICY IF EXISTS "unified_meditations_select_by_visibility" ON unified_meditations;
DROP POLICY IF EXISTS "unified_meditations_select" ON unified_meditations;
DROP POLICY IF EXISTS "unified_meditations_select_public" ON unified_meditations;

CREATE POLICY "unified_meditations_select_public" ON unified_meditations
  FOR SELECT USING (true);

-- guest_comments RLS 정책 변경
DROP POLICY IF EXISTS "guest_comments_select_by_visibility" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_select" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_select_public" ON guest_comments;

CREATE POLICY "guest_comments_select_public" ON guest_comments
  FOR SELECT USING (true);

-- church_qt_posts RLS 정책 변경
DROP POLICY IF EXISTS "church_qt_posts_select_by_visibility" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select_public" ON church_qt_posts;

CREATE POLICY "church_qt_posts_select_public" ON church_qt_posts
  FOR SELECT USING (true);
`

  // Supabase에서 직접 SQL을 실행할 수 없으므로,
  // rpc 함수를 통해 실행하거나 Dashboard에서 실행해야 함
  // 여기서는 검증만 수행

  console.log('위 SQL을 Supabase Dashboard의 SQL Editor에서 실행해주세요:')
  console.log('https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql/new')
  console.log('')
  console.log(sql)
  console.log('')

  // 현재 RLS 상태 테스트 (anon key로)
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseAnon = createClient(supabaseUrl, anonKey)

  console.log('=== 🧪 현재 RLS 테스트 (Anon Key) ===')

  // KST 오늘 날짜
  const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000))
  const todayKST = kstNow.toISOString().split('T')[0]
  const todayStartKST = `${todayKST}T00:00:00+09:00`
  const todayEndKST = `${todayKST}T23:59:59+09:00`

  const { count: adminCount } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartKST)
    .lte('created_at', todayEndKST)

  const { count: anonCount } = await supabaseAnon
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartKST)
    .lte('created_at', todayEndKST)

  console.log(`Service Role (오늘): ${adminCount}개`)
  console.log(`Anon Key (오늘): ${anonCount}개`)

  if (adminCount === anonCount) {
    console.log('\n✅ RLS 정책이 올바르게 설정되어 있습니다!')
  } else {
    console.log('\n⚠️ RLS 정책 업데이트가 필요합니다.')
    console.log(`   차이: ${(adminCount || 0) - (anonCount || 0)}개가 Anon에서 숨겨짐`)
  }
}

updateRLSPolicies().catch(console.error)
