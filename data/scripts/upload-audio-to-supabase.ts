/**
 * 묵상 오디오 파일을 Supabase Storage에 업로드하는 스크립트
 *
 * 사용법:
 *   npx tsx data/scripts/upload-audio-to-supabase.ts
 *
 * 필요 환경변수:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 파일 수동 로드
function loadEnvFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
  } catch (err) {
    // 파일이 없으면 무시
  }
}

loadEnvFile(path.join(__dirname, '../../.env.local'));

// 환경변수 로드
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수를 설정해주세요:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Supabase 클라이언트 (service role)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// 오디오 파일 경로
const AUDIO_DIR = path.join(__dirname, '..', 'output');
const BUCKET_NAME = 'meditations';

interface UploadResult {
  filename: string;
  success: boolean;
  url?: string;
  error?: string;
}

async function uploadAudioFiles(): Promise<void> {
  console.log('🎵 묵상 오디오 파일 업로드 시작...\n');
  console.log(`📁 소스 폴더: ${AUDIO_DIR}`);
  console.log(`🪣 버킷: ${BUCKET_NAME}\n`);

  // wav 파일 목록 가져오기
  const files = fs.readdirSync(AUDIO_DIR)
    .filter(f => f.endsWith('-meditation.wav'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️ 업로드할 오디오 파일이 없습니다.');
    return;
  }

  console.log(`📊 총 ${files.length}개 파일 발견\n`);

  const results: UploadResult[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const filename of files) {
    const filePath = path.join(AUDIO_DIR, filename);
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);

    process.stdout.write(`  ⬆️  ${filename} (${fileSize}MB)... `);

    try {
      // 기존 파일 삭제 시도 (덮어쓰기 위해)
      await supabase.storage.from(BUCKET_NAME).remove([filename]);

      // 업로드
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, fileBuffer, {
          contentType: 'audio/wav',
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Public URL 생성
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename);

      results.push({
        filename,
        success: true,
        url: urlData.publicUrl
      });

      console.log('✅');
      successCount++;
    } catch (err: any) {
      results.push({
        filename,
        success: false,
        error: err.message
      });
      console.log(`❌ ${err.message}`);
      failCount++;
    }
  }

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 업로드 결과 요약');
  console.log('='.repeat(50));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📁 총계: ${files.length}개\n`);

  // 실패한 파일 목록
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('❌ 실패한 파일:');
    failed.forEach(f => {
      console.log(`   - ${f.filename}: ${f.error}`);
    });
  }

  // URL 샘플 출력
  const sample = results.find(r => r.success);
  if (sample) {
    console.log('\n🔗 URL 예시:');
    console.log(`   ${sample.url}`);
  }

  // 결과 저장
  const resultPath = path.join(AUDIO_DIR, 'upload-results.json');
  fs.writeFileSync(resultPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    bucket: BUCKET_NAME,
    total: files.length,
    success: successCount,
    failed: failCount,
    results
  }, null, 2));
  console.log(`\n💾 결과 저장: ${resultPath}`);
}

// 실행
uploadAudioFiles().catch(console.error);
