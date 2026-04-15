'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import JobCard from '@/components/JobCard'
import { JOB_CATEGORIES, JOB_TYPES } from '@/lib/constants'
import type { JobPosting } from '@/types'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [category, setCategory] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    if (jobType) query = query.eq('job_type', jobType)
    if (category) query = query.eq('category', category)

    const { data } = await query
    setJobs(data || [])
    setLoading(false)
  }, [jobType, category])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const filtered = jobs.filter(job =>
    !search ||
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company.toLowerCase().includes(search.toLowerCase()) ||
    job.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">招聘信息</h1>
        <Link
          href="/jobs/publish"
          className="bg-[#1976d2] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1565c0] transition"
        >
          + 发布职位
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索职位、公司、地点..."
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
        />
        <select
          value={jobType}
          onChange={e => setJobType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
        >
          <option value="">工作类型</option>
          {JOB_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
        >
          <option value="">职位分类</option>
          {JOB_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">💼</div>
          <p>暂无招聘信息</p>
          <Link href="/jobs/publish" className="text-[#1976d2] mt-2 inline-block hover:underline">
            发布第一个职位
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
