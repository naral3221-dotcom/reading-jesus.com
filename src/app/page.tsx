import { redirect } from 'next/navigation';

export default function RootPage() {
  // 모든 사용자를 /home으로 리다이렉트
  // /home에서 로그인 여부에 따라 적절한 UI를 보여줌
  redirect('/home');
}
