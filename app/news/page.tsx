import { Suspense } from 'react'
import NewsListClient from './NewsListClient'

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
      <NewsListClient />
    </Suspense>
  )
}
