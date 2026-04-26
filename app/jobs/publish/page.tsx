'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import JobForm from '@/components/JobForm'
import type { JobPostingType } from '@/types'

function normalizeType(v: string | null): JobPostingType {
  return v === 'seeking' ? 'seeking' : 'hiring'
}

function PublishJobPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = useMemo(() => normalizeType(searchParams.get('type')), [searchParams])

  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
      else setChecking(false)
    })
  }, [router])

  if (checking) return <div className="flex justify-center py-20 text-gray-500">验证中...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">发布信息</h1>
      <JobForm initialType={initialType} />
    </div>
  )
}

export default function PublishJobPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-gray-500">加载中...</div>}>
      <PublishJobPageInner />
    </Suspense>
  )
}
