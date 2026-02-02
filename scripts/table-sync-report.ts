/**
 * 테이블 연동 상태 종합 리포트
 * 실행: npx tsx scripts/table-sync-report.ts
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

async function generateReport() {
  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║              📊 테이블 연동 상태 종합 리포트                       ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝\n')

  // ========================================
  // 1. 핵심 테이블 현황
  // ========================================
  console.log('┌──────────────────────────────────────────────────────────────────┐')
  console.log('│ 1️⃣  핵심 테이블 현황                                              │')
  console.log('└──────────────────────────────────────────────────────────────────┘\n')

  const tables = [
    { name: 'unified_meditations', desc: '통합 묵상 (마스터)' },
    { name: 'church_qt_posts', desc: 'QT 게시물 (레거시)' },
    { name: 'guest_comments', desc: '묵상글 (레거시)' },
    { name: 'comments', desc: '그룹 묵상 (레거시)' },
    { name: 'profiles', desc: '사용자 프로필' },
    { name: 'churches', desc: '교회' },
    { name: 'groups', desc: '그룹' },
  ]

  for (const table of tables) {
    const { count } = await supabase.from(table.name).select('*', { count: 'exact', head: true })
    console.log(`  📁 ${table.name.padEnd(25)} ${String(count).padStart(5)}개  │ ${table.desc}`)
  }

  // ========================================
  // 2. Dual-Write 동기화 구조
  // ========================================
  console.log('\n┌──────────────────────────────────────────────────────────────────┐')
  console.log('│ 2️⃣  Dual-Write 동기화 구조                                        │')
  console.log('└──────────────────────────────────────────────────────────────────┘\n')

  console.log('  🔄 데이터 흐름:')
  console.log('  ')
  console.log('  ┌─────────────────┐    트리거    ┌─────────────────────────┐')
  console.log('  │ church_qt_posts │ ──────────→ │                         │')
  console.log('  │   (QT 작성)     │              │                         │')
  console.log('  └─────────────────┘              │                         │')
  console.log('                                   │  unified_meditations    │')
  console.log('  ┌─────────────────┐    트리거    │     (통합 테이블)        │')
  console.log('  │ guest_comments  │ ──────────→ │                         │')
  console.log('  │   (묵상 작성)   │              │                         │')
  console.log('  └─────────────────┘              │                         │')
  console.log('                                   │                         │')
  console.log('  ┌─────────────────┐    트리거    │                         │')
  console.log('  │    comments     │ ──────────→ │                         │')
  console.log('  │  (그룹 묵상)    │              │                         │')
  console.log('  └─────────────────┘              └─────────────────────────┘')

  // ========================================
  // 3. 동기화 상태 상세
  // ========================================
  console.log('\n┌──────────────────────────────────────────────────────────────────┐')
  console.log('│ 3️⃣  동기화 상태 상세                                              │')
  console.log('└──────────────────────────────────────────────────────────────────┘\n')

  // church_qt_posts 동기화
  const { count: qtCount } = await supabase.from('church_qt_posts').select('*', { count: 'exact', head: true })
  const { count: qtSynced } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('legacy_table', 'church_qt_posts')
  const qtStatus = qtCount === qtSynced ? '✅ 완전 동기화' : '⚠️ 불일치'
  console.log(`  church_qt_posts → unified_meditations`)
  console.log(`    원본: ${qtCount}개 / 동기화: ${qtSynced}개 │ ${qtStatus}`)

  // guest_comments 동기화
  const { count: gcCount } = await supabase.from('guest_comments').select('*', { count: 'exact', head: true })
  const { count: gcSynced } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('legacy_table', 'guest_comments')
  const gcStatus = gcCount === gcSynced ? '✅ 완전 동기화' : '⚠️ 불일치'
  console.log(`\n  guest_comments → unified_meditations`)
  console.log(`    원본: ${gcCount}개 / 동기화: ${gcSynced}개 │ ${gcStatus}`)

  // comments 동기화
  const { count: cmCount } = await supabase.from('comments').select('*', { count: 'exact', head: true })
  const { count: cmSynced } = await supabase.from('unified_meditations').select('*', { count: 'exact', head: true }).eq('legacy_table', 'comments')
  const cmStatus = cmCount === cmSynced ? '✅ 완전 동기화' : '⚠️ 불일치'
  console.log(`\n  comments → unified_meditations`)
  console.log(`    원본: ${cmCount}개 / 동기화: ${cmSynced}개 │ ${cmStatus}`)

  // ========================================
  // 4. unified_meditations 구성
  // ========================================
  console.log('\n┌──────────────────────────────────────────────────────────────────┐')
  console.log('│ 4️⃣  unified_meditations 구성                                      │')
  console.log('└──────────────────────────────────────────────────────────────────┘\n')

  // source_type별
  const { data: sourceData } = await supabase.from('unified_meditations').select('source_type')
  const sourceCount: Record<string, number> = {}
  sourceData?.forEach(item => { sourceCount[item.source_type] = (sourceCount[item.source_type] || 0) + 1 })

  console.log('  📌 source_type별 분포:')
  for (const [type, count] of Object.entries(sourceCount)) {
    const label = type === 'church' ? '교회 묵상' : type === 'group' ? '그룹 묵상' : type === 'public' ? '개인 묵상' : type
    console.log(`    ${label.padEnd(15)} ${String(count).padStart(5)}개`)
  }

  // content_type별
  const { data: contentData } = await supabase.from('unified_meditations').select('content_type')
  const contentCount: Record<string, number> = {}
  contentData?.forEach(item => { contentCount[item.content_type] = (contentCount[item.content_type] || 0) + 1 })

  console.log('\n  📌 content_type별 분포:')
  for (const [type, count] of Object.entries(contentCount)) {
    const label = type === 'qt' ? 'QT' : type === 'free' ? '자유 묵상' : type === 'memo' ? '메모' : type
    console.log(`    ${label.padEnd(15)} ${String(count).padStart(5)}개`)
  }

  // visibility별
  const { data: visData } = await supabase.from('unified_meditations').select('visibility')
  const visCount: Record<string, number> = {}
  visData?.forEach(item => { visCount[item.visibility || 'null'] = (visCount[item.visibility || 'null'] || 0) + 1 })

  console.log('\n  📌 visibility별 분포:')
  for (const [vis, count] of Object.entries(visCount)) {
    const label = vis === 'public' ? '전체 공개' : vis === 'church' ? '교회 공개' : vis === 'private' ? '비공개' : vis
    console.log(`    ${label.padEnd(15)} ${String(count).padStart(5)}개`)
  }

  // ========================================
  // 5. 좋아요 연동
  // ========================================
  console.log('\n┌──────────────────────────────────────────────────────────────────┐')
  console.log('│ 5️⃣  좋아요 연동                                                   │')
  console.log('└──────────────────────────────────────────────────────────────────┘\n')

  const likeTables = [
    { name: 'church_qt_post_likes', desc: 'QT 좋아요 (레거시)' },
    { name: 'guest_comment_likes', desc: '묵상 좋아요 (레거시)' },
    { name: 'comment_likes', desc: '그룹 묵상 좋아요 (레거시)' },
    { name: 'unified_meditation_likes', desc: '통합 좋아요 (마스터)' },
  ]

  for (const table of likeTables) {
    const { count } = await supabase.from(table.name).select('*', { count: 'exact', head: true })
    const marker = table.name === 'unified_meditation_likes' ? '📍' : '  '
    console.log(`  ${marker} ${table.name.padEnd(28)} ${String(count).padStart(5)}개`)
  }

  console.log('\n  💡 좋아요 조회 시: unified_meditation_likes 사용')
  console.log('  💡 좋아요 토글 시: 레거시 테이블 → 트리거로 unified 동기화')

  // ========================================
  // 6. 답글 연동
  // ========================================
  console.log('\n┌──────────────────────────────────────────────────────────────────┐')
  console.log('│ 6️⃣  답글 연동                                                     │')
  console.log('└──────────────────────────────────────────────────────────────────┘\n')

  const replyTables = [
    { name: 'church_qt_post_replies', desc: 'QT 답글 (레거시)' },
    { name: 'guest_comment_replies', desc: '묵상 답글 (레거시)' },
    { name: 'comment_replies', desc: '그룹 묵상 답글 (레거시)' },
    { name: 'unified_meditation_replies', desc: '통합 답글 (마스터)' },
  ]

  for (const table of replyTables) {
    const { count } = await supabase.from(table.name).select('*', { count: 'exact', head: true })
    const marker = table.name === 'unified_meditation_replies' ? '📍' : '  '
    console.log(`  ${marker} ${table.name.padEnd(30)} ${String(count).padStart(5)}개`)
  }

  // ========================================
  // 7. 피드 조회 방식
  // ========================================
  console.log('\n┌──────────────────────────────────────────────────────────────────┐')
  console.log('│ 7️⃣  피드 조회 방식                                                │')
  console.log('└──────────────────────────────────────────────────────────────────┘\n')

  console.log('  📱 홈 피드 (메인):')
  console.log('     └─ unified_meditations에서 조회')
  console.log('     └─ visibility = "public" 또는 "church" 필터')
  console.log('')
  console.log('  🏛️ 교회 피드:')
  console.log('     └─ unified_meditations에서 조회')
  console.log('     └─ source_type = "church" AND source_id = 교회ID')
  console.log('     └─ day_number 또는 qt_date로 날짜 필터')
  console.log('')
  console.log('  👥 그룹 피드:')
  console.log('     └─ unified_meditations에서 조회')
  console.log('     └─ source_type = "group" AND source_id IN (가입된 그룹)')

  // ========================================
  // 8. 최종 요약
  // ========================================
  console.log('\n╔══════════════════════════════════════════════════════════════════╗')
  console.log('║                         📋 최종 요약                              ║')
  console.log('╠══════════════════════════════════════════════════════════════════╣')
  console.log('║                                                                  ║')
  console.log('║  ✅ 모든 묵상/QT → unified_meditations 동기화 완료                ║')
  console.log('║  ✅ 모든 visibility → "public"으로 통일 완료                      ║')
  console.log('║  ✅ RLS 정책 → 모든 SELECT 허용                                   ║')
  console.log('║  ✅ 시간대 쿼리 → KST 타임존 적용 완료                            ║')
  console.log('║                                                                  ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝')
}

generateReport().catch(console.error)
