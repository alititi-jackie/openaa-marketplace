import type { Metadata } from 'next'
import { toAbsoluteUrl } from '@/lib/site'

const DMV_CANONICAL = toAbsoluteUrl('/dmv')

export const metadata: Metadata = {
  title: 'OpenAA DMV｜美国驾照｜纽约 DMV｜笔试模拟｜罚单查询',
  description:
    'OpenAA DMV 为美国华人提供 DMV 驾照信息、纽约 DMV 指南、笔试模拟、罚单查询、驾照考试和美国开车相关实用入口，帮助华人更方便了解 DMV 办事流程和驾驶相关信息。',
  keywords: [
    'OpenAA DMV',
    '美国 DMV',
    '纽约 DMV',
    '美国驾照',
    '纽约驾照',
    'DMV 笔试',
    '笔试模拟',
    '罚单查询',
    '驾照考试',
    '美国开车',
    '华人 DMV',
    'DMV 教程',
    '纽约罚单查询',
    '美国华人驾照',
  ],
  alternates: {
    canonical: DMV_CANONICAL,
  },
}

export default function DMVLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
