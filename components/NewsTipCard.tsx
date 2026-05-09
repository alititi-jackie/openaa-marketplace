'use client'

import { useRouter } from 'next/navigation'

export default function NewsTipCard() {
  const router = useRouter()

  const handleClick = () => {
    const params = new URLSearchParams()
    params.set('type', '新闻线索 / 投稿建议')
    if (typeof window !== 'undefined') {
      params.set('related_url', window.location.href)
    }
    router.push(`/feedback?${params.toString()}`)
  }

  return (
    <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
      <h2 className="text-base font-bold text-zinc-900">有新闻线索或投稿建议？</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-zinc-700">
        如果你有纽约华人生活相关的新闻线索、活动信息、实用资讯，或发现本文内容需要更正，欢迎提交给 OpenAA。
      </p>
      <div className="mt-3">
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          提交新闻线索 / 建议
        </button>
      </div>
    </section>
  )
}
