const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const WIDTH = 1200;
const HEIGHT = 630;

async function generateOgImage() {
  const logoPath = path.join(__dirname, '../public/logo.png');
  const outputPath = path.join(__dirname, '../public/og-image.png');

  // 로고 이미지 로드 및 리사이즈
  const logo = await sharp(logoPath)
    .resize(400, 400, { fit: 'inside' })
    .toBuffer();

  // 배경 SVG 생성 (올리브 그린 그라데이션)
  const backgroundSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f0fdf4;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#fef3c7;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>

      <!-- 상단 장식 -->
      <rect x="0" y="0" width="${WIDTH}" height="8" fill="#4a5568"/>

      <!-- 하단 텍스트 영역 배경 -->
      <rect x="0" y="${HEIGHT - 120}" width="${WIDTH}" height="120" fill="#f8fafc" opacity="0.9"/>

      <!-- 서비스 설명 텍스트 -->
      <text x="${WIDTH / 2}" y="${HEIGHT - 70}"
            font-family="Arial, sans-serif"
            font-size="32"
            font-weight="bold"
            fill="#1e293b"
            text-anchor="middle">
        365일 성경 통독 묵상 앱
      </text>

      <text x="${WIDTH / 2}" y="${HEIGHT - 30}"
            font-family="Arial, sans-serif"
            font-size="20"
            fill="#64748b"
            text-anchor="middle">
        매일 말씀을 읽고, 묵상하고, 함께 나누세요
      </text>
    </svg>
  `;

  // 배경 생성
  const background = await sharp(Buffer.from(backgroundSvg)).png().toBuffer();

  // 로고와 배경 합성
  const logoMetadata = await sharp(logo).metadata();
  const logoX = Math.round((WIDTH - logoMetadata.width) / 2);
  const logoY = Math.round((HEIGHT - 120 - logoMetadata.height) / 2);

  await sharp(background)
    .composite([
      {
        input: logo,
        left: logoX,
        top: logoY,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`✅ OG 이미지 생성 완료: ${outputPath}`);
  console.log(`   크기: ${WIDTH}x${HEIGHT}px`);
}

generateOgImage().catch(console.error);
