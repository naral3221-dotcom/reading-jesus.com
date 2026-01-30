---
name: generate-narration
description: QT JSON 파일에서 묵상 가이드와 예수님 연결점을 추출하여 TTS용 나레이션 대본으로 변환합니다.
disable-model-invocation: true
allowed-tools: Read, Write, Glob
---

# QT 나레이션 대본 생성

QT(Quiet Time) JSON 파일에서 묵상 콘텐츠를 추출하여 TTS에 적합한 나레이션 대본을 생성합니다.

## 사용법

```
/generate-narration [JSON 파일 경로] [출력 파일 경로]
```

예시:
```
/generate-narration data/qt-january-2026.json data/scripts/narrations-january.json
```

## 작업 흐름

### 1. JSON 파일 읽기
지정된 JSON 파일에서 QT 데이터를 읽습니다.

### 2. 각 항목 변환
각 QT 항목에 대해:
- `meditation.meditationGuide` 추출
- `meditation.jesusConnection` 추출 (null이면 스킵)
- 나레이션 형태로 변환

### 3. 변환 규칙

#### 말투
- 경어체 유지 (~합니다, ~입니다)
- 차분하고 따뜻한 톤

#### 호흡 조절
- 30자 이상 문장은 적절히 분리
- 자연스러운 위치에 쉼표 추가
- 문단 사이에 "..." 표시로 pause 효과

#### 발음 최적화
- 숫자를 한글로 (1장 → 일 장)
- 성경 구절 명확히 표기

#### 구조
```
[묵상 가이드]

...

예수님과의 연결점입니다.

[예수님 연결점]
```

### 4. 결과 저장
변환된 나레이션을 JSON 파일로 저장:

```json
[
  {
    "date": "2026-01-12",
    "title": "안식을 주시는 하나님",
    "narration": "변환된 나레이션 텍스트..."
  }
]
```

## 입력 파일 형식

```json
[
  {
    "date": "2026-01-12",
    "title": "제목",
    "meditation": {
      "meditationGuide": "묵상 가이드 텍스트",
      "jesusConnection": "예수님 연결점 텍스트 또는 null"
    }
  }
]
```

## 주의사항

1. `isSupplementary: true`인 항목은 `jesusConnection`이 null일 수 있음
2. 원문의 신학적 의미가 변하지 않도록 주의
3. TTS가 자연스럽게 읽을 수 있도록 텍스트 최적화

## 인수

- `$0`: 입력 JSON 파일 경로
- `$1`: 출력 JSON 파일 경로 (선택, 기본: data/scripts/narrations.json)
