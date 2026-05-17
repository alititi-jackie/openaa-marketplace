import type { Metadata } from 'next'
import { buildDmvMetadata } from '@/lib/seo'

export const metadata: Metadata = buildDmvMetadata({
  title: '纽约交通标志考试中文题库 | NY DMV Road Signs Test - OpenAA',
  description:
    '纽约 DMV 中文交通标志专项练习，包含真实纽约 Permit 常见交通标志、路牌识别、标志考试模拟与中文解释。',
  path: '/dmv/ny/sign-test',
})

export default function DMVSignTestLayout({ children }: { children: React.ReactNode }) {
  return children
}
