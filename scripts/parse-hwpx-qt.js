/**
 * hwpx QT 파일 파싱 스크립트
 * 1월 QT 데이터를 JSON으로 변환
 */

const fs = require('fs');
const path = require('path');

// XML에서 텍스트 추출 (hp:t 태그)
function extractText(xml) {
  const texts = [];
  const regex = /<hp:t>([^<]*)<\/hp:t>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    if (match[1].trim()) {
      texts.push(match[1].trim());
    }
  }
  return texts;
}

// 날짜 파싱 (예: "12", "월요일" -> { day: 12, dayOfWeek: "월요일" })
function parseDate(texts) {
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    // 숫자만 있는 경우 (날짜)
    if (/^\d{1,2}$/.test(text)) {
      const day = parseInt(text);
      // 1~31 범위 체크
      if (day >= 1 && day <= 31) {
        // 다음 텍스트가 요일인지 확인
        const nextText = texts[i + 1];
        if (nextText && /[월화수목금토일]요일/.test(nextText)) {
          return { day, dayOfWeek: nextText };
        }
      }
    }
  }
  return null;
}

// 제목 파싱 (예: ""안식을 주시는 하나님"")
function parseTitle(texts) {
  for (const text of texts) {
    // 한글 쌍따옴표로 시작하는 제목 찾기 (""로 감싸진 텍스트)
    if ((text.startsWith('"') || text.startsWith('"') || text.startsWith('"')) &&
        (text.endsWith('"') || text.endsWith('"') || text.endsWith('"'))) {
      return text.replace(/["""]/g, '');
    }
  }
  return null;
}

// 성경 범위 파싱 (예: "창 1-4장")
function parseBibleRange(texts) {
  for (const text of texts) {
    if (/^[가-힣]+\s*\d+.*장$/.test(text)) {
      return text;
    }
  }
  return null;
}

// 본문 구절 파싱 (예: "창세기 2장 1-3절")
function parseVerseReference(texts) {
  for (const text of texts) {
    if (/^[가-힣]+\s*\d+장\s*\d+.*절/.test(text)) {
      return text;
    }
  }
  return null;
}

// 성경 본문 파싱 - 개선된 버전
function parseVerses(texts) {
  const verses = [];
  let isInVerseSection = false;
  let currentVerse = null;

  // 본문 구절 참조 찾기 (예: "창세기 2장 1-3절")
  let verseRefIndex = -1;
  for (let i = 0; i < texts.length; i++) {
    if (/^[가-힣]+\s*\d+장\s*\d+.*절/.test(texts[i])) {
      verseRefIndex = i;
      isInVerseSection = true;
      break;
    }
  }

  if (verseRefIndex === -1) return verses;

  // 본문 구절 이후부터 파싱
  for (let i = verseRefIndex + 1; i < texts.length; i++) {
    const text = texts[i];

    // 본문 끝 감지 (다음 섹션 시작)
    if (text.includes('본문 다시 읽기') ||
        text.includes('한 단어 동그라미') ||
        text.includes('ONE WORD')) {
      break;
    }

    // 절 번호 (1~176 범위, 성경 최대 절 수)
    if (/^\s*\d{1,3}\s*$/.test(text)) {
      const verseNum = parseInt(text.trim());
      if (verseNum >= 1 && verseNum <= 176) {
        if (currentVerse && currentVerse.content) {
          verses.push(currentVerse);
        }
        currentVerse = {
          verse: verseNum,
          content: ''
        };
      }
    } else if (currentVerse) {
      // 성경 본문 내용
      if (text.length > 3 &&
          !text.includes('READING JESUS') &&
          !text.includes('January') &&
          !/^[월화수목금토일]요일$/.test(text)) {
        currentVerse.content += (currentVerse.content ? ' ' : '') + text;
      }
    }
  }

  if (currentVerse && currentVerse.content) {
    verses.push(currentVerse);
  }

  return verses;
}

// 2페이지 (묵상) 파싱
function parseMeditation(texts) {
  const result = {
    oneWord: null,
    oneWordSubtitle: null,
    meditationGuide: null,
    jesusConnection: null,
    meditationQuestion: null,
    prayer: null,
    copyVerse: null
  };

  const fullText = texts.join(' ');

  // ONE WORD 파싱
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (text.startsWith('ONE WORD')) {
      const content = text.replace('ONE WORD : ', '').replace('ONE WORD :', '').trim();
      const parts = content.split('(');
      result.oneWord = parts[0].trim();
      if (parts[1]) {
        result.oneWordSubtitle = parts[1].replace(')', '').trim();
      }
      break;
    }
  }

  // 필사 구절 파싱
  for (let i = 0; i < texts.length; i++) {
    if (texts[i].includes('오늘의 필사 구절')) {
      // 다음 몇 개 텍스트에서 필사 구절 찾기
      for (let j = i + 1; j < Math.min(i + 5, texts.length); j++) {
        const t = texts[j];
        if ((t.startsWith('"') || t.startsWith('"')) && t.includes('(')) {
          result.copyVerse = t;
          break;
        }
      }
      break;
    }
  }

  // 예수님 연결 파싱
  for (let i = 0; i < texts.length; i++) {
    if (texts[i].includes('예수님 연결')) {
      for (let j = i + 1; j < Math.min(i + 4, texts.length); j++) {
        const t = texts[j];
        if (t.includes('예수님') || t.includes('(히') || t.includes('(요') || t.includes('(롬')) {
          result.jesusConnection = t;
          break;
        }
      }
      break;
    }
  }

  // 묵상 길잡이 파싱 (2) 묵상 길잡이 섹션 뒤의 긴 텍스트)
  for (let i = 0; i < texts.length; i++) {
    if (texts[i].includes('묵상 길잡이')) {
      for (let j = i + 1; j < Math.min(i + 10, texts.length); j++) {
        const t = texts[j];
        if (t.length > 100) {
          result.meditationGuide = t;
          break;
        }
      }
      break;
    }
  }

  // 묵상 질문 파싱
  for (let i = 0; i < texts.length; i++) {
    if (texts[i].includes('묵상 질문')) {
      for (let j = i + 1; j < Math.min(i + 5, texts.length); j++) {
        const t = texts[j];
        if (t.includes('?') || (t.length > 20 && t.length < 200)) {
          result.meditationQuestion = t.replace('⦁', '').trim();
          break;
        }
      }
      break;
    }
  }

  // 기도문 파싱
  for (let i = 0; i < texts.length; i++) {
    if (texts[i].includes('나의 기도')) {
      for (let j = i + 1; j < Math.min(i + 5, texts.length); j++) {
        const t = texts[j];
        if (t.length > 30 && (t.includes('하소서') || t.includes('주세요') || t.includes('고백') || t.includes('감사'))) {
          // 여러 줄일 수 있으므로 합치기
          let prayer = t;
          for (let k = j + 1; k < Math.min(j + 3, texts.length); k++) {
            if (texts[k].length > 10 && !texts[k].includes('나의 고백')) {
              prayer += ' ' + texts[k];
            } else {
              break;
            }
          }
          result.prayer = prayer.replace('⦁', '').trim();
          break;
        }
      }
      break;
    }
  }

  return result;
}

// 메인 파싱 함수
function parseQTData(extractedDir) {
  const contentsDir = path.join(extractedDir, 'Contents');
  const files = fs.readdirSync(contentsDir)
    .filter(f => f.startsWith('section') && f.endsWith('.xml'))
    .sort((a, b) => {
      const numA = parseInt(a.replace('section', '').replace('.xml', ''));
      const numB = parseInt(b.replace('section', '').replace('.xml', ''));
      return numA - numB;
    });

  const qtData = [];

  // 2개씩 묶어서 처리 (1페이지 + 2페이지)
  for (let i = 0; i < files.length; i += 2) {
    const page1File = path.join(contentsDir, files[i]);
    const page2File = files[i + 1] ? path.join(contentsDir, files[i + 1]) : null;

    const page1Xml = fs.readFileSync(page1File, 'utf-8');
    const page1Texts = extractText(page1Xml);

    const dateInfo = parseDate(page1Texts);
    if (!dateInfo) continue;

    const title = parseTitle(page1Texts);
    const bibleRange = parseBibleRange(page1Texts);
    const verseReference = parseVerseReference(page1Texts);

    // 2페이지 파싱 (먼저 수행하여 ONE WORD를 제목으로 사용)
    let meditation = null;
    if (page2File && fs.existsSync(page2File)) {
      const page2Xml = fs.readFileSync(page2File, 'utf-8');
      const page2Texts = extractText(page2Xml);
      meditation = parseMeditation(page2Texts);
    }

    // 제목: 1페이지에서 찾은 제목 또는 ONE WORD 사용
    const finalTitle = title || (meditation && meditation.oneWord ?
      `${meditation.oneWord}${meditation.oneWordSubtitle ? ' (' + meditation.oneWordSubtitle + ')' : ''}` : null);

    const qt = {
      month: 1,
      year: 2026,
      day: dateInfo.day,
      dayOfWeek: dateInfo.dayOfWeek,
      date: `2026-01-${String(dateInfo.day).padStart(2, '0')}`,
      title: finalTitle,
      bibleRange: bibleRange,
      verseReference: verseReference,
      verses: parseVerses(page1Texts),
      meditation: meditation
    };

    qtData.push(qt);
  }

  return qtData;
}

// 실행
const extractedDir = path.join(__dirname, '..', 'hwpx_extracted');
const outputFile = path.join(__dirname, '..', 'data', 'qt-january-2026.json');

// data 디렉토리 생성
const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const qtData = parseQTData(extractedDir);

// JSON 저장
fs.writeFileSync(outputFile, JSON.stringify(qtData, null, 2), 'utf-8');

console.log(`파싱 완료: ${qtData.length}개의 QT 데이터`);
console.log(`저장 위치: ${outputFile}`);

// 전체 데이터 요약
console.log('\n=== QT 데이터 요약 ===');
qtData.forEach(qt => {
  console.log(`${qt.date} (${qt.dayOfWeek}): ${qt.title || '(제목 없음)'} - ${qt.bibleRange || ''}`);
});

// 첫 번째 샘플 상세 출력
if (qtData.length > 0) {
  console.log('\n=== 첫 번째 QT 상세 ===');
  console.log(JSON.stringify(qtData[0], null, 2));
}
