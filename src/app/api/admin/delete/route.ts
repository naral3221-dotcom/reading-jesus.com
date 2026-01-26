import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service Role Key를 사용하는 Supabase Admin 클라이언트
// RLS를 우회하여 관리자 작업 수행
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// 허용된 테이블 목록 (보안)
const ALLOWED_TABLES = [
  'profiles',
  'groups',
  'group_members',
  'group_notices',
  'group_meetings',
  'comments',
  'comment_replies',
  'comment_likes',
  'churches',
  'guest_comments',
  'notifications',
  'notification_settings',
  'daily_checks',
  'personal_daily_checks',
  'personal_reading_projects',
  'qt_posts',
  'draft_posts',
  'member_ranks',
  'reports',
  'audit_logs',
  'system_settings',
];

export async function POST(request: NextRequest) {
  try {
    const { table, id } = await request.json();

    // 입력값 검증
    if (!table || !id) {
      return NextResponse.json(
        { error: '테이블명과 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 허용된 테이블인지 확인
    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: '허용되지 않은 테이블입니다' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 그룹 삭제 시 연관 데이터 먼저 삭제
    if (table === 'groups') {
      // 1. 그룹 관련 댓글의 좋아요 삭제
      const { data: comments } = await supabaseAdmin
        .from('comments')
        .select('id')
        .eq('group_id', id);

      if (comments && comments.length > 0) {
        const commentIds = comments.map((c) => c.id);
        await supabaseAdmin
          .from('comment_likes')
          .delete()
          .in('comment_id', commentIds);

        // 댓글 답글 삭제
        await supabaseAdmin
          .from('comment_replies')
          .delete()
          .in('comment_id', commentIds);
      }

      // 2. 그룹 관련 댓글 삭제
      await supabaseAdmin.from('comments').delete().eq('group_id', id);

      // 3. 그룹 공지사항 삭제
      await supabaseAdmin.from('group_notices').delete().eq('group_id', id);

      // 4. 그룹 모임 삭제
      await supabaseAdmin.from('group_meetings').delete().eq('group_id', id);

      // 5. 그룹 일일 체크 삭제
      await supabaseAdmin.from('daily_checks').delete().eq('group_id', id);

      // 6. 그룹 멤버 삭제
      await supabaseAdmin.from('group_members').delete().eq('group_id', id);
    }

    // 프로필 삭제 시 연관 데이터 먼저 삭제
    if (table === 'profiles') {
      // 사용자 관련 데이터 삭제
      await supabaseAdmin.from('group_members').delete().eq('user_id', id);
      await supabaseAdmin.from('comments').delete().eq('user_id', id);
      await supabaseAdmin.from('comment_likes').delete().eq('user_id', id);
      await supabaseAdmin.from('daily_checks').delete().eq('user_id', id);
      await supabaseAdmin.from('notifications').delete().eq('user_id', id);
    }

    // 실제 삭제 실행
    const { data, error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '해당 데이터를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (err) {
    console.error('API error:', err);
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
