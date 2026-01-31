/**
 * Gemini TTS 오디오 생성 스크립트
 *
 * 나레이션 JSON 파일을 읽어 TTS 오디오 파일을 생성합니다.
 *
 * 사용법:
 *   node generate-tts.js [나레이션 JSON 파일] [음성 이름]
 *
 * 예시:
 *   node generate-tts.js narrations.json Aoede
 *
 * 출력:
 *   data/output/ 디렉토리에 날짜별 WAV 파일 생성
 */

const fs = require('fs');
const path = require('path');

// API 설정
const GEMINI_API_KEY = 'AIzaSyBgKNtRxiCE6IhPVB2REfEEQp2ByNY334Y';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;

// 기본 설정
const DEFAULT_VOICE = 'Aoede';  // 테스트 후 선택된 음성으로 변경
const BATCH_SIZE = 5;           // 배치 크기
const DELAY_BETWEEN_CALLS = 1500; // API 호출 간 딜레이 (ms)
const MAX_RETRIES = 3;          // 최대 재시도 횟수

/**
 * WAV 파일 저장 함수
 */
function saveWavFile(filename, pcmData, outputDir) {
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filepath = path.join(outputDir, filename);

  // WAV 헤더 생성
  const sampleRate = 24000;
  const channels = 1;
  const bitsPerSample = 16;
  const dataSize = pcmData.length;
  const fileSize = 44 + dataSize;

  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize - 8, 4);
  header.write('WAVE', 8);

  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  header.writeUInt16LE(channels * bitsPerSample / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  // 파일 저장
  const wavBuffer = Buffer.concat([header, pcmData]);
  fs.writeFileSync(filepath, wavBuffer);

  return filepath;
}

/**
 * Gemini TTS API 호출 (재시도 로직 포함)
 */
async function generateTTS(text, voiceName, retries = 0) {
  const requestBody = {
    contents: [{
      parts: [{
        text: `차분하고 따뜻한 경어체로 읽어주세요:\n\n${text}`
      }]
    }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName
          }
        }
      }
    }
  };

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error('No audio data in response');
    }

    return Buffer.from(audioData, 'base64');
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`  재시도 중... (${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retries + 1)));
      return generateTTS(text, voiceName, retries + 1);
    }
    throw error;
  }
}

/**
 * 배치 처리 함수
 */
async function processBatch(items, voiceName, outputDir, startIndex) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const globalIndex = startIndex + i + 1;

    console.log(`[${globalIndex}] ${item.date} - ${item.title}`);

    try {
      // TTS 생성
      const pcmData = await generateTTS(item.narration, voiceName);

      // 파일 저장
      const filename = `${item.date}-meditation.wav`;
      const filepath = saveWavFile(filename, pcmData, outputDir);

      console.log(`    ✓ 저장: ${filename}`);

      results.push({
        date: item.date,
        title: item.title,
        filename: filename,
        success: true
      });
    } catch (error) {
      console.error(`    ✗ 실패: ${error.message}`);
      results.push({
        date: item.date,
        title: item.title,
        success: false,
        error: error.message
      });
    }

    // API rate limit 방지
    if (i < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CALLS));
    }
  }

  return results;
}

/**
 * 메인 실행 함수
 */
async function main() {
  // 인자 파싱
  const args = process.argv.slice(2);
  const inputFile = args[0] || 'narrations.json';
  const voiceName = args[1] || DEFAULT_VOICE;

  const inputPath = path.resolve(__dirname, inputFile);
  const outputDir = path.join(__dirname, '..', 'output');

  console.log('='.repeat(60));
  console.log('Gemini TTS 오디오 생성');
  console.log('='.repeat(60));
  console.log();
  console.log(`입력 파일: ${inputPath}`);
  console.log(`출력 디렉토리: ${outputDir}`);
  console.log(`음성: ${voiceName}`);
  console.log(`배치 크기: ${BATCH_SIZE}`);
  console.log();

  // 입력 파일 확인
  if (!fs.existsSync(inputPath)) {
    console.error(`오류: 입력 파일을 찾을 수 없습니다: ${inputPath}`);
    console.log();
    console.log('먼저 나레이션 대본을 생성하세요:');
    console.log('  /generate-narration data/qt-january-2026.json');
    process.exit(1);
  }

  // 나레이션 데이터 로드
  const narrations = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`총 ${narrations.length}개 항목 처리 예정`);
  console.log();

  // 배치 처리
  const allResults = [];
  const totalBatches = Math.ceil(narrations.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, narrations.length);
    const batch = narrations.slice(start, end);

    console.log(`----- 배치 ${batchIndex + 1}/${totalBatches} (${start + 1}-${end}) -----`);

    const batchResults = await processBatch(batch, voiceName, outputDir, start);
    allResults.push(...batchResults);

    // 배치 간 딜레이
    if (batchIndex < totalBatches - 1) {
      console.log('다음 배치 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // 결과 요약
  console.log();
  console.log('='.repeat(60));
  console.log('처리 완료');
  console.log('='.repeat(60));

  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.filter(r => !r.success).length;

  console.log();
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개`);
  console.log();
  console.log(`출력 디렉토리: ${outputDir}`);

  // 실패 항목 표시
  if (failCount > 0) {
    console.log();
    console.log('실패한 항목:');
    allResults.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.date}: ${r.error}`);
    });
  }

  // 결과 JSON 저장
  const resultPath = path.join(outputDir, 'generation-results.json');
  fs.writeFileSync(resultPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    voice: voiceName,
    total: narrations.length,
    success: successCount,
    failed: failCount,
    results: allResults
  }, null, 2));
  console.log();
  console.log(`결과 저장: ${resultPath}`);
}

// 실행
main().catch(error => {
  console.error('오류 발생:', error);
  process.exit(1);
});
