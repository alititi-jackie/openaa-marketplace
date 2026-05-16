'use client'

import { useState } from 'react'
import { getSiteUrl } from '@/lib/site'

type DmvShareButtonProps = {
  path: string
  title: string
  text: string
  className?: string
}

const defaultClassName =
  'shrink-0 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 active:scale-[0.97]'

export default function DmvShareButton({ path, title, text, className }: DmvShareButtonProps) {
  const [shareToast, setShareToast] = useState('')

  const handleShare = async () => {
    const url = getSiteUrl(path)
    const shareData = { title, text, url }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
      } catch {}
      setShareToast('链接已复制')
      setTimeout(() => setShareToast(''), 2000)
    }
  }

  return (
    <>
      <button type="button" onClick={handleShare} className={className ?? defaultClassName}>
        📤 分享
      </button>
      {shareToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white z-50">
          {shareToast}
        </div>
      )}
    </>
  )
}
