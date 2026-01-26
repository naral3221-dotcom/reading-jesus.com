# AI 팀 통합 커맨드

## 명령어
`/ai [작업유형] [대상]`

## 입력
$ARGUMENTS

## 사용 예시
```
/ai 랜딩 성형외과 상담예약
/ai 리뷰 src/components/Form.tsx
/ai 디버그 [에러메시지]
/ai 최적화 src/app/page.tsx
```

## 실행 로직

입력된 첫 번째 키워드에 따라 분기:

### "랜딩" / "landing" / "만들어" / "생성"
→ AI 팀 랜딩페이지 제작 프로세스 실행
1. Gemini: 타겟 분석, CTA 제안
2. GPT: 카피라이팅
3. Claude: 구현
4. 병렬 검증

### "리뷰" / "review" / "검토"
→ AI 팀 코드 리뷰 실행
- Gemini: UX 관점
- GPT: 버그/보안
- Claude: 아키텍처

### "디버그" / "debug" / "에러" / "버그"
→ AI 팀 에러 분석 실행
- GPT: 스택 트레이스 분석
- Gemini: 유사 에러 패턴
- Claude: 해결 및 적용

### "최적화" / "optimize" / "성능"
→ AI 팀 성능 최적화 실행
- Gemini: 렌더링 분석
- GPT: 알고리즘 분석
- Claude: 최적화 적용

## 비용 안내
이 커맨드 실행 시 GPT/Gemini API 비용이 발생합니다.
간단한 작업은 슬래시 커맨드 없이 일반 대화로 요청하세요.
