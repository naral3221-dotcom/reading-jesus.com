/**
 * Phase 4 성능 검증 스크립트
 * unified_meditations 단일 쿼리 성능 테스트
 * 실행: npx tsx scripts/verify-phase4-performance.ts
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

interface BenchmarkResult {
  name: string
  avgMs: number
  minMs: number
  maxMs: number
  runs: number
}

async function benchmark(name: string, fn: () => Promise<void>, runs = 5): Promise<BenchmarkResult> {
  const times: number[] = []

  // 워밍업
  await fn()

  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    await fn()
    const end = performance.now()
    times.push(end - start)
  }

  return {
    name,
    avgMs: times.reduce((a, b) => a + b, 0) / times.length,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    runs,
  }
}

async function verify() {
  console.log('='.repeat(60))
  console.log('=== 3차 검증: 성능 테스트 ===')
  console.log('='.repeat(60))

  const results: BenchmarkResult[] = []

  // 1. 전체 피드 조회 (20개)
  console.log('\n1. 전체 피드 조회 (20개 limit):')
  const allFeedResult = await benchmark('전체 피드', async () => {
    await supabase
      .from('unified_meditations')
      .select('*')
      .in('visibility', ['public', 'church'])
      .order('created_at', { ascending: false })
      .limit(20)
  })
  console.log(`   ✅ 평균: ${allFeedResult.avgMs.toFixed(2)}ms (최소: ${allFeedResult.minMs.toFixed(2)}ms, 최대: ${allFeedResult.maxMs.toFixed(2)}ms)`)
  results.push(allFeedResult)

  // 2. 교회 피드 조회
  console.log('\n2. 교회 피드 조회 (특정 교회):')
  const { data: churches } = await supabase.from('churches').select('id').limit(1)
  const churchId = churches?.[0]?.id

  if (churchId) {
    const churchFeedResult = await benchmark('교회 피드', async () => {
      await supabase
        .from('unified_meditations')
        .select('*')
        .eq('source_type', 'church')
        .eq('source_id', churchId)
        .order('created_at', { ascending: false })
        .limit(20)
    })
    console.log(`   ✅ 평균: ${churchFeedResult.avgMs.toFixed(2)}ms (최소: ${churchFeedResult.minMs.toFixed(2)}ms, 최대: ${churchFeedResult.maxMs.toFixed(2)}ms)`)
    results.push(churchFeedResult)
  }

  // 3. QT 필터 조회
  console.log('\n3. QT 필터 조회:')
  const qtFilterResult = await benchmark('QT 필터', async () => {
    await supabase
      .from('unified_meditations')
      .select('*')
      .eq('content_type', 'qt')
      .order('created_at', { ascending: false })
      .limit(20)
  })
  console.log(`   ✅ 평균: ${qtFilterResult.avgMs.toFixed(2)}ms (최소: ${qtFilterResult.minMs.toFixed(2)}ms, 최대: ${qtFilterResult.maxMs.toFixed(2)}ms)`)
  results.push(qtFilterResult)

  // 4. 묵상 필터 조회
  console.log('\n4. 묵상(free/memo) 필터 조회:')
  const meditationFilterResult = await benchmark('묵상 필터', async () => {
    await supabase
      .from('unified_meditations')
      .select('*')
      .in('content_type', ['free', 'memo'])
      .order('created_at', { ascending: false })
      .limit(20)
  })
  console.log(`   ✅ 평균: ${meditationFilterResult.avgMs.toFixed(2)}ms (최소: ${meditationFilterResult.minMs.toFixed(2)}ms, 최대: ${meditationFilterResult.maxMs.toFixed(2)}ms)`)
  results.push(meditationFilterResult)

  // 5. 페이지네이션 (2페이지)
  console.log('\n5. 페이지네이션 조회 (2페이지):')
  const { data: firstPage } = await supabase
    .from('unified_meditations')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (firstPage && firstPage.length > 0) {
    const cursor = firstPage[firstPage.length - 1].created_at
    const paginationResult = await benchmark('2페이지', async () => {
      await supabase
        .from('unified_meditations')
        .select('*')
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(20)
    })
    console.log(`   ✅ 평균: ${paginationResult.avgMs.toFixed(2)}ms (최소: ${paginationResult.minMs.toFixed(2)}ms, 최대: ${paginationResult.maxMs.toFixed(2)}ms)`)
    results.push(paginationResult)
  }

  // 6. 프로필 조인 시뮬레이션 (별도 쿼리)
  console.log('\n6. 프로필 + 피드 조회 시뮬레이션:')
  const combinedResult = await benchmark('피드+프로필', async () => {
    // 피드 조회
    const { data: feed } = await supabase
      .from('unified_meditations')
      .select('id, user_id')
      .in('visibility', ['public', 'church'])
      .order('created_at', { ascending: false })
      .limit(20)

    // 프로필 조회
    const userIds = [...new Set((feed || []).map(f => f.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds as string[])
    }
  })
  console.log(`   ✅ 평균: ${combinedResult.avgMs.toFixed(2)}ms (최소: ${combinedResult.minMs.toFixed(2)}ms, 최대: ${combinedResult.maxMs.toFixed(2)}ms)`)
  results.push(combinedResult)

  // 결과 요약
  console.log('\n' + '='.repeat(60))
  console.log('=== 성능 테스트 결과 요약 ===')
  console.log('='.repeat(60))

  console.log('\n| 테스트 | 평균(ms) | 최소(ms) | 최대(ms) |')
  console.log('|--------|----------|----------|----------|')
  for (const result of results) {
    console.log(`| ${result.name.padEnd(12)} | ${result.avgMs.toFixed(2).padStart(8)} | ${result.minMs.toFixed(2).padStart(8)} | ${result.maxMs.toFixed(2).padStart(8)} |`)
  }

  const avgAll = results.reduce((a, b) => a + b.avgMs, 0) / results.length
  console.log('\n📊 전체 평균 응답 시간: ' + avgAll.toFixed(2) + 'ms')

  // 성능 기준 평가
  const targetMs = 100 // 목표: 100ms 이하
  const slowQueries = results.filter(r => r.avgMs > targetMs)

  if (slowQueries.length === 0) {
    console.log(`✅ 모든 쿼리가 목표 시간(${targetMs}ms) 이하`)
  } else {
    console.log(`⚠️  ${slowQueries.length}개 쿼리가 목표 시간(${targetMs}ms) 초과:`)
    for (const q of slowQueries) {
      console.log(`   - ${q.name}: ${q.avgMs.toFixed(2)}ms`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('=== 3차 검증 완료 ===')
  console.log('='.repeat(60))
}

verify().catch(console.error)
