import type { Metadata } from 'next'
import { buildDmvMetadata } from '@/lib/seo'

export const metadata: Metadata = buildDmvMetadata({
  title: '纽约 DMV 中文随机练习 | NY Permit 顺序/随机刷题 - OpenAA',
  description:
    '提供纽约 DMV Permit 中文随机与顺序练习，支持即时判题与答案解析，帮助纽约华人高效备考 DMV 理论考试。',
  path: '/dmv/ny/quiz',
})

export default function DMVQuizLayout({ children }: { children: React.ReactNode }) {
  return children
}
