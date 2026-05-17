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
    question: '纽约停车罚单怎么查询？',
    answer:
      '纽约市停车罚单可通过 NYC Finance CityPay 查询，支持按罚单号（Ticket Number）或车牌号（Plate Number）查找与缴费。',
  },
  {
    question: '红灯/超速摄像头罚单在哪里查？',
    answer:
      '纽约市红灯与超速摄像头罚单也可在 NYC Finance CityPay 入口查询和处理，进入后按提示选择对应票种。',
  },
  {
    question: '交通违规（Moving Violation）应该去哪里处理？',
    answer:
      '涉及交通违规（如闯红灯、超速等出庭类罚单）通常通过 NY DMV TVB 系统处理，具体以罚单上的法院或 TVB 指引为准。',
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
