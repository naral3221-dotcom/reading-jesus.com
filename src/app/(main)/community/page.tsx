import { redirect } from 'next/navigation';

/**
 * /community 페이지는 /home으로 리다이렉트
 * 커뮤니티 기능이 홈 피드로 통합되었습니다.
 */
export default function CommunityPage() {
  redirect('/home');
}
