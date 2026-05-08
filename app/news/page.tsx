import type { Metadata } from 'next'
import { Suspense } from 'react'
import NewsListClient from './NewsListClient'

export const metadata: Metadata = {
  title: 'OpenAA 新闻资讯 - 美国华人生活资讯、平台公告、新手指南',
  description: 'OpenAA 提供美国华人生活资讯、平台公告、新手指南、DMV教程、本地新闻与实用教程。',
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
      <NewsListClient />
    </Suspense>
  )
}
