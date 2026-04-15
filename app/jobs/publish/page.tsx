'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import JobForm from '@/components/JobForm'

export default function PublishJobPage() {
  const router = useRouter()
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">发布招聘信息</h1>
      <JobForm />
    </div>
  )
}
