'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import JobCard from '@/components/JobCard'
import type { JobPosting } from '@/types'

export default function MyJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('job_postings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setJobs(data || [])
      setLoading(false)
    }
    fetchJobs()
  }, [router])

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此职位？')) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      alert(`删除失败：${error.message}`)
      return
    }

    setJobs((prev) => prev.filter((job) => job.id !== id))
  }

  if (loading) return <div className="flex justify-center py-20 text-gray-500">加载中...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的招聘</h1>
        <Link
          href="/jobs/publish"
          className="bg-[#1976d2] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1565c0] transition"
        >
          + 发布职位
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">💼</div>
          <p>还没有发布招聘信息</p>
          <Link href="/jobs/publish" className="text-[#1976d2] mt-2 inline-block hover:underline">
            立即发布
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="relative">
              <JobCard job={job} />

              <div className="absolute top-4 right-4 flex gap-2">
                <Link
                  href={`/jobs/publish?edit=${job.id}`}
                  className="bg-white/90 text-gray-700 rounded-full px-2 py-1 text-xs ring-1 ring-gray-200 hover:bg-white"
                >
                  编辑
                </Link>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  aria-label="delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
