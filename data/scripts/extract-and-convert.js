/**
 * QT JSON에서 묵상 콘텐츠 추출 및 나레이션 변환 스크립트
 *
 * JSON 파일에서 meditationGuide와 jesusConnection을 추출하고
 * TTS에 적합한 나레이션 형태로 변환합니다.
 *
 * 사용법:
 *   node extract-and-convert.js [입력 JSON] [출력 JSON]
 *
 * 예시:
 *   node extract-and-convert.js ../qt-january-2026.json narrations-january.json
 *   node extract-and-convert.js ../qt-february-2026.json narrations-february.json
 */

const fs = require('fs');
const path = require('path');

/**
 * 텍스트를 나레이션 형태로 변환
 * - 긴 문장 분리
 * - 자연스러운 호흡점 추가
 * - 성경 구절 참조 제거 (TTS에서 읽지 않음)
 */
function convertToNarration(meditationGuide, jesusConnection) {
  let narration = '';

  // 묵상 가이드 변환
  if (meditationGuide) {
    let guide = meditationGuide;

    // 성경 구절 참조 제거
    guide = removeBibleReference(guide);

    // 문단 나누기 (\n\n으로 구분된 경우)
    const paragraphs = guide.split('\n\n').filter(p => p.trim());

    const convertedParagraphs = paragraphs.map(paragraph => {
      return convertParagraph(paragraph);
    });

    narration = convertedParagraphs.join('\n\n');
  }

  // 예수님 연결점 추가
  if (jesusConnection) {
    narration += '\n\n...\n\n';
    narration += '예수님과의 연결점입니다.\n\n';

    // 성경 구절 참조 제거
    let connection = removeBibleReference(jesusConnection);
    connection = convertParagraph(connection);

    narration += connection;
  }

  return narration.trim();
}

/**
 * 문단 변환
 */
function convertParagraph(text) {
  let result = text;

  // 1. 문장 분리 및 호흡점 추가
  // 30자 이상 문장에서 접속사/조사 앞에서 분리
  result = result.replace(/([가-힣]{30,}?)(그러나|그래서|그리고|하지만|따라서|그런데)/g, '$1\n\n$2');

  // 2. 긴 문장 내 쉼표 추가
  // "~는/은/이/가 ~" 패턴에서 조사 뒤에 쉼표
  result = result.replace(/([가-힣]+[은는이가]) ([가-힣]{15,})/g, '$1, $2');

  // 3. 인용구 앞 쉼표
  result = result.replace(/(하셨습니다|말합니다|선포합니다)([.。]) *(['"'])/g, '$1$2\n\n$3');

  return result;
}

/**
 * 성경 구절 참조 제거
 * (히 4:9-10) → 제거 (TTS에서 읽지 않음)
 */
function removeBibleReference(text) {
  // (책 장:절) 또는 (책 장:절-절) 패턴 제거
  // 예: (히 4:9-10), (요 3:16), (롬 8:28) 등
  let result = text;

  // 괄호 안의 성경 구절 참조 제거
  result = result.replace(/\s*\([가-힣]+\s*\d+:\d+(?:-\d+)?\)/g, '');

  // 괄호 안의 성경 구절 참조 (책명이 두 글자인 경우도 처리)
  result = result.replace(/\s*\([가-힣]{1,3}\d+:\d+(?:-\d+)?\)/g, '');

  return result;
}

/**
 * [DEPRECATED] 성경 구절 참조 형식 변환
 * (히 4:9-10) → 히브리서 4장 9절에서 10절 말씀입니다.
 */
function convertBibleReference(text) {
  const bookNames = {
    '창': '창세기',
    '출': '출애굽기',
    '레': '레위기',
    '민': '민수기',
    '신': '신명기',
    '수': '여호수아',
    '삿': '사사기',
    '룻': '룻기',
    '삼상': '사무엘상',
    '삼하': '사무엘하',
    '왕상': '열왕기상',
    '왕하': '열왕기하',
    '대상': '역대상',
    '대하': '역대하',
    '스': '에스라',
    '느': '느헤미야',
    '에': '에스더',
    '욥': '욥기',
    '시': '시편',
    '잠': '잠언',
    '전': '전도서',
    '아': '아가',
    '사': '이사야',
    '렘': '예레미야',
    '애': '예레미야애가',
    '겔': '에스겔',
    '단': '다니엘',
    '호': '호세아',
    '욜': '요엘',
    '암': '아모스',
    '옵': '오바댜',
    '욘': '요나',
    '미': '미가',
    '나': '나훔',
    '합': '하박국',
    '습': '스바냐',
    '학': '학개',
    '슥': '스가랴',
    '말': '말라기',
    '마': '마태복음',
    '막': '마가복음',
    '눅': '누가복음',
    '요': '요한복음',
    '행': '사도행전',
    '롬': '로마서',
    '고전': '고린도전서',
    '고후': '고린도후서',
    '갈': '갈라디아서',
    '엡': '에베소서',
    '빌': '빌립보서',
    '골': '골로새서',
    '살전': '데살로니가전서',
    '살후': '데살로니가후서',
    '딤전': '디모데전서',
    '딤후': '디모데후서',
    '딛': '디도서',
    '몬': '빌레몬서',
    '히': '히브리서',
    '약': '야고보서',
    '벧전': '베드로전서',
    '벧후': '베드로후서',
    '요일': '요한일서',
    '요이': '요한이서',
    '요삼': '요한삼서',
    '유': '유다서',
    '계': '요한계시록'
  };

  // (책 장:절) 또는 (책 장:절-절) 패턴 찾기
  const pattern = /\(([가-힣]+)\s*(\d+):(\d+)(?:-(\d+))?\)/g;

  return text.replace(pattern, (match, book, chapter, verseStart, verseEnd) => {
    const fullBookName = bookNames[book] || book;

    if (verseEnd) {
      return `${fullBookName} ${chapter}장 ${verseStart}절에서 ${verseEnd}절 말씀입니다.`;
    } else {
      return `${fullBookName} ${chapter}장 ${verseStart}절 말씀입니다.`;
    }
  });
}

/**
 * 메인 실행 함수
 */
function main() {
  // 인자 파싱
  const args = process.argv.slice(2);
  const inputFile = args[0] || '../qt-january-2026.json';
  const outputFile = args[1] || 'narrations.json';

  const inputPath = path.resolve(__dirname, inputFile);
  const outputPath = path.resolve(__dirname, outputFile);

  console.log('='.repeat(60));
  console.log('QT 나레이션 변환');
  console.log('='.repeat(60));
  console.log();
  console.log(`입력: ${inputPath}`);
  console.log(`출력: ${outputPath}`);
  console.log();

  // 입력 파일 확인
  if (!fs.existsSync(inputPath)) {
    console.error(`오류: 입력 파일을 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
  }

  // JSON 로드
  const qtData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`${qtData.length}개 항목 발견`);
  console.log();

  // 변환 처리
  const narrations = [];
  let skippedCount = 0;

  for (const item of qtData) {
    const meditationGuide = item.meditation?.meditationGuide;
    const jesusConnection = item.meditation?.jesusConnection;

    // 묵상 가이드가 없으면 스킵
    if (!meditationGuide) {
      console.log(`[스킵] ${item.date} - 묵상 가이드 없음`);
      skippedCount++;
      continue;
    }

    const narration = convertToNarration(meditationGuide, jesusConnection);

    narrations.push({
      date: item.date,
      title: item.title,
      hasJesusConnection: !!jesusConnection,
      isSupplementary: item.meditation?.isSupplementary || false,
      narration: narration
    });

    console.log(`[변환] ${item.date} - ${item.title}`);
  }

  // 결과 저장
  fs.writeFileSync(outputPath, JSON.stringify(narrations, null, 2), 'utf8');

  console.log();
  console.log('='.repeat(60));
  console.log('변환 완료');
  console.log('='.repeat(60));
  console.log();
  console.log(`변환됨: ${narrations.length}개`);
  console.log(`스킵됨: ${skippedCount}개`);
  console.log();
  console.log(`출력 파일: ${outputPath}`);
  console.log();
  console.log('다음 단계:');
  console.log('  1. 생성된 나레이션 텍스트 검토');
  console.log('  2. node generate-tts.js narrations.json [음성이름]');
}

// 실행
main();
