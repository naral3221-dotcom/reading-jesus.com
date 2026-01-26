import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 인앱 브라우저 감지
 * 카카오톡, 페이스북, 인스타그램, 네이버, 라인 등의 인앱 브라우저를 감지합니다.
 * Google OAuth는 이러한 WebView 기반 브라우저에서 차단됩니다.
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || ''

  // 인앱 브라우저 패턴들
  const inAppBrowserPatterns = [
    /KAKAOTALK/i,      // 카카오톡
    /NAVER/i,          // 네이버
    /Line/i,           // 라인
    /FBAN|FBAV/i,      // 페이스북
    /Instagram/i,      // 인스타그램
    /Twitter/i,        // 트위터
    /Snapchat/i,       // 스냅챗
    /WeChat|MicroMessenger/i,  // 위챗
    /Daum/i,           // 다음
    /SamsungBrowser.*Mobile VR/i,  // 삼성 VR 브라우저
  ]

  // WebView 일반 패턴 (wv는 Android WebView 표시)
  const webViewPatterns = [
    /\bwv\b/i,         // Android WebView
    /WebView/i,        // 일반 WebView
  ]

  // 인앱 브라우저 패턴 확인
  for (const pattern of inAppBrowserPatterns) {
    if (pattern.test(userAgent)) {
      return true
    }
  }

  // WebView 패턴 확인 (Chrome이 아닌 경우만)
  // 일부 정상 브라우저도 WebView를 포함할 수 있으므로 추가 체크
  for (const pattern of webViewPatterns) {
    if (pattern.test(userAgent)) {
      // Chrome 브라우저가 아닌 경우에만 인앱으로 판단
      const isChrome = /Chrome\/[\d.]+/.test(userAgent) && !/\bwv\b/.test(userAgent)
      if (!isChrome) {
        return true
      }
    }
  }

  return false
}

/**
 * 인앱 브라우저 이름 반환
 */
export function getInAppBrowserName(): string | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null
  }

  const userAgent = navigator.userAgent || ''

  if (/KAKAOTALK/i.test(userAgent)) return '카카오톡'
  if (/NAVER/i.test(userAgent)) return '네이버'
  if (/Line/i.test(userAgent)) return '라인'
  if (/FBAN|FBAV/i.test(userAgent)) return '페이스북'
  if (/Instagram/i.test(userAgent)) return '인스타그램'
  if (/Twitter/i.test(userAgent)) return '트위터'
  if (/WeChat|MicroMessenger/i.test(userAgent)) return '위챗'
  if (/Daum/i.test(userAgent)) return '다음'

  return '인앱 브라우저'
}

/**
 * 외부 브라우저로 열기 URL 생성 (Android Intent)
 * 안드로이드의 경우 intent:// 스킴을 사용하여 외부 브라우저로 열 수 있습니다.
 */
export function getExternalBrowserUrl(url: string): string {
  // iOS의 경우 복사 안내만 가능
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return url // iOS는 intent 지원하지 않음
  }

  // Android Intent URL
  return `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
}
