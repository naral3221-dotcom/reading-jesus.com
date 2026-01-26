const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

/**
 * 리딩지저스 교회 페이지 가이드 PPT
 *
 * 업데이트: 2024-12-27
 * - 성경 메뉴 슬라이드 추가
 * - 마이페이지 슬라이드 추가 (개발 예정)
 * - 그룹 기능 "개발 중" 표시
 * - 향후 개발 예정 기능 슬라이드 추가
 */

// === DESIGN SYSTEM ===
const DESIGN = {
  colors: {
    primary: "2563EB",
    primaryDark: "1E40AF",
    primaryLight: "DBEAFE",
    accent: "D97706",
    accentLight: "FEF3C7",
    admin: "7C3AED",
    adminLight: "EDE9FE",
    success: "059669",
    warning: "D97706",
    dark: "111827",
    text: "374151",
    muted: "6B7280",
    border: "E5E7EB",
    light: "F9FAFB",
    white: "FFFFFF",
    devInProgress: "EF4444", // 개발 중 표시용 빨간색
  },
  fonts: {
    primary: "Pretendard",
    fallback: "Arial",
  },
  fontSize: {
    hero: 44,
    h1: 28,
    h2: 20,
    h3: 16,
    body: 12,
    small: 10,
    caption: 9,
  },
  spacing: {
    margin: 0.5,
    gap: 0.25,
    cardPadding: 0.2,
  },
};

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, "..", "docs", "screen shot", "church");

// === SCREENSHOT MAPPING ===
const SCREENSHOTS = {
  // URL 관련
  urlWithToken: "church-header.png",
  urlBasic: "church-url.png",

  // 교회 메인 페이지
  mainPage: "church-date.png",
  writeForm: "church-write-form.png",
  commentsList: "church-comments.png",
  noAuth: "church-no-auth.png.png",

  // 교인 등록
  memberHeader: "member-register.png",
  registerDialog: "chuch join btn click.png",

  // QT/나눔 페이지
  qtPage: "qt page.png",
  qtWriteDialog: "qt-write-dialog.png",
  qtDetail: "qt-list-detail.png",
  sharingPage: "스크린샷 2025-12-27 004318.png",

  // 성경 메뉴 (NEW)
  bibleSchedule: "스크린샷 2025-12-27 014334.png",
  bibleOT: "스크린샷 2025-12-27 014341.png",
  bibleNT: "스크린샷 2025-12-27 014348.png",
  bibleReader: "스크린샷 2025-12-27 014355.png",
  bibleCompleteConfirm: "스크린샷 2025-12-27 014405.png",
  bibleCompleted: "스크린샷 2025-12-27 014410.png",

  // 그룹 기능
  groupsEmpty: "church-groups.png",
  groupsHeader: "church-groups-list.png",
  groupCreate: "church-groups-create.png",
  groupBrowse: "church-groups-browse.png",
  groupDetail: "church-group-card.png",
  groupGuest: "church-groups-guest.png",

  // 마이페이지 (NEW)
  mypageTop: "스크린샷 2025-12-27 014714.png",
  mypageBottom: "스크린샷 2025-12-27 014720.png",
};

function getScreenshot(key) {
  const filename = SCREENSHOTS[key];
  if (!filename) return null;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  return fs.existsSync(filepath) ? filepath : null;
}

// === HELPER FUNCTIONS ===

function addBackground(slide, type = "light") {
  const { colors } = DESIGN;
  if (type === "primary") {
    slide.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: colors.primary } });
    slide.addShape("ellipse", { x: 7.5, y: -1, w: 4, h: 4, fill: { color: colors.primaryDark, transparency: 50 } });
  } else if (type === "admin") {
    slide.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: colors.admin } });
  } else {
    slide.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: colors.white } });
    slide.addShape("rect", { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: colors.primary } });
  }
}

function addTitle(slide, title, options = {}) {
  const { colors, fonts, fontSize, spacing } = DESIGN;
  const { subtitle, color = colors.primary, devBadge = false } = options;

  slide.addText(title, {
    x: spacing.margin, y: 0.3, w: devBadge ? 6 : 9, h: 0.6,
    fontSize: fontSize.h1, fontFace: fonts.primary, color: colors.dark, bold: true,
  });

  // 개발 중 배지
  if (devBadge) {
    slide.addShape("rect", {
      x: 6.5, y: 0.35, w: 1.3, h: 0.4,
      fill: { color: colors.devInProgress },
    });
    slide.addText("개발 중", {
      x: 6.5, y: 0.38, w: 1.3, h: 0.35,
      fontSize: 11, fontFace: fonts.primary, color: colors.white, bold: true, align: "center",
    });
  }

  slide.addShape("rect", { x: spacing.margin, y: 0.85, w: 1.5, h: 0.04, fill: { color } });

  if (subtitle) {
    slide.addText(subtitle, {
      x: spacing.margin, y: 0.95, w: 9, h: 0.35,
      fontSize: fontSize.body, fontFace: fonts.primary, color: colors.muted,
    });
  }
}

function addCard(slide, options) {
  const { colors, fonts, fontSize, spacing } = DESIGN;
  const { x, y, w, h, title, items = [], color = colors.primary, numbered = false } = options;

  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: colors.white },
    line: { color: colors.border, pt: 1 },
    shadow: { type: "outer", blur: 3, offset: 1, angle: 45, color: "000000", opacity: 0.08 },
  });

  if (title) {
    slide.addShape("rect", { x, y, w, h: 0.4, fill: { color } });
    slide.addText(title, {
      x: x + spacing.cardPadding, y: y + 0.08, w: w - spacing.cardPadding * 2, h: 0.3,
      fontSize: fontSize.h3 - 2, fontFace: fonts.primary, color: colors.white, bold: true,
    });
  }

  const startY = title ? y + 0.5 : y + spacing.cardPadding;
  items.forEach((item, idx) => {
    const prefix = numbered ? `${idx + 1}. ` : "• ";
    slide.addText(prefix + item, {
      x: x + spacing.cardPadding, y: startY + idx * 0.28, w: w - spacing.cardPadding * 2, h: 0.26,
      fontSize: fontSize.small, fontFace: fonts.primary, color: colors.text,
    });
  });
}

function addScreenshot(slide, key, x, y, w, h) {
  const screenshot = getScreenshot(key);
  if (!screenshot) {
    console.log(`  Warning: Screenshot not found for key: ${key}`);
    return false;
  }
  // 배경 프레임 (이미지 비율 유지로 인해 실제 이미지보다 클 수 있음)
  slide.addShape("rect", {
    x: x - 0.03, y: y - 0.03, w: w + 0.06, h: h + 0.06,
    fill: { color: DESIGN.colors.dark },
    shadow: { type: "outer", blur: 6, offset: 3, angle: 45, color: "000000", opacity: 0.15 },
  });
  // sizing: "contain" - 지정 영역 내에서 이미지 비율 유지
  slide.addImage({
    path: screenshot,
    x,
    y,
    w,
    h,
    sizing: { type: "contain", w: w, h: h }
  });
  return true;
}

function addTable(slide, data, options) {
  const { colors, fonts, fontSize } = DESIGN;
  const { x, y, w, headerColor = colors.primary, colW } = options;
  const rows = data.map((row, rowIdx) => {
    return row.map(cell => ({
      text: cell,
      options: rowIdx === 0
        ? { bold: true, fill: headerColor, color: colors.white, fontSize: fontSize.small }
        : { fontSize: fontSize.small, color: colors.text }
    }));
  });
  slide.addTable(rows, {
    x, y, w, fontFace: fonts.primary,
    border: { pt: 0.5, color: colors.border }, colW, valign: "middle",
  });
}

function addBadge(slide, text, x, y, color = DESIGN.colors.primary) {
  const width = text.length * 0.11 + 0.25;
  slide.addShape("rect", { x, y, w: width, h: 0.3, fill: { color } });
  slide.addText(text, {
    x, y: y + 0.03, w: width, h: 0.24,
    fontSize: DESIGN.fontSize.caption, fontFace: DESIGN.fonts.primary,
    color: DESIGN.colors.white, bold: true, align: "center",
  });
}

// === SLIDE FUNCTIONS ===

function createTitleSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors, fonts, fontSize } = DESIGN;
  addBackground(slide, "primary");

  slide.addText("리딩지저스", {
    x: 0.6, y: 1.5, w: 9, h: 0.9,
    fontSize: fontSize.hero, fontFace: fonts.primary, color: colors.white, bold: true,
  });
  slide.addText("교회 페이지 가이드", {
    x: 0.6, y: 2.35, w: 9, h: 0.65,
    fontSize: 32, fontFace: fonts.primary, color: colors.primaryLight,
  });
  slide.addShape("rect", { x: 0.6, y: 3.1, w: 2.5, h: 0.03, fill: { color: colors.white, transparency: 50 } });
  slide.addText("교회별 성경 통독 & 묵상 나눔 플랫폼", {
    x: 0.6, y: 3.3, w: 9, h: 0.4,
    fontSize: 16, fontFace: fonts.primary, color: colors.white,
  });
  slide.addText("교회 담당자를 위한 상세 매뉴얼", {
    x: 0.6, y: 3.7, w: 9, h: 0.35,
    fontSize: 14, fontFace: fonts.primary, color: colors.primaryLight,
  });
  const date = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  slide.addText(date, {
    x: 0.6, y: 4.8, w: 2, h: 0.3,
    fontSize: fontSize.body, fontFace: fonts.primary, color: colors.primaryLight,
  });
}

function createTocSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors } = DESIGN;
  addBackground(slide, "light");
  addTitle(slide, "목차", { subtitle: "이 가이드에서 다루는 내용" });

  addCard(slide, {
    x: 0.4, y: 1.4, w: 3, h: 2.6,
    title: "Part 1. 기본 기능",
    color: colors.primary,
    numbered: true,
    items: ["교회 URL 구조", "교회 메인 페이지", "묵상 나눔 작성", "QT 나눔 기능"],
  });

  addCard(slide, {
    x: 3.5, y: 1.4, w: 3, h: 2.6,
    title: "Part 2. 성경 읽기",
    color: colors.success,
    numbered: true,
    items: ["통독 일정 보기", "성경 본문 읽기", "읽음 완료 체크", "구약/신약 탭"],
  });

  addCard(slide, {
    x: 6.6, y: 1.4, w: 3, h: 2.6,
    title: "Part 3. 소그룹 & 마이",
    color: colors.admin,
    numbered: true,
    items: ["소그룹 기능 (개발중)", "마이페이지 (개발예정)", "향후 개발 계획"],
  });
}

function createUrlSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors } = DESIGN;
  addBackground(slide, "light");
  addTitle(slide, "교회별 전용 URL", { subtitle: "각 교회만의 고유한 페이지 주소" });

  addBadge(slide, "URL 형식: /church/{교회코드}", 0.5, 1.35, colors.primary);

  addTable(slide, [
    ["URL 경로", "용도"],
    ["/church/SE25001", "교회 메인 (묵상 작성)"],
    ["/church/SE25001/sharing", "나눔 목록"],
    ["/church/SE25001/bible", "성경 읽기"],
    ["/church/SE25001/groups", "소그룹 관리"],
  ], { x: 0.5, y: 1.8, w: 5, colW: [2.3, 2.7] });

  slide.addText("교회 코드: 대문자/숫자 조합 (예: SE25001, GRACE, HOPE123)", {
    x: 0.5, y: 3.8, w: 5, h: 0.3,
    fontSize: DESIGN.fontSize.small, fontFace: DESIGN.fonts.primary, color: colors.muted,
  });

  addScreenshot(slide, "urlBasic", 6, 1.3, 3.5, 0.6);
  addScreenshot(slide, "urlWithToken", 6, 2.1, 3.5, 0.6);

  slide.addText("기본 URL", { x: 6, y: 1.9, w: 3, h: 0.2, fontSize: DESIGN.fontSize.caption, fontFace: DESIGN.fonts.primary, color: colors.muted });
  slide.addText("권한 토큰 포함 URL (QR 스캔 시)", { x: 6, y: 2.7, w: 3.5, h: 0.2, fontSize: DESIGN.fontSize.caption, fontFace: DESIGN.fonts.primary, color: colors.muted });
}

function createMainPageSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "교회 메인 페이지", { subtitle: "헤더 + 날짜 선택 + 묵상 작성" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.8,
    title: "페이지 구성 요소",
    items: [
      "교회 아이콘 + 교회 이름",
      "교회 주소 표시",
      "교회 등록/등록 교인 버튼",
      "날짜 선택 (좌우 화살표)",
      "해당 날짜의 읽기 범위",
      "짧은 묵상 나눔 작성 폼",
      "익명 작성 옵션",
      "나눔 등록 버튼",
    ],
  });

  addScreenshot(slide, "mainPage", 5.5, 1.1, 4, 4.2);
}

function createWriteFormSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "짧은 묵상 나눔 작성", { subtitle: "간단한 묵상을 작성하고 공유하기" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.4,
    title: "작성 폼 구성",
    color: DESIGN.colors.primary,
    numbered: true,
    items: [
      "이름 입력 (등록 교인은 자동)",
      "묵상 내용 (리치 에디터)",
      "서식 도구 (볼드, 이탤릭 등)",
      "익명으로 작성 체크박스",
      "나눔 등록 버튼",
    ],
  });

  slide.addShape("rect", { x: 0.5, y: 4.0, w: 4.5, h: 0.6, fill: { color: DESIGN.colors.primaryLight } });
  slide.addText("등록 교인은 이름이 자동 입력되며 수정 불가", {
    x: 0.6, y: 4.1, w: 4.3, h: 0.4,
    fontSize: DESIGN.fontSize.small, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.primary,
  });

  addScreenshot(slide, "writeForm", 5.5, 1.1, 4, 4.2);
}

function createCommentsSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "묵상 목록 & 좋아요", { subtitle: "다른 교인들의 묵상을 읽고 공감하기" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.2,
    title: "묵상 카드 구성",
    items: ["작성자 프로필 아이콘", "작성자 이름 & 날짜/시간", "성경 범위 배지 (예: 창 1-4)", "묵상 내용", "좋아요 버튼 (하트)"],
  });

  addScreenshot(slide, "commentsList", 5.5, 1.1, 4, 3.8);
}

function createNoAuthSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "작성 권한 획득 방법", { subtitle: "QR 코드 또는 교인 등록으로 권한 얻기" });

  addTable(slide, [
    ["방법", "설명"],
    ["QR 코드 스캔", "교회에서 제공하는 QR 코드로 접속"],
    ["교인 등록", "로그인 후 '교회 등록' 버튼 클릭"],
  ], { x: 0.5, y: 1.4, w: 4.5, headerColor: DESIGN.colors.accent, colW: [1.3, 3.2] });

  slide.addShape("rect", { x: 0.5, y: 2.6, w: 4.5, h: 0.9, fill: { color: DESIGN.colors.accentLight }, line: { color: DESIGN.colors.accent, pt: 1 } });
  slide.addText("권한 없을 때 표시되는 메시지", { x: 0.6, y: 2.7, w: 4.3, h: 0.25, fontSize: DESIGN.fontSize.small, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.accent, bold: true });
  slide.addText("\"묵상을 작성하려면 QR 코드를 스캔해주세요\"", { x: 0.6, y: 3.0, w: 4.3, h: 0.4, fontSize: DESIGN.fontSize.small, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.text });

  addScreenshot(slide, "noAuth", 5.3, 1.0, 4.2, 4.3);
}

function createSharingPageSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "나눔 페이지", { subtitle: "짧은 묵상과 QT 나눔을 한 곳에서" });

  addTable(slide, [
    ["탭", "용도"],
    ["짧은 묵상", "간단한 자유 형식의 묵상"],
    ["QT 나눔", "구조화된 질문 기반 QT"],
  ], { x: 0.5, y: 1.4, w: 4.5, headerColor: DESIGN.colors.primary, colW: [1.3, 3.2] });

  addCard(slide, {
    x: 0.5, y: 2.6, w: 4.5, h: 1.5,
    title: "짧은 묵상 탭 특징",
    items: ["작성 버튼 (+ 짧은 묵상 나눔 작성하기)", "날짜순 묵상 목록", "성경 범위 배지 표시"],
  });

  addScreenshot(slide, "sharingPage", 5.5, 1.0, 4, 4.3);
}

function createQtPageSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "QT 나눔 탭", { subtitle: "체계적인 큐티 묵상 기록" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.0,
    title: "QT 나눔 특징",
    color: DESIGN.colors.accent,
    items: ["QT 작성하기 버튼 (주황색)", "날짜 배지 (2026-01-12)", "하루 점검 배지 (작성 시)", "작성자 정보 & 시간"],
  });

  addScreenshot(slide, "qtPage", 5.5, 1.0, 4, 4.3);
}

function createQtWriteSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "QT 작성 다이얼로그", { subtitle: "구조화된 묵상 작성 양식" });

  addCard(slide, {
    x: 0.5, y: 1.3, w: 5, h: 3.2,
    title: "QT 작성 항목",
    color: DESIGN.colors.primary,
    numbered: true,
    items: [
      "날짜 선택 (드롭다운)",
      "오늘의 말씀 보기 (접기/펴기)",
      "묵상 길잡이 보기",
      "묵상 질문 보기",
      "내 말로 한 문장 - 말씀 요약",
      "묵상 질문에 대한 답",
      "감사와 적용 - 적용점",
      "나의 기도 - 기도문",
      "말씀과 함께한 하루 점검",
    ],
  });

  addScreenshot(slide, "qtWriteDialog", 5.8, 1.0, 3.7, 4.3);
}

function createMemberRegSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "교인 등록 기능", { subtitle: "교회 멤버로 등록하여 편리하게 이용" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 1.8,
    title: "등록 과정",
    color: DESIGN.colors.success,
    numbered: true,
    items: ["리딩지저스 앱 로그인", "교회 페이지 접속", "'교회 등록' 버튼 클릭", "정보 확인 후 '등록하기'"],
  });

  slide.addShape("rect", { x: 0.5, y: 3.4, w: 4.5, h: 1.0, fill: { color: "D1FAE5" }, line: { color: DESIGN.colors.success, pt: 1 } });
  slide.addText("등록 후 혜택", { x: 0.6, y: 3.5, w: 4.3, h: 0.25, fontSize: DESIGN.fontSize.small, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.success, bold: true });
  slide.addText("• QR 코드 없이 묵상 작성 가능\n• 프로필과 묵상이 연결되어 관리", { x: 0.6, y: 3.8, w: 4.3, h: 0.5, fontSize: DESIGN.fontSize.small, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.text });

  addScreenshot(slide, "registerDialog", 5.3, 0.9, 4.2, 4.4);
}

// === 성경 메뉴 슬라이드 (NEW) ===

function createBibleIntroSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors, fonts } = DESIGN;
  addBackground(slide, "primary");

  slide.addText("Part 2", { x: 0.6, y: 1.6, w: 9, h: 0.4, fontSize: 18, fontFace: fonts.primary, color: colors.primaryLight });
  slide.addText("성경 읽기 메뉴", { x: 0.6, y: 2.0, w: 9, h: 0.8, fontSize: 40, fontFace: fonts.primary, color: colors.white, bold: true });
  slide.addShape("rect", { x: 0.6, y: 2.9, w: 2, h: 0.03, fill: { color: colors.white, transparency: 50 } });
  slide.addText("365일 통독 일정과 성경 본문 읽기", { x: 0.6, y: 3.1, w: 9, h: 0.4, fontSize: 16, fontFace: fonts.primary, color: colors.primaryLight });

  const features = ["통독 일정", "구약 39권", "신약 27권", "읽음 체크"];
  features.forEach((feat, idx) => {
    slide.addShape("rect", { x: 0.6 + idx * 2, y: 4.2, w: 1.8, h: 0.45, fill: { color: colors.white, transparency: 80 } });
    slide.addText(feat, { x: 0.6 + idx * 2, y: 4.27, w: 1.8, h: 0.35, fontSize: DESIGN.fontSize.small, fontFace: fonts.primary, color: colors.white, align: "center" });
  });
}

function createBibleScheduleSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "통독 일정 탭", { subtitle: "오늘 읽을 성경 범위 확인" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.4,
    title: "통독 일정 기능",
    color: DESIGN.colors.success,
    items: [
      "오늘은 Day N입니다 배너",
      "오늘 기준 ±3일 일정 표시",
      "일정 길게 누르면 완료 체크",
      "전체 일정 펼쳐보기 버튼",
      "묵상 아이콘, 성경 아이콘",
      "완료 시 초록색 체크 표시",
    ],
  });

  addScreenshot(slide, "bibleSchedule", 5.5, 1.0, 4, 4.3);
}

function createBibleBooksSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "구약 / 신약 탭", { subtitle: "성경 책별 읽기 현황" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.0,
    title: "책별 현황 표시",
    items: [
      "구약 39권 / 신약 27권 목록",
      "각 책별 읽은 일수 / 전체 일수",
      "책 클릭 시 성경 본문으로 이동",
      "창세기 0/12일 형태로 표시",
    ],
  });

  // 두 스크린샷 나란히
  addScreenshot(slide, "bibleOT", 5.3, 1.0, 2.1, 4.3);
  addScreenshot(slide, "bibleNT", 7.5, 1.0, 2.1, 4.3);

  slide.addText("구약", { x: 5.3, y: 4.5, w: 2.1, h: 0.3, fontSize: DESIGN.fontSize.caption, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.muted, align: "center" });
  slide.addText("신약", { x: 7.5, y: 4.5, w: 2.1, h: 0.3, fontSize: DESIGN.fontSize.caption, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.muted, align: "center" });
}

function createBibleReaderSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "성경 본문 읽기", { subtitle: "말씀을 읽고 묵상하기" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.6,
    title: "성경 리더 기능",
    items: [
      "역본 선택 (개역개정 등)",
      "책/장 선택 드롭다운",
      "이전 장 / 다음 장 버튼",
      "구절 번호와 본문 표시",
      "구절 클릭 시 복사",
      "플로팅 묵상 작성 버튼",
    ],
  });

  addScreenshot(slide, "bibleReader", 5.5, 0.9, 4, 4.4);
}

function createBibleCompleteSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "읽음 완료 체크", { subtitle: "통독 진행 상황 기록" });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.0,
    title: "완료 체크 방법",
    color: DESIGN.colors.success,
    numbered: true,
    items: [
      "통독 일정에서 해당 날짜 길게 누르기",
      "'읽음 완료 처리하시겠습니까?' 확인",
      "'완료하기' 버튼 클릭",
      "초록색 체크 표시로 완료 확인",
    ],
  });

  // 두 스크린샷 나란히
  addScreenshot(slide, "bibleCompleteConfirm", 5.3, 1.0, 2.1, 4.0);
  addScreenshot(slide, "bibleCompleted", 7.5, 1.0, 2.1, 4.0);

  slide.addText("확인 팝업", { x: 5.3, y: 4.2, w: 2.1, h: 0.3, fontSize: DESIGN.fontSize.caption, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.muted, align: "center" });
  slide.addText("완료 후", { x: 7.5, y: 4.2, w: 2.1, h: 0.3, fontSize: DESIGN.fontSize.caption, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.muted, align: "center" });
}

// === 그룹 슬라이드 (개발 중 표시) ===

function createGroupsIntroSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors, fonts, fontSize } = DESIGN;
  addBackground(slide, "admin");

  slide.addText("Part 3", { x: 0.6, y: 1.4, w: 9, h: 0.4, fontSize: 18, fontFace: fonts.primary, color: colors.adminLight });
  slide.addText("소그룹 기능", { x: 0.6, y: 1.8, w: 9, h: 0.8, fontSize: 40, fontFace: fonts.primary, color: colors.white, bold: true });

  // 개발 중 배지
  slide.addShape("rect", { x: 0.6, y: 2.7, w: 1.5, h: 0.4, fill: { color: colors.devInProgress } });
  slide.addText("개발 진행 중", { x: 0.6, y: 2.73, w: 1.5, h: 0.35, fontSize: 12, fontFace: fonts.primary, color: colors.white, bold: true, align: "center" });

  slide.addText("교회 내 소그룹별 성경 통독 운영", { x: 0.6, y: 3.3, w: 9, h: 0.4, fontSize: 16, fontFace: fonts.primary, color: colors.adminLight });

  const features = ["그룹 만들기", "멤버 관리", "진행 현황", "묵상 나눔"];
  features.forEach((feat, idx) => {
    slide.addShape("rect", { x: 0.6 + idx * 2, y: 4.2, w: 1.8, h: 0.45, fill: { color: colors.white, transparency: 80 } });
    slide.addText(feat, { x: 0.6 + idx * 2, y: 4.27, w: 1.8, h: 0.35, fontSize: fontSize.small, fontFace: fonts.primary, color: colors.white, align: "center" });
  });
}

function createGroupsPageSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "그룹 페이지", { subtitle: "교회 내 소그룹 목록 및 참여", color: DESIGN.colors.admin, devBadge: true });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.4,
    title: "그룹 페이지 구성",
    color: DESIGN.colors.admin,
    items: [
      "헤더: 교회 이름 + 그룹 수",
      "'+ 그룹 만들기' 버튼",
      "우리교회 그룹 찾아보기 검색",
      "초대 코드 입력 + 참여 버튼",
      "그룹 목록 (없으면 안내 메시지)",
    ],
  });

  addScreenshot(slide, "groupsEmpty", 5.5, 1.0, 4, 4.3);
}

function createGroupCreateSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "새 그룹 만들기", { subtitle: "소그룹 통독반 생성하기", color: DESIGN.colors.admin, devBadge: true });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.2,
    title: "그룹 생성 양식",
    color: DESIGN.colors.admin,
    numbered: true,
    items: ["그룹 이름 (필수)", "설명", "읽기 플랜 선택 (365일 등)", "시작일 선택", "만들기 버튼"],
  });

  slide.addShape("rect", { x: 0.5, y: 3.8, w: 4.5, h: 0.7, fill: { color: DESIGN.colors.adminLight } });
  slide.addText("예시: '영동중앙교회 청년부' - 365일 플랜", { x: 0.6, y: 3.9, w: 4.3, h: 0.5, fontSize: DESIGN.fontSize.small, fontFace: DESIGN.fonts.primary, color: DESIGN.colors.admin });

  addScreenshot(slide, "groupCreate", 5.3, 0.9, 4.2, 4.4);
}

function createGroupDetailSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "그룹 상세 페이지", { subtitle: "그룹 내 활동 및 진행 현황", color: DESIGN.colors.admin, devBadge: true });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 2.6,
    title: "그룹 상세 구성",
    color: DESIGN.colors.admin,
    items: [
      "그룹 이름 + 멤버 수 + 플랜",
      "탭 메뉴: 묵상 / 멤버 / 진행현황",
      "Day 표시 (예: Day 1 / 365일)",
      "날짜 네비게이션 (좌/우)",
      "묵상 나눔 작성 폼",
      "작성된 묵상 목록",
    ],
  });

  addScreenshot(slide, "groupDetail", 5.5, 0.9, 4, 4.4);
}

// === 마이페이지 슬라이드 (NEW - 개발 예정) ===

function createMypageSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "마이페이지 (개발 예정)", { subtitle: "하단 네비게이션 '마이' 메뉴로 접근", devBadge: true });

  addCard(slide, {
    x: 0.5, y: 1.4, w: 4.5, h: 3.4,
    title: "마이페이지 기능",
    color: DESIGN.colors.primary,
    items: [
      "프로필 정보 (이름, 소속 그룹)",
      "소속 교회 표시 + 바로가기",
      "활성 그룹 선택/변경",
      "나의 통독 현황 (완료일/연속/진행률)",
      "프로필 수정",
      "내가 읽은 말씀",
      "내가 쓴 묵상",
      "내 그룹 목록",
      "통독 캘린더",
      "알림 설정 / 설정 / 로그아웃",
    ],
  });

  addScreenshot(slide, "mypageTop", 5.3, 0.9, 4.2, 4.4);
}

function createMypageFeaturesSlide(pptx) {
  const slide = pptx.addSlide();
  addBackground(slide, "light");
  addTitle(slide, "마이페이지 메뉴", { subtitle: "개인 활동 관리 기능", devBadge: true });

  addTable(slide, [
    ["메뉴", "기능"],
    ["프로필 수정", "이름, 프로필 이미지 변경"],
    ["내가 읽은 말씀", "통독 완료 기록 확인"],
    ["내가 쓴 묵상", "작성한 묵상 목록"],
    ["내 그룹", "참여 중인 그룹 목록"],
    ["통독 캘린더", "월별 통독 현황"],
    ["알림 설정", "알림 on/off 설정"],
    ["설정", "앱 환경 설정"],
  ], { x: 0.5, y: 1.4, w: 4.5, headerColor: DESIGN.colors.primary, colW: [1.5, 3] });

  addScreenshot(slide, "mypageBottom", 5.3, 0.9, 4.2, 4.4);
}

// === 하단 네비게이션 슬라이드 ===

function createBottomNavSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors, fonts, fontSize } = DESIGN;
  addBackground(slide, "light");
  addTitle(slide, "하단 네비게이션", { subtitle: "교회 페이지 메뉴 구성" });

  // 네비게이션 시각화
  slide.addShape("rect", { x: 0.5, y: 1.4, w: 6.5, h: 0.9, fill: { color: colors.light }, line: { color: colors.border, pt: 1 } });

  const navItems = [
    { name: "홈", icon: "🏠", active: false },
    { name: "성경", icon: "📖", active: false },
    { name: "나눔", icon: "💬", active: false },
    { name: "그룹", icon: "👥", active: false },
    { name: "마이", icon: "👤", active: true, dev: true },
  ];

  navItems.forEach((item, idx) => {
    const x = 0.7 + idx * 1.3;
    slide.addText(item.icon, { x, y: 1.5, w: 1, h: 0.4, fontSize: 18, fontFace: fonts.primary, color: item.active ? colors.primary : colors.muted, align: "center" });
    slide.addText(item.name + (item.dev ? "*" : ""), { x, y: 1.85, w: 1, h: 0.3, fontSize: 10, fontFace: fonts.primary, color: item.active ? colors.primary : colors.muted, align: "center" });
  });

  slide.addText("* 마이 메뉴 추가로 교회 페이지 하단 네비게이션 완료 예정", { x: 0.5, y: 2.5, w: 6.5, h: 0.3, fontSize: fontSize.small, fontFace: fonts.primary, color: colors.devInProgress });

  // 네비게이션 테이블
  addTable(slide, [
    ["탭", "이동 경로"],
    ["홈", "/church/{code}"],
    ["성경", "/church/{code}/bible"],
    ["나눔", "/church/{code}/sharing"],
    ["그룹", "/church/{code}/groups"],
    ["마이", "마이페이지 (개발 예정)"],
  ], { x: 0.5, y: 3.0, w: 6.5, headerColor: colors.primary, colW: [1, 5.5] });
}

// === 향후 개발 계획 슬라이드 ===

function createFuturePlanSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors, fonts, fontSize } = DESIGN;
  addBackground(slide, "light");
  addTitle(slide, "향후 개발 계획", { subtitle: "교회 페이지 추가 개발 예정 기능" });

  // Phase 26
  addCard(slide, {
    x: 0.4, y: 1.4, w: 4.5, h: 1.8,
    title: "Phase 26: 교회 시스템 보완",
    color: colors.accent,
    items: [
      "교회 공지사항 기능",
      "교회 통계 개선 (차트, 리포트)",
      "주간/월간 묵상 통계",
    ],
  });

  // Phase 27
  addCard(slide, {
    x: 5.1, y: 1.4, w: 4.5, h: 1.8,
    title: "Phase 27: 성능 최적화",
    color: colors.primary,
    items: [
      "이미지 최적화 (Next/Image)",
      "무한 스크롤 구현",
      "SWR 캐싱 적용",
    ],
  });

  // Phase 28
  addCard(slide, {
    x: 0.4, y: 3.4, w: 4.5, h: 1.4,
    title: "Phase 28: 알림 시스템 강화",
    color: colors.admin,
    items: [
      "웹 푸시 알림 (Web Push API)",
      "이메일 알림 (일일/주간 리포트)",
    ],
  });

  // 안내 박스
  slide.addShape("rect", { x: 5.1, y: 3.4, w: 4.5, h: 1.4, fill: { color: colors.primaryLight }, line: { color: colors.primary, pt: 1 } });
  slide.addText("지속적인 업데이트", { x: 5.2, y: 3.5, w: 4.3, h: 0.3, fontSize: fontSize.h3 - 2, fontFace: fonts.primary, color: colors.primary, bold: true });
  slide.addText("교회 페이지는 계속 개선되고 있습니다.\n새로운 기능이 추가되면 안내드리겠습니다.", { x: 5.2, y: 3.85, w: 4.3, h: 0.8, fontSize: fontSize.small, fontFace: fonts.primary, color: colors.text });
}

// === 체크리스트 슬라이드 ===

function createChecklistSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors, fonts, fontSize } = DESIGN;
  addBackground(slide, "light");
  addTitle(slide, "운영 체크리스트", { subtitle: "교회 페이지 운영을 위한 준비 사항" });

  addCard(slide, { x: 0.4, y: 1.4, w: 3, h: 2.0, title: "초기 설정", color: colors.primary, items: ["교회 정보 입력", "교회 코드 확인", "QR 코드 생성", "담당자 공유"] });
  addCard(slide, { x: 3.5, y: 1.4, w: 3, h: 2.0, title: "홍보", color: colors.accent, items: ["주보에 QR 삽입", "교인 안내 문자", "사용법 교육", "SNS 공유"] });
  addCard(slide, { x: 6.6, y: 1.4, w: 3, h: 2.0, title: "운영", color: colors.success, items: ["주간 참여 확인", "활발한 교인 격려", "그룹 진행 점검", "피드백 수집"] });

  slide.addShape("rect", { x: 0.4, y: 3.6, w: 9.2, h: 0.6, fill: { color: colors.primaryLight } });
  slide.addText("TIP: 매주 대시보드를 확인하고 활발한 참여자에게 감사 인사를 전해보세요!", { x: 0.5, y: 3.7, w: 9, h: 0.4, fontSize: fontSize.body, fontFace: fonts.primary, color: colors.primary });
}

// === FAQ 슬라이드 ===

function createFaqSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors, fonts, fontSize } = DESIGN;
  addBackground(slide, "light");
  addTitle(slide, "자주 묻는 질문", { subtitle: "FAQ" });

  const faqs = [
    { q: "교회 코드는 어떻게 만드나요?", a: "시스템 관리자에게 요청하여 생성합니다." },
    { q: "QR 코드를 변경하고 싶어요.", a: "관리자 설정에서 작성 권한 토큰을 재발급하세요." },
    { q: "교인 등록은 어떻게 하나요?", a: "회원가입 후 교회 페이지에서 '교회 등록' 클릭" },
    { q: "그룹은 몇 개까지 만들 수 있나요?", a: "제한 없이 필요한 만큼 생성 가능합니다." },
    { q: "비회원도 묵상을 볼 수 있나요?", a: "네, 보기는 가능하나 작성은 권한이 필요합니다." },
  ];

  faqs.forEach((faq, idx) => {
    slide.addShape("rect", { x: 0.5, y: 1.3 + idx * 0.7, w: 0.3, h: 0.3, fill: { color: colors.primary } });
    slide.addText("Q", { x: 0.5, y: 1.33 + idx * 0.7, w: 0.3, h: 0.24, fontSize: fontSize.small, fontFace: fonts.primary, color: colors.white, bold: true, align: "center" });
    slide.addText(faq.q, { x: 0.9, y: 1.3 + idx * 0.7, w: 8.5, h: 0.3, fontSize: fontSize.body, fontFace: fonts.primary, color: colors.dark, bold: true });
    slide.addText(faq.a, { x: 0.9, y: 1.55 + idx * 0.7, w: 8.5, h: 0.25, fontSize: fontSize.small, fontFace: fonts.primary, color: colors.muted });
  });
}

// === 마무리 슬라이드 ===

function createClosingSlide(pptx) {
  const slide = pptx.addSlide();
  const { colors, fonts, fontSize } = DESIGN;
  addBackground(slide, "primary");

  slide.addText("교회와 함께하는", { x: 0.5, y: 1.4, w: 9, h: 0.5, fontSize: 22, fontFace: fonts.primary, color: colors.primaryLight, align: "center" });
  slide.addText("365일 말씀 여정", { x: 0.5, y: 1.9, w: 9, h: 0.8, fontSize: 40, fontFace: fonts.primary, color: colors.white, bold: true, align: "center" });
  slide.addShape("rect", { x: 3.5, y: 2.8, w: 3, h: 0.03, fill: { color: colors.white, transparency: 50 } });

  const benefits = ["교인들의 묵상 참여 독려", "함께 성장하는 공동체", "말씀으로 하나되는 교회"];
  benefits.forEach((item, idx) => {
    slide.addText("• " + item, { x: 2, y: 3.1 + idx * 0.4, w: 6, h: 0.35, fontSize: 15, fontFace: fonts.primary, color: colors.white, align: "center" });
  });

  slide.addText("감사합니다!", { x: 0.5, y: 4.4, w: 9, h: 0.5, fontSize: 26, fontFace: fonts.primary, color: colors.white, bold: true, align: "center" });
  slide.addText("문의: 앱 관리자에게 연락해주세요", { x: 0.5, y: 5.0, w: 9, h: 0.3, fontSize: fontSize.small, fontFace: fonts.primary, color: colors.primaryLight, align: "center" });
}

// === MAIN ===

function createPresentation() {
  const pptx = new PptxGenJS();
  pptx.author = "리딩지저스";
  pptx.company = "Reading Jesus";
  pptx.subject = "교회 담당자를 위한 가이드";
  pptx.title = "리딩지저스 교회 페이지 가이드";
  pptx.layout = "LAYOUT_16x9";

  console.log("Creating slides...");

  // Part 1: 기본 기능
  createTitleSlide(pptx); console.log("  1. Title");
  createTocSlide(pptx); console.log("  2. TOC");
  createUrlSlide(pptx); console.log("  3. URL");
  createMainPageSlide(pptx); console.log("  4. Main page");
  createWriteFormSlide(pptx); console.log("  5. Write form");
  createCommentsSlide(pptx); console.log("  6. Comments");
  createNoAuthSlide(pptx); console.log("  7. No auth");
  createSharingPageSlide(pptx); console.log("  8. Sharing page");
  createQtPageSlide(pptx); console.log("  9. QT page");
  createQtWriteSlide(pptx); console.log("  10. QT write");
  createMemberRegSlide(pptx); console.log("  11. Member registration");

  // Part 2: 성경 읽기 (NEW)
  createBibleIntroSlide(pptx); console.log("  12. Bible intro");
  createBibleScheduleSlide(pptx); console.log("  13. Bible schedule");
  createBibleBooksSlide(pptx); console.log("  14. Bible books");
  createBibleReaderSlide(pptx); console.log("  15. Bible reader");
  createBibleCompleteSlide(pptx); console.log("  16. Bible complete");

  // Part 3: 소그룹 & 마이 (개발 중)
  createGroupsIntroSlide(pptx); console.log("  17. Groups intro");
  createGroupsPageSlide(pptx); console.log("  18. Groups page");
  createGroupCreateSlide(pptx); console.log("  19. Group create");
  createGroupDetailSlide(pptx); console.log("  20. Group detail");
  createMypageSlide(pptx); console.log("  21. Mypage (NEW)");
  createMypageFeaturesSlide(pptx); console.log("  22. Mypage features (NEW)");
  createBottomNavSlide(pptx); console.log("  23. Bottom nav");

  // 추가 정보
  createFuturePlanSlide(pptx); console.log("  24. Future plan (NEW)");
  createChecklistSlide(pptx); console.log("  25. Checklist");
  createFaqSlide(pptx); console.log("  26. FAQ");
  createClosingSlide(pptx); console.log("  27. Closing");

  return pptx;
}

async function main() {
  console.log("\n=== 리딩지저스 교회 페이지 가이드 PPT 생성 ===\n");
  console.log("업데이트 내용:");
  console.log("  - 성경 메뉴 슬라이드 5개 추가");
  console.log("  - 마이페이지 슬라이드 2개 추가");
  console.log("  - 그룹 기능 '개발 중' 표시");
  console.log("  - 향후 개발 계획 슬라이드 추가\n");

  const pptx = createPresentation();

  const outputPath = path.join(__dirname, "..", "docs", "리딩지저스_교회페이지_가이드_v2.pptx");

  console.log("\nSaving presentation...");
  await pptx.writeFile({ fileName: outputPath });

  console.log(`\n✅ Presentation saved to: ${outputPath}`);
  console.log("   Total slides: 27\n");
}

main().catch(console.error);
