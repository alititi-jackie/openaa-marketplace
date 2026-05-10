'use client'

import Link from 'next/link'

interface AdminPageHeaderProps {
  title: string
  description?: string
  isLoggedIn?: boolean
  onLogout?: () => void
  onChangeToken?: () => void
  rightSlot?: React.ReactNode
}

export default function AdminPageHeader({
  title,
  description,
  isLoggedIn,
  onLogout,
  onChangeToken,
  rightSlot,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href="/admin"
        className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
      >
        ← 返回总后台
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
          {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLoggedIn ? (
            <>
              <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-sm text-green-700">
                已使用统一后台登录 Token
              </span>
              {onChangeToken ? (
                <button
                  type="button"
                  onClick={onChangeToken}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  更换 Token
                </button>
              ) : null}
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  退出后台
                </button>
              ) : null}
            </>
          ) : null}
          {rightSlot}
        </div>
      </div>
    </div>
  )
}
