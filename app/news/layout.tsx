import type { Metadata } from 'next'
import { toAbsoluteUrl } from '@/lib/site'

const NEWS_CANONICAL = toAbsoluteUrl('/news')

export const metadata: Metadata = {
  title: 'OpenAA 新闻｜美国华人新闻｜美国生活资讯｜华人新手指南',
  description:
    'OpenAA 新闻资讯为美国华人提供本地新闻、生活指南、DMV 教程、新手指南、平台公告和美国生活实用信息，帮助华人更方便了解美国生活、办事、出行和社区动态。',
  keywords: [
    'OpenAA 新闻',
    '美国华人新闻',
    '华人新闻',
    '美国生活资讯',
    '华人新手指南',
    'DMV 教程',
    '纽约华人新闻',
    '美国生活指南',
    '本地新闻',
    '平台公告',
    '美国华人生活',
    '美华人新闻',
  ],
  alternates: {
    canonical: NEWS_CANONICAL,
  },
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
