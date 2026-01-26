import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/home';

  if (code) {
    const cookieStore = cookies();

    const response = NextResponse.redirect(new URL(next, request.url));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    // 세션이 있으면 프로필 확인 및 생성
    if (session?.user && !error) {
      const user = session.user;

      // 프로필 존재 여부 확인
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // 프로필이 없으면 소셜 로그인 정보로 생성
      if (!existingProfile) {
        // 소셜 로그인 정보에서 닉네임과 아바타 추출
        const userMetadata = user.user_metadata || {};
        const provider = user.app_metadata?.provider;

        let nickname = '';
        let avatarUrl = '';

        if (provider === 'kakao') {
          // 카카오 프로필 정보
          nickname = userMetadata.name || userMetadata.preferred_username || '';
          avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';
        } else if (provider === 'google') {
          // 구글 프로필 정보
          nickname = userMetadata.full_name || userMetadata.name || '';
          avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';
        }

        // 닉네임 기본값
        if (!nickname) {
          nickname = user.email?.split('@')[0] || '사용자';
        }

        // 프로필 생성
        await supabase.from('profiles').insert({
          id: user.id,
          nickname,
          avatar_url: avatarUrl,
          email: user.email,
          has_completed_onboarding: false,
        });
      } else {
        // 기존 프로필이 있지만 아바타가 없는 경우 소셜 아바타로 업데이트
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, nickname')
          .eq('id', user.id)
          .single();

        if (profile && !profile.avatar_url) {
          const userMetadata = user.user_metadata || {};
          const avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';

          if (avatarUrl) {
            await supabase
              .from('profiles')
              .update({ avatar_url: avatarUrl })
              .eq('id', user.id);
          }
        }
      }
    }

    return response;
  }

  // code가 없으면 홈으로 리다이렉트
  return NextResponse.redirect(new URL('/home', request.url));
}
