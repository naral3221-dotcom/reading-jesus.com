/**
 * QR 코드 생성 유틸리티
 *
 * 통독 일정별 QR 코드를 1080x1080 이미지로 생성합니다.
 */

import QRCode from 'qrcode';

export interface QRGeneratorOptions {
  /** QR 코드가 가리킬 URL */
  url: string;
  /** 성경 읽기 범위 (예: "창 1-4") */
  reading: string;
  /** 날짜 문자열 (예: "2026-01-12") */
  date: string;
  /** 이미지 크기 (기본값: 1080) */
  size?: number;
  /** 교회 이름 (선택적) */
  churchName?: string;
}

export interface BatchQROptions {
  /** 교회 코드 */
  churchCode: string;
  /** 작성 토큰 */
  writeToken: string;
  /** 일정 목록 */
  schedules: Array<{
    date: string;
    reading: string;
  }>;
  /** 교회 이름 */
  churchName?: string;
  /** 기본 URL */
  baseUrl: string;
}

/**
 * 심플 네모 QR 코드 이미지 생성
 * QR 코드 + 아래에 구절/날짜만
 */
export async function generateQRImage(options: QRGeneratorOptions): Promise<string> {
  const { url, reading, date, size = 1080 } = options;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const scaleFactor = size / 1080;

  // 흰색 배경
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // QR 코드 생성
  const qrSize = size * 0.65;
  const qrX = (size - qrSize) / 2;
  const qrY = size * 0.08;

  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, url, {
    width: qrSize,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  // 검은 테두리
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4 * scaleFactor;
  ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

  // QR 코드 그리기
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // 하단 텍스트 영역
  const textY = qrY + qrSize + 80 * scaleFactor;

  // 구절 텍스트
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${64 * scaleFactor}px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(reading, size / 2, textY);

  // 날짜 텍스트
  const formattedDate = `${new Date(date).getMonth() + 1}월 ${new Date(date).getDate()}일`;
  ctx.fillStyle = '#666666';
  ctx.font = `${48 * scaleFactor}px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.fillText(formattedDate, size / 2, textY + 70 * scaleFactor);

  return canvas.toDataURL('image/png');
}

/**
 * 하트 프레임 + QR 코드 이미지 생성
 * QR 코드는 완전한 사각형으로 유지하여 스캔 가능
 * 하트 프레임이 QR 코드를 감싸는 디자인
 */
export interface HeartQROptions {
  /** QR 코드가 가리킬 URL */
  url: string;
  /** 성경 읽기 범위 (예: "창 1-4") */
  reading: string;
  /** 날짜 문자열 (예: "2026-01-12") */
  date: string;
  /** 이미지 크기 (기본값: 1080) */
  size?: number;
  /** 하트 색상 (기본값: 빨간색) */
  heartColor?: string;
}

export async function generateHeartQRImage(options: HeartQROptions): Promise<string> {
  const { url, reading, date, size = 1080, heartColor = '#E53935' } = options;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const scaleFactor = size / 1080;

  // 흰색 배경
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // 상단 텍스트 (구절 + 날짜)
  const formattedDate = `${new Date(date).getMonth() + 1}월 ${new Date(date).getDate()}일`;

  // 구절 텍스트
  ctx.fillStyle = '#333333';
  ctx.font = `bold ${56 * scaleFactor}px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(reading, size / 2, 70 * scaleFactor);

  // 날짜 텍스트
  ctx.fillStyle = '#888888';
  ctx.font = `${40 * scaleFactor}px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.fillText(formattedDate, size / 2, 125 * scaleFactor);

  // 하트 프레임 중심 위치
  const centerX = size / 2;
  const centerY = size * 0.58;
  const heartSize = size * 0.75;

  // 하트 프레임 그리기 (외곽선만)
  ctx.strokeStyle = heartColor;
  ctx.lineWidth = 8 * scaleFactor;
  drawSlimHeart(ctx, centerX, centerY, heartSize);
  ctx.stroke();

  // QR 코드 생성 (하트 안에 들어갈 크기)
  const qrSize = size * 0.48;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, url, {
    width: qrSize,
    margin: 2,
    color: {
      dark: heartColor,
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  // QR 코드를 하트 중앙에 배치
  const qrX = (size - qrSize) / 2;
  const qrY = centerY - qrSize * 0.45;
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  return canvas.toDataURL('image/png');
}

/**
 * 날렵한 하트 모양 (이미지 예시처럼)
 */
function drawSlimHeart(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number
) {
  const width = size * 0.95;
  const height = size;

  ctx.beginPath();

  // 하트 아래 뾰족한 점
  ctx.moveTo(centerX, centerY + height * 0.45);

  // 왼쪽 곡선 (더 날렵하게)
  ctx.bezierCurveTo(
    centerX - width * 0.55, centerY + height * 0.15,
    centerX - width * 0.55, centerY - height * 0.25,
    centerX - width * 0.28, centerY - height * 0.38
  );

  // 왼쪽 위 둥근 부분
  ctx.bezierCurveTo(
    centerX - width * 0.08, centerY - height * 0.48,
    centerX, centerY - height * 0.38,
    centerX, centerY - height * 0.18
  );

  // 오른쪽 위 둥근 부분
  ctx.bezierCurveTo(
    centerX, centerY - height * 0.38,
    centerX + width * 0.08, centerY - height * 0.48,
    centerX + width * 0.28, centerY - height * 0.38
  );

  // 오른쪽 곡선
  ctx.bezierCurveTo(
    centerX + width * 0.55, centerY - height * 0.25,
    centerX + width * 0.55, centerY + height * 0.15,
    centerX, centerY + height * 0.45
  );

  ctx.closePath();
}

/**
 * QR 코드 이미지를 다운로드
 */
export function downloadQRImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 네모 QR 코드 일괄 다운로드
 */
export async function downloadQRBatch(
  options: BatchQROptions,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const { churchCode, writeToken, schedules, baseUrl } = options;

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const total = schedules.length;
  let current = 0;

  for (const schedule of schedules) {
    if (!schedule.reading) continue;

    const url = `${baseUrl}/church/${churchCode}?token=${writeToken}&date=${schedule.date}`;
    const dataUrl = await generateQRImage({
      url,
      reading: schedule.reading,
      date: schedule.date,
    });

    const base64Data = dataUrl.split(',')[1];
    const safeReading = schedule.reading.replace(/[\/\\:*?"<>|]/g, '-');
    const filename = `QR_${schedule.date}_${safeReading}.png`;

    zip.file(filename, base64Data, { base64: true });

    current++;
    onProgress?.(current, total);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${churchCode}_QR코드_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 하트 QR 코드 일괄 다운로드
 */
export async function downloadHeartQRBatch(
  options: BatchQROptions,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const { churchCode, writeToken, schedules, baseUrl } = options;

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const total = schedules.length;
  let current = 0;

  for (const schedule of schedules) {
    if (!schedule.reading) continue;

    const url = `${baseUrl}/church/${churchCode}?token=${writeToken}&date=${schedule.date}`;
    const dataUrl = await generateHeartQRImage({
      url,
      reading: schedule.reading,
      date: schedule.date,
    });

    const base64Data = dataUrl.split(',')[1];
    const safeReading = schedule.reading.replace(/[\/\\:*?"<>|]/g, '-');
    const filename = `하트QR_${schedule.date}_${safeReading}.png`;

    zip.file(filename, base64Data, { base64: true });

    current++;
    onProgress?.(current, total);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${churchCode}_하트QR_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
