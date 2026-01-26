# 마이페이지 (루트)

> **경로**: `/mypage`
> **파일**: `src/app/(main)/mypage/page.tsx`
> **타입**: 래퍼 페이지
> **최종 업데이트**: 2026-01-25

---

## 설명

마이페이지 루트 경로로, 실제 로직은 `UnifiedMyPage` 컴포넌트에 위임합니다.
개인 컨텍스트 (`churchContext={null}`)로 렌더링됩니다.

---

## 위임 대상

| 대상 | 파일 | 설명 |
|------|------|------|
| `<UnifiedMyPage />` | `src/components/mypage/UnifiedMyPage.tsx` | 통합 마이페이지 컴포넌트 |

---

## 컴포넌트 Props

```typescript
<UnifiedMyPage churchContext={null} />
```

- `churchContext`: 교회 컨텍스트 (null = 개인 모드)

---

## 관련 문서

- [mypage-readings.md](./mypage-readings.md) - 읽기 기록
- [mypage-comments.md](./mypage-comments.md) - 내 댓글
- [mypage-settings.md](./mypage-settings.md) - 설정
- [church-my.md](../church/church-my.md) - 교회 마이페이지 (동일 컴포넌트, 다른 컨텍스트)
