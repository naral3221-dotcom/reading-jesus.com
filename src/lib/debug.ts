/**
 * 디버깅 유틸리티
 */

import { supabase } from './supabase';

export async function checkAuth() {
  console.group('🔍 인증 상태 확인');

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ 세션 에러:', sessionError);
      return { isAuthenticated: false, error: sessionError };
    }

    if (!session) {
      console.warn('⚠️  세션 없음 - 로그인 필요');
      return { isAuthenticated: false, user: null };
    }

    console.log('✅ 세션 존재:', {
      user_id: session.user.id,
      email: session.user.email,
      expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('❌ 유저 정보 에러:', userError);
      return { isAuthenticated: false, error: userError };
    }

    if (!user) {
      console.warn('⚠️  유저 정보 없음');
      return { isAuthenticated: false, user: null };
    }

    console.log('✅ 유저 정보:', {
      id: user.id,
      email: user.email,
      created_at: new Date(user.created_at).toLocaleString(),
    });

    console.groupEnd();
    return { isAuthenticated: true, user, session };

  } catch (error) {
    console.error('❌ 예외 발생:', error);
    console.groupEnd();
    return { isAuthenticated: false, error };
  }
}

export async function checkSupabaseConnection() {
  console.group('🔍 Supabase 연결 확인');

  try {
    // 간단한 쿼리로 연결 테스트
    const { error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      console.error('❌ Supabase 연결 에러:', error);
      console.groupEnd();
      return { connected: false, error };
    }

    console.log('✅ Supabase 연결 성공');
    console.groupEnd();
    return { connected: true };

  } catch (error) {
    console.error('❌ 예외 발생:', error);
    console.groupEnd();
    return { connected: false, error };
  }
}

export async function testCommentInsert(groupId: string, dayNumber: number) {
  console.group('🔍 댓글 등록 테스트');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ 인증 실패:', authError);
      console.groupEnd();
      return { success: false, error: authError };
    }

    console.log('✅ 유저 확인:', user.id);

    const testComment = {
      user_id: user.id,
      group_id: groupId,
      day_number: dayNumber,
      content: '[테스트] 댓글 등록 테스트',
      is_anonymous: false,
    };

    console.log('📝 등록할 데이터:', testComment);

    const { data, error } = await supabase
      .from('comments')
      .insert(testComment)
      .select()
      .single();

    if (error) {
      console.error('❌ 등록 실패:', error);
      console.error('에러 상세:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      console.groupEnd();
      return { success: false, error };
    }

    console.log('✅ 등록 성공:', data);

    // 테스트 댓글 삭제
    await supabase.from('comments').delete().eq('id', data.id);
    console.log('🗑️  테스트 댓글 삭제됨');

    console.groupEnd();
    return { success: true, data };

  } catch (error) {
    console.error('❌ 예외 발생:', error);
    console.groupEnd();
    return { success: false, error };
  }
}

// 전역에서 사용 가능하도록 설정
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).debugSupabase = {
    checkAuth,
    checkSupabaseConnection,
    testCommentInsert,
  };

  console.log('💡 디버깅 도구 사용법:');
  console.log('  - window.debugSupabase.checkAuth()');
  console.log('  - window.debugSupabase.checkSupabaseConnection()');
  console.log('  - window.debugSupabase.testCommentInsert(groupId, dayNumber)');
}
