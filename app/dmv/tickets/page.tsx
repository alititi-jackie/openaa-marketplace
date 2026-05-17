import type { Metadata } from 'next'
import AppTopSection from '@/components/AppTopSection'
import BackToTopButton from '@/components/BackToTopButton'
import TicketsClient from './TicketsClient'
import { buildBreadcrumbSchema, buildDmvMetadata, buildFaqSchema, buildWebPageSchema } from '@/lib/seo'

const PAGE_TITLE = '纽约罚单查询指南 | 停车罚单・超速罚单・红灯罚单查询 - OpenAA'
const PAGE_DESCRIPTION =
  '提供纽约停车罚单、超速罚单、红灯摄像头罚单查询教程与官方入口，帮助纽约华人快速查询和处理 DMV 相关罚单。'

export const metadata: Metadata = buildDmvMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: '/dmv/tickets',
})

const faqItems = [
  {
    question: '纽约 DMV Permit 要多少题及格？',
    answer: '纽约 DMV Permit 笔试共 20 题，至少答对 14 题，且交通标志题至少答对 2 题。',
  },
  {
    question: '纽约 DMV 可以考中文吗？',
    answer: '可以，纽约 DMV Permit 笔试支持简体中文。',
  },
  {
    question: '纽约 Permit 通过后多久能预约路考？',
    answer: '通过 Permit 后需先满足练车要求，再预约 Road Test。',
  },
]

const webPageJsonLd = buildWebPageSchema({
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: '/dmv/tickets',
})
const faqJsonLd = buildFaqSchema(faqItems)
const breadcrumbJsonLd = buildBreadcrumbSchema([
  { name: '首页', path: '/' },
  { name: 'DMV', path: '/dmv' },
  { name: '罚单查询', path: '/dmv/tickets' },
])

export default function DMVTicketsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AppTopSection bannerPosition="dmv" />
      <TicketsClient />
      <BackToTopButton />
    </div>
  )
}
