'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatDate, formatSalary } from '@/lib/utils'
import type { JobPosting } from '@/types'

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase
        .from('job_postings')
        .select('*, user:users(username, avatar_url)')
        .eq('id', id)
        .single()

      if (data) {
        setJob(data)
        await supabase
          .from('job_postings')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id)
      }
      setLoading(false)
    }
    fetchJob()
  }, [id])

  if (loading) return <div className="flex justify-center py-20 text-gray-500">加载中...</div>
  if (!job) return <div className="flex justify-center py-20 text-gray-500">职位不存在</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-[#1976d2] mb-4 flex items-center gap-1">
        ← 返回
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-lg text-gray-600 mt-1">{job.company}</p>
          </div>
          <span className="bg-blue-50 text-[#1976d2] px-3 py-1 rounded-full text-sm font-medium">
            {job.job_type}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">薪资范围</p>
            <p className="font-semibold text-green-600">{formatSalary(job.salary_min, job.salary_max)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">工作地点</p>
            <p className="font-semibold text-gray-900">📍 {job.location}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">{job.category}</span>
          <span>👁 {job.views || 0} 次浏览</span>
          <span>{formatDate(job.created_at)}</span>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">职位描述</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1976d2] flex items-center justify-center text-white font-bold">
            {job.user?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {job.user?.username ?? '匿名用户'}
            </p>
            <p className="text-xs text-gray-500">发布者</p>
          </div>
        </div>
      </div>
    </div>
  )
}
