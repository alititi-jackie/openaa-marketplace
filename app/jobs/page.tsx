'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AppTopSection from '@/components/AppTopSection'
import JobCard from '@/components/JobCard'
import { JOB_CATEGORIES, JOB_TYPES } from '@/lib/constants'
import type { JobPosting, JobPostingType } from '@/types'

const TABS: Array<{ key: JobPostingType; label: string }> = [
  { key: 'hiring', label: '招聘岗位' },
  { key: 'seeking', label: '求职人才' },
]

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<JobPostingType>('hiring')
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [category, setCategory] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)

    // Note: 'type' is a new column; some environments might not have it yet.
    // We try applying the filter, and if it errors we fall back to the old query.
    const baseQuery = supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    let query = baseQuery
    query = query.eq('type', activeTab)

    if (jobType) query = query.eq('job_type', jobType)
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (!error) {
      setJobs(data || [])
      setLoading(false)
      return
    }

    // Fallback: ignore type filter (for older DB without the column)
    let fallback = baseQuery
    if (jobType) fallback = fallback.eq('job_type', jobType)
    if (category) fallback = fallback.eq('category', category)

    const { data: fallbackData } = await fallback
    setJobs(fallbackData || [])
    setLoading(false)
  }, [activeTab, jobType, category])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const searchLower = search.toLowerCase()
  const filtered = jobs.filter((job) =>
    !search ||
    job.title.toLowerCase().includes(searchLower) ||
    job.company.toLowerCase().includes(searchLower) ||
    job.location.toLowerCase().includes(searchLower)
  )

  const pageTitle = activeTab === 'hiring' ? '招聘信息' : '求职信息'
  const publishLabel = activeTab === 'hiring' ? '发布职位' : '发布求职'

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppTopSection bannerPosition="jobs" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <Link
            href={`/jobs/publish?type=${activeTab}`}
            className="bg-[#1976d2] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1565c0] transition"
          >
            + {publishLabel}
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            {TABS.map((t) => {
              const isActive = t.key === activeTab
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={
                    isActive
                      ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm'
                      : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900'
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索职位、公司、地点..."
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          >
            <option value="">工作类型</option>
            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          >
            <option value="">职位分类</option>
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">💼</div>
            <p>暂无信息</p>
            <Link
              href={`/jobs/publish?type=${activeTab}`}
              className="text-[#1976d2] mt-2 inline-block hover:underline"
            >
              发布第一条
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
