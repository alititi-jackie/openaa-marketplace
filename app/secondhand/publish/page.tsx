'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ItemForm from '@/components/ItemForm'
import type { SecondhandItemType } from '@/types'

function normalizeType(t: string | null): SecondhandItemType {
  return t === 'buying' ? 'buying' : 'selling'
}

export default function PublishItemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)

  const initialType = useMemo(() => {
    return normalizeType(searchParams.get('type'))
  }, [searchParams])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
      else setChecking(false)
    })
  }, [router])

  if (checking) return <div className="flex justify-center py-20 text-gray-500">验证中...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {initialType === 'buying' ? '发布求购信息' : '发布二手商品'}
      </h1>
      <ItemForm initialType={initialType} />
    </div>
  )
}
