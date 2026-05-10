'use client'

import { useState } from 'react'

interface ContactInfoCardProps {
  title: string
  contactName?: string | null
  phone?: string | null
  wechat?: string | null
  emptyText?: string
}

export default function ContactInfoCard({
  title,
  contactName,
  phone,
  wechat,
  emptyText,
}: ContactInfoCardProps) {
  const [copied, setCopied] = useState(false)

  const contactNameText = (contactName || '').trim()
  const phoneText = (phone || '').trim()
  const wechatText = (wechat || '').trim()
  const hasAny = Boolean(contactNameText || phoneText || wechatText)

  const handleCopyWechat = async () => {
    if (!wechatText) return
    try {
      await navigator.clipboard.writeText(wechatText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  if (!hasAny) {
    if (!emptyText) return null
    return (
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-4">
        <p className="text-sm text-gray-500">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      <div className="space-y-1.5 text-sm text-gray-700 mb-4">
        {contactNameText ? <p>联系人：{contactNameText}</p> : null}
        {phoneText ? <p>电话：{phoneText}</p> : null}
        {wechatText ? <p>微信：{wechatText}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3">
        {phoneText ? (
          <a
            href={`tel:${phoneText}`}
            className="flex-1 min-w-[120px] text-center bg-[#1976d2] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#1565c0] transition"
          >
            📞 拨打电话
          </a>
        ) : null}
        {wechatText ? (
          <button
            type="button"
            onClick={handleCopyWechat}
            className="flex-1 min-w-[120px] text-center bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition"
          >
            {copied ? '✅ 已复制' : '💬 复制微信号'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
