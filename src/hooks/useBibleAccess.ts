'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';

interface BibleAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  hasValidToken: boolean;
  checkAccess: () => Promise<void>;
}

interface UseBibleAccessOptions {
  churchCode?: string; // 교회 코드 (교회 페이지에서 사용 시)
}

/**
 * sessionStorage에서 교회 토큰 가져오기
 * 교회 메인 페이지에서 저장한 토큰을 읽어옴
 */
function getStoredToken(churchCode: string): { token: string | null; expiresAt: string | null } {
  if (typeof window === 'undefined') {
    return { token: null, expiresAt: null };
  }
  const token = sessionStorage.getItem(`church_token_${churchCode.toUpperCase()}`);
  const expiresAt = sessionStorage.getItem(`church_token_expires_${churchCode.toUpperCase()}`);
  return { token, expiresAt };
}

/**
 * 성경 접근 권한 확인 훅
 * 저작권 보호를 위해 로그인하거나 QR 토큰이 있어야 성경을 볼 수 있음
 *
 * 접근 허용 조건:
 * 1. 로그인한 사용자
 * 2. 유효한 QR 토큰이 있는 경우 (교회 페이지 - URL 또는 sessionStorage)
 */
export function useBibleAccess(options?: UseBibleAccessOptions): BibleAccessResult {
  const searchParams = useSearchParams();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  // 초기 로드가 완료되었는지 추적 (재검사 시 로딩 UI 방지)
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const tokenFromUrl = searchParams.get('token');
  const churchCode = options?.churchCode;

  const checkAccess = useCallback(async () => {
    // 초기 로드가 완료된 후에는 로딩 상태를 true로 설정하지 않음 (UI 깜빡임 방지)
    if (!initialLoadDone) {
      setIsLoading(true);
    }
    const supabase = getSupabaseBrowserClient();

    try {
      // 1. 로그인 확인
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(false);

      // 2. QR 토큰 확인 (교회 페이지인 경우)
      if (churchCode) {
        // URL 토큰 또는 sessionStorage 토큰 사용
        const storedTokenInfo = getStoredToken(churchCode);
        const effectiveToken = tokenFromUrl || storedTokenInfo.token;

        if (effectiveToken) {
          // sessionStorage에 만료 정보가 있으면 먼저 체크 (DB 호출 없이)
          if (!tokenFromUrl && storedTokenInfo.token && storedTokenInfo.expiresAt) {
            const expiresAt = new Date(storedTokenInfo.expiresAt);
            if (expiresAt > new Date()) {
              setHasValidToken(true);
              setHasAccess(true);
              setIsLoading(false);
              return;
            } else {
              // 만료된 토큰 삭제
              sessionStorage.removeItem(`church_token_${churchCode.toUpperCase()}`);
              sessionStorage.removeItem(`church_token_expires_${churchCode.toUpperCase()}`);
            }
          } else if (!tokenFromUrl && storedTokenInfo.token && !storedTokenInfo.expiresAt) {
            // 만료일 없는 토큰 (무제한)
            setHasValidToken(true);
            setHasAccess(true);
            setIsLoading(false);
            return;
          }

          // URL 토큰이 있는 경우에만 DB 검증 (sessionStorage는 이미 검증됨)
          if (tokenFromUrl) {
            // 교회 정보 및 토큰 검증
            const { data: churchData } = await supabase
              .from('churches')
              .select('write_token, token_expires_at, is_active')
              .eq('code', churchCode.toUpperCase())
              .eq('is_active', true)
              .single();

            if (churchData) {
              const dbToken = churchData.write_token?.toLowerCase().trim();
              const urlToken = tokenFromUrl?.toLowerCase().trim();

              if (dbToken && urlToken && dbToken === urlToken) {
                // 토큰 만료 확인
                if (churchData.token_expires_at) {
                  const expiresAt = new Date(churchData.token_expires_at);
                  if (expiresAt > new Date()) {
                    setHasValidToken(true);
                    setHasAccess(true);
                    setIsLoading(false);
                    return;
                  }
                } else {
                  // 만료일이 없으면 유효
                  setHasValidToken(true);
                  setHasAccess(true);
                  setIsLoading(false);
                  return;
                }
              }
            }
          }
        }
      }

      // 접근 불가
      setHasAccess(false);
    } catch (err) {
      console.error('접근 권한 확인 에러:', err);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
      setInitialLoadDone(true);
    }
  }, [churchCode, tokenFromUrl, initialLoadDone]);

  useEffect(() => {
    checkAccess();

    // 인증 상태 변경 감지
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAccess]);

  return {
    hasAccess,
    isLoading,
    isLoggedIn,
    hasValidToken,
    checkAccess,
  };
}
