/**
 * 기존 QT 데이터에 bible_range 백필 스크립트
 *
 * 실행: npx tsx scripts/backfill-bible-range.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase 클라이언트 설정 (환경변수에서 읽기)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경변수 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QTData {
  date: string;
  bibleRange: string;
}

async function main() {
  console.log('🚀 QT bible_range 백필 시작...\n');

  // 1. QT JSON 데이터 로드
  const dataDir = path.join(__dirname, '..', 'data');
  const qtFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('qt-') && f.endsWith('.json'));

  const dateToRange: Map<string, string> = new Map();

  for (const file of qtFiles) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const qtList: QTData[] = JSON.parse(content);

    for (const qt of qtList) {
      if (qt.date && qt.bibleRange) {
        dateToRange.set(qt.date, qt.bibleRange);
      }
    }
    console.log(`📖 ${file} 로드 완료: ${qtList.length}개 QT`);
  }

  console.log(`\n총 ${dateToRange.size}개의 날짜-통독범위 매핑 생성\n`);

  // 2. church_qt_posts에서 bible_range가 null인 데이터 조회
  const { data: qtPosts, error: qtError } = await supabase
    .from('church_qt_posts')
    .select('id, qt_date, bible_range')
    .is('bible_range', null);

  if (qtError) {
    console.error('church_qt_posts 조회 오류:', qtError);
    return;
  }

  console.log(`📝 bible_range가 없는 church_qt_posts: ${qtPosts?.length || 0}개\n`);

  // 3. church_qt_posts 업데이트
  let updatedQtPosts = 0;
  for (const post of qtPosts || []) {
    const qtDate = post.qt_date;
    const bibleRange = dateToRange.get(qtDate);

    if (bibleRange) {
      const { error } = await supabase
        .from('church_qt_posts')
        .update({ bible_range: bibleRange })
        .eq('id', post.id);

      if (error) {
        console.error(`  ❌ ${post.id} 업데이트 실패:`, error.message);
      } else {
        updatedQtPosts++;
        console.log(`  ✅ ${qtDate} → ${bibleRange}`);
      }
    } else {
      console.log(`  ⚠️ ${qtDate}에 해당하는 QT 데이터 없음`);
    }
  }

  console.log(`\n✅ church_qt_posts ${updatedQtPosts}개 업데이트 완료\n`);

  // 4. unified_meditations에서 qt_date가 있고 bible_range가 null인 데이터 조회
  const { data: unifiedPosts, error: unifiedError } = await supabase
    .from('unified_meditations')
    .select('id, qt_date, bible_range')
    .not('qt_date', 'is', null)
    .is('bible_range', null);

  if (unifiedError) {
    console.error('unified_meditations 조회 오류:', unifiedError);
    return;
  }

  console.log(`📝 bible_range가 없는 unified_meditations (QT): ${unifiedPosts?.length || 0}개\n`);

  // 5. unified_meditations 업데이트
  let updatedUnified = 0;
  for (const post of unifiedPosts || []) {
    // qt_date가 Date 객체일 수 있으므로 문자열로 변환
    const qtDate = typeof post.qt_date === 'string'
      ? post.qt_date.split('T')[0]  // ISO 형식이면 날짜 부분만
      : new Date(post.qt_date).toISOString().split('T')[0];

    const bibleRange = dateToRange.get(qtDate);

    if (bibleRange) {
      const { error } = await supabase
        .from('unified_meditations')
        .update({ bible_range: bibleRange })
        .eq('id', post.id);

      if (error) {
        console.error(`  ❌ ${post.id} 업데이트 실패:`, error.message);
      } else {
        updatedUnified++;
        console.log(`  ✅ ${qtDate} → ${bibleRange}`);
      }
    } else {
      console.log(`  ⚠️ ${qtDate}에 해당하는 QT 데이터 없음`);
    }
  }

  console.log(`\n✅ unified_meditations ${updatedUnified}개 업데이트 완료`);
  console.log(`\n🎉 백필 완료!`);
  console.log(`   - church_qt_posts: ${updatedQtPosts}개`);
  console.log(`   - unified_meditations: ${updatedUnified}개`);
}

main().catch(console.error);
