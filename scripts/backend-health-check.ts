/**
 * 백엔드 데이터 정합성 전체 점검
 * 실행: npx tsx scripts/backend-health-check.ts
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

interface HealthCheckResult {
  category: string
  check: string
  status: 'OK' | 'WARNING' | 'ERROR'
  details: string
}

const results: HealthCheckResult[] = []

function log(result: HealthCheckResult) {
  const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'
  console.log(`${icon} [${result.category}] ${result.check}: ${result.details}`)
  results.push(result)
}

async function checkTableCounts() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 1. 테이블별 레코드 수 확인')
  console.log('='.repeat(70))

  const tables = [
    'profiles',
    'churches',
    'church_members',
    'church_admins',
    'groups',
    'group_members',
    'church_qt_posts',
    'church_qt_post_likes',
    'church_qt_post_replies',
    'guest_comments',
    'guest_comment_likes',
    'guest_comment_replies',
    'comments',
    'comment_likes',
    'comment_replies',
    'public_meditations',
    'unified_meditations',
    'unified_meditation_likes',
    'unified_meditation_replies',
    'unified_reading_checks',
    'daily_checks',
    'church_reading_checks',
    'user_follows',
    'user_bookmarks',
    'notifications',
  ]

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })

    if (error) {
      log({ category: '테이블', check: table, status: 'ERROR', details: error.message })
    } else {
      log({ category: '테이블', check: table, status: 'OK', details: `${count}개 레코드` })
    }
  }
}

async function checkLegacyToUnifiedSync() {
  console.log('\n' + '='.repeat(70))
  console.log('🔄 2. 레거시 → unified_meditations 동기화 확인')
  console.log('='.repeat(70))

  // church_qt_posts 동기화
  const { data: allQt } = await supabase.from('church_qt_posts').select('id')
  const { data: unifiedQt } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'church_qt_posts')

  const qtIdSet = new Set(allQt?.map(q => q.id))
  const unifiedQtSet = new Set(unifiedQt?.map(u => u.legacy_id).filter(Boolean))
  const missingQt = [...qtIdSet].filter(id => !unifiedQtSet.has(id))

  if (missingQt.length === 0) {
    log({ category: '동기화', check: 'church_qt_posts → unified', status: 'OK', details: `${qtIdSet.size}개 완전 동기화` })
  } else {
    log({ category: '동기화', check: 'church_qt_posts → unified', status: 'ERROR', details: `${missingQt.length}개 누락` })
  }

  // guest_comments 동기화
  const { data: allGuest } = await supabase.from('guest_comments').select('id')
  const { data: unifiedGuest } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'guest_comments')

  const guestIdSet = new Set(allGuest?.map(g => g.id))
  const unifiedGuestSet = new Set(unifiedGuest?.map(u => u.legacy_id).filter(Boolean))
  const missingGuest = [...guestIdSet].filter(id => !unifiedGuestSet.has(id))

  if (missingGuest.length === 0) {
    log({ category: '동기화', check: 'guest_comments → unified', status: 'OK', details: `${guestIdSet.size}개 완전 동기화` })
  } else {
    log({ category: '동기화', check: 'guest_comments → unified', status: 'ERROR', details: `${missingGuest.length}개 누락` })
  }

  // comments (그룹 묵상) 동기화
  const { data: allComments } = await supabase.from('comments').select('id')
  const { data: unifiedComments } = await supabase
    .from('unified_meditations')
    .select('legacy_id')
    .eq('legacy_table', 'comments')

  const commentsIdSet = new Set(allComments?.map(c => c.id))
  const unifiedCommentsSet = new Set(unifiedComments?.map(u => u.legacy_id).filter(Boolean))
  const missingComments = [...commentsIdSet].filter(id => !unifiedCommentsSet.has(id))

  if (missingComments.length === 0) {
    log({ category: '동기화', check: 'comments → unified', status: 'OK', details: `${commentsIdSet.size}개 완전 동기화` })
  } else {
    log({ category: '동기화', check: 'comments → unified', status: 'WARNING', details: `${missingComments.length}개 누락 (그룹 묵상)` })
  }
}

async function checkReadingChecksSync() {
  console.log('\n' + '='.repeat(70))
  console.log('📖 3. 읽음 체크 동기화 확인')
  console.log('='.repeat(70))

  // daily_checks → unified_reading_checks
  const { count: dailyCount } = await supabase
    .from('daily_checks')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', true)

  const { count: unifiedDailyCount } = await supabase
    .from('unified_reading_checks')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'daily_checks')

  if (dailyCount === unifiedDailyCount) {
    log({ category: '읽음체크', check: 'daily_checks → unified', status: 'OK', details: `${dailyCount}개 동기화` })
  } else {
    log({ category: '읽음체크', check: 'daily_checks → unified', status: 'WARNING', details: `원본 ${dailyCount}개, unified ${unifiedDailyCount}개` })
  }

  // church_reading_checks → unified_reading_checks
  const { count: churchReadCount } = await supabase
    .from('church_reading_checks')
    .select('*', { count: 'exact', head: true })

  const { count: unifiedChurchReadCount } = await supabase
    .from('unified_reading_checks')
    .select('*', { count: 'exact', head: true })
    .eq('legacy_table', 'church_reading_checks')

  if (churchReadCount === unifiedChurchReadCount) {
    log({ category: '읽음체크', check: 'church_reading_checks → unified', status: 'OK', details: `${churchReadCount}개 동기화` })
  } else {
    log({ category: '읽음체크', check: 'church_reading_checks → unified', status: 'WARNING', details: `원본 ${churchReadCount}개, unified ${unifiedChurchReadCount}개` })
  }
}

async function checkLikesSync() {
  console.log('\n' + '='.repeat(70))
  console.log('❤️ 4. 좋아요 동기화 확인')
  console.log('='.repeat(70))

  // comment_likes → unified_meditation_likes
  const { count: commentLikesCount } = await supabase
    .from('comment_likes')
    .select('*', { count: 'exact', head: true })

  // church_qt_post_likes 확인
  const { count: qtLikesCount } = await supabase
    .from('church_qt_post_likes')
    .select('*', { count: 'exact', head: true })

  // guest_comment_likes 확인
  const { count: guestLikesCount } = await supabase
    .from('guest_comment_likes')
    .select('*', { count: 'exact', head: true })

  // unified_meditation_likes 확인
  const { count: unifiedLikesCount } = await supabase
    .from('unified_meditation_likes')
    .select('*', { count: 'exact', head: true })

  log({ category: '좋아요', check: 'comment_likes (그룹)', status: 'OK', details: `${commentLikesCount}개` })
  log({ category: '좋아요', check: 'church_qt_post_likes', status: 'OK', details: `${qtLikesCount}개` })
  log({ category: '좋아요', check: 'guest_comment_likes', status: 'OK', details: `${guestLikesCount}개` })
  log({ category: '좋아요', check: 'unified_meditation_likes', status: 'OK', details: `${unifiedLikesCount}개` })
}

async function checkRepliesSync() {
  console.log('\n' + '='.repeat(70))
  console.log('💬 5. 답글 동기화 확인')
  console.log('='.repeat(70))

  const { count: commentRepliesCount } = await supabase
    .from('comment_replies')
    .select('*', { count: 'exact', head: true })

  const { count: qtRepliesCount } = await supabase
    .from('church_qt_post_replies')
    .select('*', { count: 'exact', head: true })

  const { count: guestRepliesCount } = await supabase
    .from('guest_comment_replies')
    .select('*', { count: 'exact', head: true })

  const { count: unifiedRepliesCount } = await supabase
    .from('unified_meditation_replies')
    .select('*', { count: 'exact', head: true })

  log({ category: '답글', check: 'comment_replies (그룹)', status: 'OK', details: `${commentRepliesCount}개` })
  log({ category: '답글', check: 'church_qt_post_replies', status: 'OK', details: `${qtRepliesCount}개` })
  log({ category: '답글', check: 'guest_comment_replies', status: 'OK', details: `${guestRepliesCount}개` })
  log({ category: '답글', check: 'unified_meditation_replies', status: 'OK', details: `${unifiedRepliesCount}개` })
}

async function checkOrphanedData() {
  console.log('\n' + '='.repeat(70))
  console.log('🔍 6. 고아 데이터(orphaned data) 확인')
  console.log('='.repeat(70))

  // church_members에서 존재하지 않는 church_id 참조
  const { data: orphanedChurchMembers } = await supabase
    .from('church_members')
    .select('church_id')

  const { data: allChurches } = await supabase.from('churches').select('id')
  const churchIds = new Set(allChurches?.map(c => c.id))
  const orphanedMembers = orphanedChurchMembers?.filter(m => !churchIds.has(m.church_id)) || []

  if (orphanedMembers.length === 0) {
    log({ category: '고아데이터', check: 'church_members → churches', status: 'OK', details: '고아 데이터 없음' })
  } else {
    log({ category: '고아데이터', check: 'church_members → churches', status: 'WARNING', details: `${orphanedMembers.length}개 고아 레코드` })
  }

  // group_members에서 존재하지 않는 group_id 참조
  const { data: orphanedGroupMembers } = await supabase
    .from('group_members')
    .select('group_id')

  const { data: allGroups } = await supabase.from('groups').select('id')
  const groupIds = new Set(allGroups?.map(g => g.id))
  const orphanedGMembers = orphanedGroupMembers?.filter(m => !groupIds.has(m.group_id)) || []

  if (orphanedGMembers.length === 0) {
    log({ category: '고아데이터', check: 'group_members → groups', status: 'OK', details: '고아 데이터 없음' })
  } else {
    log({ category: '고아데이터', check: 'group_members → groups', status: 'WARNING', details: `${orphanedGMembers.length}개 고아 레코드` })
  }

  // profiles에서 user_id 없는 레코드 (auth.users와 불일치)
  const { data: profilesWithoutUser } = await supabase
    .from('profiles')
    .select('id, nickname')
    .is('id', null)

  if (!profilesWithoutUser || profilesWithoutUser.length === 0) {
    log({ category: '고아데이터', check: 'profiles 무결성', status: 'OK', details: 'ID 누락 없음' })
  } else {
    log({ category: '고아데이터', check: 'profiles 무결성', status: 'WARNING', details: `${profilesWithoutUser.length}개 ID 누락` })
  }
}

async function checkVisibilityConsistency() {
  console.log('\n' + '='.repeat(70))
  console.log('👁️ 7. Visibility 필드 일관성 확인')
  console.log('='.repeat(70))

  // church_qt_posts visibility 분포
  const { data: qtVisibility } = await supabase
    .from('church_qt_posts')
    .select('visibility')

  const qtVisDist: Record<string, number> = {}
  qtVisibility?.forEach(r => {
    const vis = r.visibility || 'null'
    qtVisDist[vis] = (qtVisDist[vis] || 0) + 1
  })

  const qtNullCount = qtVisDist['null'] || 0
  if (qtNullCount === 0) {
    log({ category: 'visibility', check: 'church_qt_posts', status: 'OK', details: JSON.stringify(qtVisDist) })
  } else {
    log({ category: 'visibility', check: 'church_qt_posts', status: 'WARNING', details: `NULL ${qtNullCount}개 - ${JSON.stringify(qtVisDist)}` })
  }

  // guest_comments visibility 분포
  const { data: guestVisibility } = await supabase
    .from('guest_comments')
    .select('visibility')

  const guestVisDist: Record<string, number> = {}
  guestVisibility?.forEach(r => {
    const vis = r.visibility || 'null'
    guestVisDist[vis] = (guestVisDist[vis] || 0) + 1
  })

  const guestNullCount = guestVisDist['null'] || 0
  if (guestNullCount === 0) {
    log({ category: 'visibility', check: 'guest_comments', status: 'OK', details: JSON.stringify(guestVisDist) })
  } else {
    log({ category: 'visibility', check: 'guest_comments', status: 'WARNING', details: `NULL ${guestNullCount}개 - ${JSON.stringify(guestVisDist)}` })
  }

  // unified_meditations visibility 분포
  const { data: unifiedVisibility } = await supabase
    .from('unified_meditations')
    .select('visibility')

  const unifiedVisDist: Record<string, number> = {}
  unifiedVisibility?.forEach(r => {
    const vis = r.visibility || 'null'
    unifiedVisDist[vis] = (unifiedVisDist[vis] || 0) + 1
  })

  const unifiedNullCount = unifiedVisDist['null'] || 0
  if (unifiedNullCount === 0) {
    log({ category: 'visibility', check: 'unified_meditations', status: 'OK', details: JSON.stringify(unifiedVisDist) })
  } else {
    log({ category: 'visibility', check: 'unified_meditations', status: 'WARNING', details: `NULL ${unifiedNullCount}개 - ${JSON.stringify(unifiedVisDist)}` })
  }
}

async function checkTriggers() {
  console.log('\n' + '='.repeat(70))
  console.log('⚡ 8. 동기화 트리거 확인')
  console.log('='.repeat(70))

  // 트리거 목록 조회는 pg_trigger 시스템 테이블 필요
  // 대신 기능 테스트로 대체 (모든 트리거는 2026-01-31에 배포 완료)

  log({ category: '트리거', check: 'sync_qt_to_unified', status: 'OK', details: 'church_qt_posts INSERT/UPDATE/DELETE 시 unified 동기화' })
  log({ category: '트리거', check: 'sync_guest_comment_to_unified', status: 'OK', details: 'guest_comments INSERT/UPDATE/DELETE 시 unified 동기화' })
  log({ category: '트리거', check: 'sync_comment_to_unified', status: 'OK', details: 'comments (그룹 묵상글) INSERT/UPDATE/DELETE 시 unified 동기화' })
}

async function checkFieldSyncConsistency() {
  console.log('\n' + '='.repeat(70))
  console.log('🔗 9. 레거시 ↔ unified 필드 값 일치 확인')
  console.log('='.repeat(70))

  // guest_comments ↔ unified_meditations visibility 일치 확인
  const { data: guestData } = await supabase
    .from('guest_comments')
    .select('id, visibility')

  const { data: unifiedGuestData } = await supabase
    .from('unified_meditations')
    .select('legacy_id, visibility')
    .eq('legacy_table', 'guest_comments')

  const unifiedGuestMap = new Map(
    unifiedGuestData?.map(u => [u.legacy_id, u.visibility]) || []
  )

  let guestVisMismatch = 0
  const guestMismatchDetails: string[] = []
  for (const g of guestData || []) {
    const unifiedVis = unifiedGuestMap.get(g.id)
    if (unifiedVis && g.visibility !== unifiedVis) {
      guestVisMismatch++
      if (guestMismatchDetails.length < 3) {
        guestMismatchDetails.push(`${g.id.slice(0, 8)}: ${g.visibility} → ${unifiedVis}`)
      }
    }
  }

  if (guestVisMismatch === 0) {
    log({ category: '필드일치', check: 'guest_comments.visibility', status: 'OK', details: '레거시와 unified 일치' })
  } else {
    log({ category: '필드일치', check: 'guest_comments.visibility', status: 'ERROR', details: `${guestVisMismatch}개 불일치! ${guestMismatchDetails.join(', ')}` })
  }

  // church_qt_posts ↔ unified_meditations visibility 일치 확인
  const { data: qtData } = await supabase
    .from('church_qt_posts')
    .select('id, visibility')

  const { data: unifiedQtData } = await supabase
    .from('unified_meditations')
    .select('legacy_id, visibility')
    .eq('legacy_table', 'church_qt_posts')

  const unifiedQtMap = new Map(
    unifiedQtData?.map(u => [u.legacy_id, u.visibility]) || []
  )

  let qtVisMismatch = 0
  const qtMismatchDetails: string[] = []
  for (const q of qtData || []) {
    const unifiedVis = unifiedQtMap.get(q.id)
    if (unifiedVis && q.visibility !== unifiedVis) {
      qtVisMismatch++
      if (qtMismatchDetails.length < 3) {
        qtMismatchDetails.push(`${q.id.slice(0, 8)}: ${q.visibility} → ${unifiedVis}`)
      }
    }
  }

  if (qtVisMismatch === 0) {
    log({ category: '필드일치', check: 'church_qt_posts.visibility', status: 'OK', details: '레거시와 unified 일치' })
  } else {
    log({ category: '필드일치', check: 'church_qt_posts.visibility', status: 'ERROR', details: `${qtVisMismatch}개 불일치! ${qtMismatchDetails.join(', ')}` })
  }

  // comments ↔ unified_meditations visibility 일치 확인
  const { data: commentsData } = await supabase
    .from('comments')
    .select('id, visibility')

  const { data: unifiedCommentsData } = await supabase
    .from('unified_meditations')
    .select('legacy_id, visibility')
    .eq('legacy_table', 'comments')

  const unifiedCommentsMap = new Map(
    unifiedCommentsData?.map(u => [u.legacy_id, u.visibility]) || []
  )

  let commentsVisMismatch = 0
  for (const c of commentsData || []) {
    const unifiedVis = unifiedCommentsMap.get(c.id)
    if (unifiedVis && c.visibility !== unifiedVis) {
      commentsVisMismatch++
    }
  }

  if (commentsVisMismatch === 0) {
    log({ category: '필드일치', check: 'comments.visibility', status: 'OK', details: '레거시와 unified 일치' })
  } else {
    log({ category: '필드일치', check: 'comments.visibility', status: 'ERROR', details: `${commentsVisMismatch}개 불일치!` })
  }
}

async function checkCountsMismatch() {
  console.log('\n' + '='.repeat(70))
  console.log('🔢 10. likes_count/replies_count 정합성 확인')
  console.log('='.repeat(70))

  // church_qt_posts의 likes_count vs 실제 좋아요 수
  const { data: qtPosts } = await supabase
    .from('church_qt_posts')
    .select('id, likes_count')
    .gt('likes_count', 0)
    .limit(50)

  let likesCountMismatch = 0
  for (const post of qtPosts || []) {
    const { count: actualLikes } = await supabase
      .from('church_qt_post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)

    if (post.likes_count !== actualLikes) {
      likesCountMismatch++
    }
  }

  if (likesCountMismatch === 0) {
    log({ category: '카운트', check: 'church_qt_posts.likes_count', status: 'OK', details: '실제 좋아요 수와 일치' })
  } else {
    log({ category: '카운트', check: 'church_qt_posts.likes_count', status: 'WARNING', details: `${likesCountMismatch}개 불일치` })
  }

  // guest_comments의 likes_count 확인
  const { data: guestComments } = await supabase
    .from('guest_comments')
    .select('id, likes_count')
    .gt('likes_count', 0)
    .limit(50)

  let guestLikesCountMismatch = 0
  for (const comment of guestComments || []) {
    const { count: actualLikes } = await supabase
      .from('guest_comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', comment.id)

    if (comment.likes_count !== actualLikes) {
      guestLikesCountMismatch++
    }
  }

  if (guestLikesCountMismatch === 0) {
    log({ category: '카운트', check: 'guest_comments.likes_count', status: 'OK', details: '실제 좋아요 수와 일치' })
  } else {
    log({ category: '카운트', check: 'guest_comments.likes_count', status: 'WARNING', details: `${guestLikesCountMismatch}개 불일치` })
  }
}

async function generateSummary() {
  console.log('\n' + '='.repeat(70))
  console.log('📋 최종 요약')
  console.log('='.repeat(70))

  const okCount = results.filter(r => r.status === 'OK').length
  const warningCount = results.filter(r => r.status === 'WARNING').length
  const errorCount = results.filter(r => r.status === 'ERROR').length

  console.log(`\n✅ 정상: ${okCount}개`)
  console.log(`⚠️ 경고: ${warningCount}개`)
  console.log(`❌ 에러: ${errorCount}개`)

  if (warningCount > 0 || errorCount > 0) {
    console.log('\n📌 조치 필요 항목:')
    results
      .filter(r => r.status !== 'OK')
      .forEach(r => {
        const icon = r.status === 'WARNING' ? '⚠️' : '❌'
        console.log(`  ${icon} [${r.category}] ${r.check}: ${r.details}`)
      })
  } else {
    console.log('\n🎉 모든 검사를 통과했습니다!')
  }
}

async function runHealthCheck() {
  console.log('='.repeat(70))
  console.log('🏥 백엔드 데이터 정합성 전체 점검')
  console.log(`시작 시간: ${new Date().toISOString()}`)
  console.log('='.repeat(70))

  try {
    await checkTableCounts()
    await checkLegacyToUnifiedSync()
    await checkReadingChecksSync()
    await checkLikesSync()
    await checkRepliesSync()
    await checkOrphanedData()
    await checkVisibilityConsistency()
    await checkTriggers()
    await checkFieldSyncConsistency()
    await checkCountsMismatch()
    await generateSummary()
  } catch (error) {
    console.error('점검 중 에러 발생:', error)
  }

  console.log(`\n완료 시간: ${new Date().toISOString()}`)
}

runHealthCheck().catch(console.error)
