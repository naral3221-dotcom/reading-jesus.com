import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "@/presentation/providers/QueryProvider";
import { OrganizationJsonLd, WebAppJsonLd } from "@/components/seo/JsonLd";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://reading-jesus.com'),
  title: {
    default: 'Reading Jesus - 리딩지저스 | 365일 성경 통독 묵상',
    template: '%s | 리딩지저스',
  },
  description: '매일 말씀을 읽고, 묵상하고, 함께 나누세요. 365일 성경 통독 묵상 앱으로 전국의 성도들과 함께합니다.',
  keywords: ['성경통독', '성경읽기', 'QT', '묵상', '성경앱', '기독교', '교회', '소그룹', '365일통독', '큐티'],
  authors: [{ name: '리딩지저스' }],
  creator: 'Reading Jesus',
  publisher: 'Reading Jesus',

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: '리딩지저스',
    title: 'Reading Jesus - 365일 성경 통독 묵상',
    description: '매일 말씀을 읽고, 묵상하고, 함께 나누세요. 전국의 성도들과 함께하는 365일 성경 통독.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '리딩지저스 - 365일 성경 통독 묵상',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Reading Jesus - 365일 성경 통독 묵상',
    description: '매일 말씀을 읽고, 묵상하고, 함께 나누세요.',
    images: ['/og-image.png'],
  },

  // 검색엔진 설정
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // 검색엔진 인증 (나중에 실제 코드로 교체)
  verification: {
    google: 'GOOGLE_VERIFICATION_CODE',
    other: {
      'naver-site-verification': 'NAVER_VERIFICATION_CODE',
    },
  },

  // 기존 설정 유지
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '리딩지저스',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#151a23' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <WebAppJsonLd />
        {/* 테마 깜빡임 방지 - 초기 테마 적용 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('reading-jesus-theme') || 'system';
                  var validThemes = ['light', 'dark', 'beige', 'sepia'];
                  var resolvedTheme = theme;

                  if (theme === 'system') {
                    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }

                  if (validThemes.includes(resolvedTheme)) {
                    document.documentElement.classList.add(resolvedTheme);
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
        {/* 글꼴 크기 초기화 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var fontSizeKey = 'reading-jesus-font-size';
                  var fontScales = { xs: 0.85, sm: 0.92, base: 1, lg: 1.1, xl: 1.2 };
                  var saved = localStorage.getItem(fontSizeKey) || 'base';
                  var scale = fontScales[saved] || 1;
                  document.documentElement.style.setProperty('--font-scale', scale);
                  document.documentElement.setAttribute('data-font-size', saved);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
