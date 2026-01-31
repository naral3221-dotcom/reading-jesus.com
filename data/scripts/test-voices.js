/**
 * Gemini TTS 음성 테스트 스크립트
 *
 * 여러 음성으로 샘플 오디오를 생성하여 최적의 음성을 선택합니다.
 *
 * 사용법:
 *   node test-voices.js
 *
 * 출력:
 *   data/output/voice-samples/ 디렉토리에 각 음성별 WAV 파일 생성
 */

const fs = require('fs');
const path = require('path');

// API 설정
const GEMINI_API_KEY = 'AIzaSyBgKNtRxiCE6IhPVB2REfEEQp2ByNY334Y';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;

// 테스트할 음성 목록 (부드럽고 차분한 여성 목소리 후보)
const VOICE_CANDIDATES = [
  { name: 'Aoede', description: 'Breezy, 산뜻함' },
  { name: 'Leda', description: 'Youthful, 젊고 밝음' },
  { name: 'Achernar', description: 'Soft, 부드러움' },
  { name: 'Enceladus', description: 'Breathy, 숨결 있음' },
  { name: 'Kore', description: 'Firm, 단정함' },
  { name: 'Sulafat', description: 'Warm, 따뜻함' },
];

// 테스트용 샘플 텍스트 (실제 QT 묵상 내용 일부)
const SAMPLE_TEXT = `하나님께서는 창조를 마치신 뒤, 일곱째 날에 안식하셨습니다.

이는 피곤해서 쉬신 것이 아닙니다. 그분의 창조가 완전함을 선포하시며, 우리의 시간 안에, 멈춤의 리듬을 심으신 은혜입니다.

예수님과의 연결점입니다.

예수님은 우리의 참 안식이시며, 그분 안에서 하나님께 나아갑니다.`;

/**
 * WAV 파일 저장 함수
 */
function saveWavFile(filename, pcmData) {
  const outputDir = path.join(__dirname, '..', 'output', 'voice-samples');

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
  header.writeUInt32LE(16, 16);  // chunk size
  header.writeUInt16LE(1, 20);   // audio format (PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);  // byte rate
  header.writeUInt16LE(channels * bitsPerSample / 8, 32);  // block align
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
 * Gemini TTS API 호출
 */
async function generateTTS(text, voiceName) {
  const requestBody = {
    contents: [{
      parts: [{
        text: `차분하고 따뜻한 톤으로 읽어주세요:\n\n${text}`
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

  // 응답에서 오디오 데이터 추출
  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audioData) {
    throw new Error('No audio data in response');
  }

  return Buffer.from(audioData, 'base64');
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Gemini TTS 음성 테스트');
  console.log('='.repeat(60));
  console.log();
  console.log('테스트할 음성 목록:');
  VOICE_CANDIDATES.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name} - ${v.description}`);
  });
  console.log();
  console.log('샘플 텍스트:');
  console.log('-'.repeat(40));
  console.log(SAMPLE_TEXT);
  console.log('-'.repeat(40));
  console.log();

  const results = [];

  for (const voice of VOICE_CANDIDATES) {
    console.log(`[${voice.name}] 생성 중...`);

    try {
      const pcmData = await generateTTS(SAMPLE_TEXT, voice.name);
      const filename = `sample-${voice.name.toLowerCase()}.wav`;
      const filepath = saveWavFile(filename, pcmData);

      console.log(`  ✓ 저장됨: ${filepath}`);
      results.push({
        voice: voice.name,
        description: voice.description,
        filename: filename,
        success: true
      });
    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}`);
      results.push({
        voice: voice.name,
        description: voice.description,
        success: false,
        error: error.message
      });
    }

    // API rate limit 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log();
  console.log('='.repeat(60));
  console.log('테스트 완료');
  console.log('='.repeat(60));
  console.log();
  console.log('결과 요약:');
  results.forEach(r => {
    const status = r.success ? '✓' : '✗';
    console.log(`  ${status} ${r.voice} (${r.description})`);
  });
  console.log();
  console.log('생성된 파일 위치: data/output/voice-samples/');
  console.log();
  console.log('각 파일을 재생하여 가장 적합한 음성을 선택하세요.');

  // 결과 JSON 저장
  const resultPath = path.join(__dirname, '..', 'output', 'voice-samples', 'test-results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`결과 저장됨: ${resultPath}`);
}

// 실행
main().catch(console.error);
