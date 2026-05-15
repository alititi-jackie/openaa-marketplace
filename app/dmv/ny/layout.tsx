import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenAA DMV 纽约笔试练习｜中文题库',
  description:
    'OpenAA 纽约 DMV 中文笔试练习，包含查看题库、练习模式、模拟考试和错题练习，帮助华人备考 NY Learner Permit 笔试。',
  keywords: [
    '纽约 DMV 笔试',
    'NY DMV 中文',
    'Learner Permit 练习',
    'DMV 模拟考试',
    '纽约驾照笔试',
    'DMV 交通标志',
    '驾照题库',
  ],
}

export default function DMVNYLayout({ children }: { children: React.ReactNode }) {
  return children
}
