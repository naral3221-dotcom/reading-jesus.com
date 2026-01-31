# QT 묵상 TTS 생성 가이드

## 개요

QT JSON 파일에서 묵상 콘텐츠(`meditationGuide`, `jesusConnection`)를 추출하여
Gemini TTS로 오디오 파일을 생성하는 파이프라인입니다.

---

## 빠른 시작

```bash
cd data/scripts

# 1. 나레이션 대본 생성
node extract-and-convert.js ../qt-march-2026.json narrations-march.json

# 2. TTS 오디오 생성
node generate-tts.js narrations-march.json Aoede
```

---

## 스크립트 설명

### 1. `extract-and-convert.js` - 나레이션 대본 생성

QT JSON에서 묵상 텍스트를 추출하고 TTS에 적합한 형태로 변환합니다.

**사용법:**
```bash
node extract-and-convert.js [입력 JSON] [출력 JSON]
```

**처리 내용:**
- `meditation.meditationGuide` 추출
- `meditation.jesusConnection` 추출 (있는 경우)
- 성경 구절 참조 제거 (예: `(히 4:9-10)` → 삭제)
- 긴 문장 분리 및 호흡점 추가

**출력 예시:**
```json
{
  "date": "2026-01-12",
  "title": "안식을 주시는 하나님",
  "narration": "하나님께서는 창조를 마치신 뒤..."
}
```

---

### 2. `generate-tts.js` - TTS 오디오 생성

Gemini TTS API를 사용하여 나레이션을 오디오로 변환합니다.

**사용법:**
```bash
node generate-tts.js [나레이션 JSON] [음성 이름]
```

**설정:**
- 배치 크기: 5개씩 처리
- 재시도: 실패 시 최대 3회
- 출력 형식: WAV (24kHz, 16bit, mono)

**출력 위치:** `data/output/YYYY-MM-DD-meditation.wav`

---

### 3. `test-voices.js` - 음성 샘플 테스트

여러 음성으로 샘플을 생성하여 최적의 음성을 선택합니다.

**사용법:**
```bash
node test-voices.js
```

**테스트 음성:**
| 음성 | 특징 |
|------|------|
| Aoede | Breezy, 산뜻함 (선택됨) |
| Leda | Youthful, 젊고 밝음 |
| Achernar | Soft, 부드러움 |
| Enceladus | Breathy, 숨결 있음 |
| Kore | Firm, 단정함 |
| Sulafat | Warm, 따뜻함 |

**출력 위치:** `data/output/voice-samples/`

---

## 디렉토리 구조

```
data/
├── qt-january-2026.json      # 원본 QT 데이터
├── qt-february-2026.json
├── scripts/
│   ├── extract-and-convert.js
│   ├── generate-tts.js
│   ├── test-voices.js
│   ├── narrations-january.json   # 생성된 나레이션
│   └── narrations-february.json
└── output/
    ├── 2026-01-12-meditation.wav # TTS 오디오
    ├── 2026-01-13-meditation.wav
    ├── ...
    ├── generation-results.json   # 생성 결과 로그
    └── voice-samples/            # 음성 테스트 샘플
```

---

## API 설정

**모델:** `gemini-2.5-flash-preview-tts`

**기본 음성:** `Aoede` (부드럽고 차분한 여성 목소리)

**나레이션 스타일:** 경어체 (합니다)

---

## 주의사항

1. **API Rate Limit**: 5개씩 배치 처리로 안정성 확보
2. **jesusConnection null**: null인 경우 해당 부분 자동 스킵
3. **보충 묵상**: `isSupplementary: true`인 항목도 포함됨
4. **성경 구절 참조**: TTS에서 읽지 않고 제거됨

---

## 생성 이력

| 월 | 파일 수 | 음성 | 날짜 |
|----|---------|------|------|
| 1월 | 18개 | Aoede | 2026-01-27 |
| 2월 | 24개 | Aoede | 2026-01-28 |
