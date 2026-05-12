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
    <Link
      href={returnTo}
      className="mb-3 inline-flex w-fit items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-50"
    >
      ← 返回管理页面
    </Link>
  )
}
