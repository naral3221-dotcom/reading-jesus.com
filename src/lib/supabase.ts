/**
 * Supabase Client & Auth Helpers
 *
 * 브라우저에서 사용하는 Supabase 클라이언트와 인증 헬퍼를 제공합니다.
 * 이 파일이 Supabase 클라이언트의 단일 소스입니다.
 */

import { createBrowserClient } from '@supabase/ssr'

// 환경 변수에서 공백/줄바꿈 문자 제거
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// 싱글톤 인스턴스
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signInWithKakao = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};
