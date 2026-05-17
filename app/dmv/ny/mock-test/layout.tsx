import type { Metadata } from 'next'
import { buildDmvMetadata } from '@/lib/seo'

export const metadata: Metadata = buildDmvMetadata({
  title: '纽约 DMV 模拟考试中文 2026 | 免费 NY Permit Practice Test - OpenAA',
  description:
    '模拟真实纽约 DMV Permit 考试流程，20 题中文模拟考试，支持成绩统计、错题分析、交通标志专项练习，帮助快速熟悉纽约 DMV 理论考试。',
  path: '/dmv/ny/mock-test',
})

export default function DMVMockTestLayout({ children }: { children: React.ReactNode }) {
  return children
}
