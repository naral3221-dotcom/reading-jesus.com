interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Organization 스키마 - 리딩지저스 조직 정보
export function OrganizationJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reading-jesus.com'

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '리딩지저스',
    alternateName: 'Reading Jesus',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: '365일 성경 통독 묵상 앱. 매일 말씀을 읽고, 묵상하고, 함께 나누세요.',
    foundingDate: '2024',
    sameAs: [],
  }

  return <JsonLd data={data} />
}

// WebApplication 스키마 - 앱 정보
export function WebAppJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reading-jesus.com'

  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '리딩지저스',
    alternateName: 'Reading Jesus',
    url: baseUrl,
    applicationCategory: 'ReligiousApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    featureList: [
      '365일 성경 통독 계획',
      'QT 묵상 가이드',
      '묵상 나눔 커뮤니티',
      '교회별 소그룹 관리',
      '읽기 진도 추적',
    ],
  }

  return <JsonLd data={data} />
}

// Church 스키마 - 교회 페이지용
interface ChurchJsonLdProps {
  church: {
    name: string
    address?: string | null
    denomination?: string | null
    description?: string | null
  }
}

export function ChurchJsonLd({ church }: ChurchJsonLdProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: church.name,
  }

  if (church.address) {
    data.address = {
      '@type': 'PostalAddress',
      streetAddress: church.address,
      addressCountry: 'KR',
    }
  }

  if (church.denomination) {
    data.parentOrganization = {
      '@type': 'Organization',
      name: church.denomination,
    }
  }

  if (church.description) {
    data.description = church.description
  }

  return <JsonLd data={data} />
}

// BreadcrumbList 스키마 - 브레드크럼 네비게이션용
interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}
