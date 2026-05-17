import type { Metadata } from 'next'
import { SITE_URL, getSiteUrl } from '@/lib/site'

type DmvMetadataInput = {
  title: string
  description: string
  path: string
  keywords?: string[]
}

type FaqItem = {
  question: string
  answer: string
}

type BreadcrumbItem = {
  name: string
  path: string
}

export function buildDmvMetadata({ title, description, path, keywords }: DmvMetadataInput): Metadata {
  const canonical = getSiteUrl(path)

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OpenAA',
      locale: 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function buildWebPageSchema({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: getSiteUrl(path),
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: 'OpenAA',
      url: getSiteUrl('/'),
    },
  }
}

export function buildFaqSchema(faqItems: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getSiteUrl(item.path),
    })),
  }
}
