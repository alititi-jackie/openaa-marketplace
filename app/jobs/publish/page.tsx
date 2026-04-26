'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import JobForm from '@/components/JobForm'
import type { JobPosting, JobPostingType } from '@/types'

function normalizeType(v: string | null): JobPostingType {
  return v === 'seeking' ? 'seeking' : 'hiring'
}

function parseEditId(v: string | null): number | null {
  if (!v) return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function PublishJobPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const editId = useMemo(() => parseEditId(searchParams.get('edit')), [searchParams])
  const initialType = useMemo(() => normalizeType(searchParams.get('type')), [searchParams])

  const [checking, setChecking] = useState(true)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [error, setError] = useState('')
  const [editJob, setEditJob] = useState<JobPosting | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setError('')
      setEditJob(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // No edit => ready
      if (!editId) {
        if (!cancelled) setChecking(false)
        return
      }

      // Edit mode => load + verify owner before prefilling
      if (!cancelled) {
        setLoadingEdit(true)
        setChecking(false)
      }

      const { data, error: fetchError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', editId)
        .single()

      if (cancelled) return

      if (fetchError || !data) {
        setError('信息不存在或已被删除')
        setLoadingEdit(false)
        return
      }

      if (data.user_id !== user.id) {
        setError('无权限编辑该信息')
        setLoadingEdit(false)
        return
      }

      setEditJob(data)
      setLoadingEdit(false)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [router, editId])

  if (checking) return <div className="flex justify-center py-20 text-gray-500">验证中...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{editId ? '编辑信息' : '发布信息'}</h1>

      {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm mb-4">{error}</div>}

      {loadingEdit ? (
        <div className="flex justify-center py-20 text-gray-500">加载中...</div>
      ) : error ? null : (
        <JobForm initialType={initialType} editJob={editJob} />
      )}
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
