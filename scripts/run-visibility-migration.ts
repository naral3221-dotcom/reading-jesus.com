/**
 * visibility 제한 제거 마이그레이션 실행
 * 실행: npx tsx scripts/run-visibility-migration.ts
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

async function runMigration() {
  console.log('=== 🚀 Visibility 마이그레이션 시작 ===\n')

  // 1. 현재 상태 확인
  console.log('=== 📊 현재 상태 ===')
  const { data: beforeUnified } = await supabase
    .from('unified_meditations')
    .select('visibility')

  const beforeCount: Record<string, number> = {}
  beforeUnified?.forEach(item => {
    beforeCount[item.visibility || 'null'] = (beforeCount[item.visibility || 'null'] || 0) + 1
  })
  console.log('unified_meditations visibility 분포 (마이그레이션 전):')
  for (const [vis, count] of Object.entries(beforeCount)) {
    console.log(`  ${vis}: ${count}개`)
  }
  console.log('')

  // 2. unified_meditations 업데이트
  console.log('=== 1️⃣ unified_meditations → public ===')
  const { error: e1, count: c1 } = await supabase
    .from('unified_meditations')
    .update({ visibility: 'public' })
    .neq('visibility', 'public')
    .select('*', { count: 'exact', head: true })

  if (e1) {
    console.error('Error:', e1.message)
  } else {
    console.log(`✅ 업데이트 완료`)
  }

  // 3. guest_comments 업데이트
  console.log('\n=== 2️⃣ guest_comments → public ===')
  const { error: e2 } = await supabase
    .from('guest_comments')
    .update({ visibility: 'public' })
    .neq('visibility', 'public')

  if (e2) {
    console.error('Error:', e2.message)
  } else {
    console.log(`✅ 업데이트 완료`)
  }

  // 4. church_qt_posts 업데이트
  console.log('\n=== 3️⃣ church_qt_posts → public ===')
  const { error: e3 } = await supabase
    .from('church_qt_posts')
    .update({ visibility: 'public' })
    .neq('visibility', 'public')

  if (e3) {
    console.error('Error:', e3.message)
  } else {
    console.log(`✅ 업데이트 완료`)
  }

  // 5. 결과 확인
  console.log('\n=== 📊 마이그레이션 후 상태 ===')
  const { data: afterUnified } = await supabase
    .from('unified_meditations')
    .select('visibility')

  const afterCount: Record<string, number> = {}
  afterUnified?.forEach(item => {
    afterCount[item.visibility || 'null'] = (afterCount[item.visibility || 'null'] || 0) + 1
  })
  console.log('unified_meditations visibility 분포 (마이그레이션 후):')
  for (const [vis, count] of Object.entries(afterCount)) {
    console.log(`  ${vis}: ${count}개`)
  }

  // 6. RLS 정책 변경 안내
  console.log('\n=== ⚠️ 중요: RLS 정책 변경 필요 ===')
  console.log('Supabase Dashboard에서 다음 SQL을 실행하세요:')
  console.log('')
  console.log(`
-- unified_meditations RLS 정책 변경
DROP POLICY IF EXISTS "unified_meditations_select_by_visibility" ON unified_meditations;
DROP POLICY IF EXISTS "unified_meditations_select" ON unified_meditations;
CREATE POLICY "unified_meditations_select_public" ON unified_meditations
  FOR SELECT USING (true);

-- guest_comments RLS 정책 변경
DROP POLICY IF EXISTS "guest_comments_select_by_visibility" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_select" ON guest_comments;
CREATE POLICY "guest_comments_select_public" ON guest_comments
  FOR SELECT USING (true);

-- church_qt_posts RLS 정책 변경
DROP POLICY IF EXISTS "church_qt_posts_select_by_visibility" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select" ON church_qt_posts;
CREATE POLICY "church_qt_posts_select_public" ON church_qt_posts
  FOR SELECT USING (true);
  `)

  console.log('\n✅ 데이터 마이그레이션 완료!')
  console.log('⚠️ RLS 정책은 Supabase Dashboard에서 수동으로 실행해주세요.')
}

runMigration().catch(console.error)
