import { Metadata } from 'next';
import GuestLayoutClient from './GuestLayoutClient';

export const metadata: Metadata = {
  title: '성경 미리보기',
  description: '365일 성경 통독 계획을 미리 확인하세요. 로그인 없이 성경 읽기 계획과 QT 묵상 가이드를 체험해보세요.',
  openGraph: {
    title: '성경 미리보기 | 리딩지저스',
    description: '365일 성경 통독 계획을 미리 확인하세요.',
  },
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestLayoutClient>{children}</GuestLayoutClient>;
}
