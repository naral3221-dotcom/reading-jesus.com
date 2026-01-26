import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service Role Key를 사용하는 Supabase Admin 클라이언트
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

export async function POST(request: NextRequest) {
  try {
    const { adminId, newPassword, churchId } = await request.json();

    // 입력값 검증
    if (!adminId || !newPassword || !churchId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 비밀번호 유효성 검사
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. 해당 관리자가 해당 교회의 관리자인지 확인
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('church_admins')
      .select('id, church_id')
      .eq('id', adminId)
      .eq('church_id', churchId)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: '관리자 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 2. Supabase Auth에서 비밀번호 변경
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      adminId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다' },
        { status: 500 }
      );
    }

    // 3. church_admins에 변경 시간 기록
    const { error: recordError } = await supabaseAdmin
      .from('church_admins')
      .update({ password_changed_at: new Date().toISOString() })
      .eq('id', adminId);

    if (recordError) {
      console.error('Record update error:', recordError);
      // 비밀번호는 변경됨, 기록 실패는 무시
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 변경되었습니다'
    });
  } catch (err) {
    console.error('API error:', err);
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
