import type { Metadata } from 'next'
import { buildDmvMetadata } from '@/lib/seo'

export const metadata: Metadata = buildDmvMetadata({
  title: '纽约 DMV 中文题库 2026 | Permit 真题练习与答案解析 - OpenAA',
  description:
    '提供纽约 DMV Permit 中文题库与答案解析，支持查看全部 DMV 真题、交通标志、道路规则与中文解释，适合纽约华人 DMV 笔试学习。',
  path: '/dmv/ny/questions',
})

export default function DMVQuestionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
