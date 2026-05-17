import type { Metadata } from 'next'
import { buildDmvMetadata } from '@/lib/seo'

export const metadata: Metadata = buildDmvMetadata({
  title: '纽约 DMV 错题练习 | NY Permit 易错题复习 - OpenAA',
  description:
    '自动汇总纽约 DMV Permit 练习中的错题，支持集中复习与答案解析，帮助纽约华人快速补齐薄弱知识点。',
  path: '/dmv/ny/wrong-questions',
})

export default function DMVWrongQuestionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
