import { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reading-jesus.com'

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/preview`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  // 동적 교회 페이지 (활성화된 교회만)
  let churchPages: MetadataRoute.Sitemap = []

  try {
    const supabase = createSupabaseServerClient()
    const { data: churches } = await supabase
      .from('churches')
      .select('code, updated_at')
      .eq('is_active', true)

    if (churches) {
      churchPages = churches.map((church) => ({
        url: `${baseUrl}/church/${church.code.toLowerCase()}`,
        lastModified: new Date(church.updated_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch churches for sitemap:', error)
  }

  return [...staticPages, ...churchPages]
}
