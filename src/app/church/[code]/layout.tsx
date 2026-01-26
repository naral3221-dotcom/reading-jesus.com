import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface Props {
  params: Promise<{ code: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;

  try {
    const supabase = createSupabaseServerClient();
    const { data: church } = await supabase
      .from('churches')
      .select('name, denomination, address')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!church) {
      return {
        title: '교회를 찾을 수 없습니다',
        description: '유효하지 않은 교회 코드입니다.',
      };
    }

    const title = `${church.name} - 묵상 나눔`;
    const description = church.denomination
      ? `${church.name}(${church.denomination})의 성경 묵상 나눔 페이지입니다. 함께 말씀을 읽고 묵상을 나눠보세요.`
      : `${church.name}의 성경 묵상 나눔 페이지입니다. 함께 말씀을 읽고 묵상을 나눠보세요.`;

    return {
      title,
      description,
      openGraph: {
        title: `${church.name} | 리딩지저스`,
        description,
        type: 'website',
        images: ['/og-image.png'],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${church.name} | 리딩지저스`,
        description,
        images: ['/og-image.png'],
      },
    };
  } catch {
    return {
      title: '교회 묵상 나눔',
      description: '리딩지저스에서 함께 말씀을 읽고 묵상을 나눠보세요.',
    };
  }
}

export default function ChurchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
