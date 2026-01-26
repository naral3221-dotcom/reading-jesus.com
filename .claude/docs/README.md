# 페이지 설명서 시스템

> 이 디렉토리는 프로젝트의 모든 페이지에 대한 문서를 관리합니다.

---

## 구조

```
.claude/docs/
├── README.md                    # 이 파일
├── pages/
│   ├── _template.md             # 표준 페이지 문서 템플릿
│   ├── _template-simple.md      # 간소화 템플릿 (래퍼 페이지용)
│   ├── index.md                 # 전체 페이지 목록 및 문서화 상태
│   ├── main/                    # (main) 라우트 그룹
│   ├── church/                  # church/[code] 라우트 그룹
│   ├── admin/                   # admin 라우트 그룹
│   ├── auth/                    # 인증 관련 페이지
│   └── guest/                   # 게스트/프리뷰 페이지
```

---

## 사용법

### 새 페이지 문서 작성 시

1. 해당 그룹 폴더에 `[페이지명].md` 파일 생성
2. `_template.md` 또는 `_template-simple.md` 복사
3. 내용 작성
4. `index.md` 상태 업데이트

### 템플릿 선택 기준

| 페이지 유형 | 템플릿 | 기준 |
|-------------|--------|------|
| 복잡한 페이지 | `_template.md` | 150줄 이상, 상태 관리, 여러 훅 사용 |
| 래퍼/리다이렉트 | `_template-simple.md` | 50줄 이하, 컴포넌트 위임 |

---

## 문서 카테고리

| 카테고리 | 경로 | 설명 |
|----------|------|------|
| **main** | `pages/main/` | 메인 사용자 페이지 (home, bible, qt 등) |
| **church** | `pages/church/` | 교회 관련 페이지 (church/[code]/*) |
| **admin** | `pages/admin/` | 시스템 관리자 페이지 |
| **auth** | `pages/auth/` | 로그인/인증 페이지 |
| **guest** | `pages/guest/` | 비로그인 사용자 페이지 |

---

## 검증

```bash
# 누락된 문서 확인
npm run docs:validate
```

---

## 관련 문서

- [CLAUDE.md](../../CLAUDE.md) - 프로젝트 규칙
- [ARCHITECTURE_GUIDE.md](../../ARCHITECTURE_GUIDE.md) - 아키텍처 가이드
- [pages/index.md](./pages/index.md) - 전체 페이지 목록

---

*최종 업데이트: 2026-01-25*
