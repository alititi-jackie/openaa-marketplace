'use client'

import SearchContent from '@/components/SearchContent'

export default function SearchClient() {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-black text-zinc-900 mb-4">OpenAA 站内搜索</h1>
      <SearchContent />
    </div>
  )
}
