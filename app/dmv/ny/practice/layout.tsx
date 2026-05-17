import type { Metadata } from 'next'
import { buildDmvMetadata } from '@/lib/seo'

export const metadata: Metadata = buildDmvMetadata({
  title: '2026纽约驾照笔试中文练习 | NY DMV Permit 免费模拟考试 - OpenAA',
  description:
    '免费提供最新 2026 纽约州 NY DMV 中文 Permit 笔试练习，包含交通标志、道路规则、随机练习、顺序练习、错题练习与模拟考试。帮助纽约华人、新移民一次通过 DMV Permit 考试。',
  path: '/dmv/ny/practice',
  keywords: ['纽约驾照笔试', 'NY DMV中文考试', 'Permit模拟考试', '纽约DMV练习'],
})

export default function DMVPracticeLayout({ children }: { children: React.ReactNode }) {
  return children
}
