'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSafeAdminReturnPath } from '@/lib/adminReturn'

export default function AdminReturnButton() {
  const searchParams = useSearchParams()
  const returnTo = getSafeAdminReturnPath(searchParams.get('return_to'))

  if (searchParams.get('from_admin') !== '1' || !returnTo) {
    return null
  }

  return (
    <div className="sticky top-14 z-30 mb-4">
      <Link
        href={returnTo}
        className="flex items-center gap-1 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
      >
        ← 返回管理页面
      </Link>
    </div>
  )
}
