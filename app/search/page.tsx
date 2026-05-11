import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  title: 'OpenAA 站内搜索',
  description: '搜索 OpenAA 的新闻、招聘、房屋、二手和本地服务。',
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">加载中...</div>}>
      <SearchClient />
    </Suspense>
  )
}
