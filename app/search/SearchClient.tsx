'use client'

import SearchContent from '@/components/SearchContent'

export default function SearchClient() {
  return (
    <div className="w-full overflow-x-hidden px-4 pt-4">
      <h1 className="mb-4 text-xl font-black text-zinc-900">OpenAA 站内搜索</h1>
      <SearchContent />
    </div>
  )
}
