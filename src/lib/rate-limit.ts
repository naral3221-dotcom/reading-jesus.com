/**
 * 클라이언트 측 Rate Limiting 유틸리티
 * 스팸 방지를 위한 간단한 제한 (완벽한 보안은 아님)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * Rate Limit 체크
 * @param key - 제한 키 (예: 'comment_submit', 'like_click')
 * @param maxRequests - 허용 최대 요청 수
 * @param windowMs - 시간 윈도우 (밀리초)
 * @returns { allowed: boolean, remainingRequests: number, resetIn: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1분
): { allowed: boolean; remainingRequests: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // 기존 엔트리가 없거나 리셋 시간이 지남
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetIn: windowMs,
    };
  }

  // 제한 초과
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetIn: entry.resetAt - now,
    };
  }

  // 카운트 증가
  entry.count++;
  return {
    allowed: true,
    remainingRequests: maxRequests - entry.count,
    resetIn: entry.resetAt - now,
  };
}

/**
 * 묵상 작성 제한 (1분에 3회)
 */
export function checkCommentRateLimit(deviceId: string): { allowed: boolean; message?: string } {
  const result = checkRateLimit(`comment_${deviceId}`, 3, 60000);

  if (!result.allowed) {
    const seconds = Math.ceil(result.resetIn / 1000);
    return {
      allowed: false,
      message: `너무 빠르게 작성하고 있습니다. ${seconds}초 후에 다시 시도해주세요.`,
    };
  }

  return { allowed: true };
}

/**
 * 좋아요 제한 (1분에 30회)
 */
export function checkLikeRateLimit(deviceId: string): { allowed: boolean; message?: string } {
  const result = checkRateLimit(`like_${deviceId}`, 30, 60000);

  if (!result.allowed) {
    return {
      allowed: false,
      message: '좋아요를 너무 빠르게 누르고 있습니다.',
    };
  }

  return { allowed: true };
}

/**
 * API 호출 제한 (1분에 60회)
 */
export function checkApiRateLimit(deviceId: string): { allowed: boolean; message?: string } {
  const result = checkRateLimit(`api_${deviceId}`, 60, 60000);

  if (!result.allowed) {
    return {
      allowed: false,
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    };
  }

  return { allowed: true };
}
