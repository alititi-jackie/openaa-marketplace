import type { Metadata } from 'next'
import { buildDmvMetadata } from '@/lib/seo'

export const metadata: Metadata = buildDmvMetadata({
  title: '2026纽约 DMV 中文驾照指南 | Permit笔试模拟・罚单查询・驾照流程 - OpenAA',
  description:
    '提供纽约州 NY DMV 中文驾照学习服务，包括 Permit 笔试模拟考试、交通标志练习、纽约 DMV 流程教程、罚单查询、新手考驾照指南等。适合纽约华人、新移民、留学生免费使用。',
  path: '/dmv',
  keywords: ['纽约DMV', '纽约驾照', 'Permit考试', '纽约驾照中文', '纽约华人DMV'],
})

export default function DMVLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
