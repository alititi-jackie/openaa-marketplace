'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AppTopSection from '@/components/AppTopSection'
import JobCard from '@/components/JobCard'
import BackToTopButton from '@/components/BackToTopButton'
import { JOB_CATEGORIES, JOB_TYPES } from '@/lib/constants'
import RegionFilter, { ALL_REGIONS } from '@/components/RegionFilter'
import { isPublicOwnerVisible } from '@/lib/publicVisibility'
import type { JobPosting, JobPostingType } from '@/types'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'OpenAA 招聘频道',
  alternateName: ['美国华人招聘', '纽约招聘', '找工作', '168招聘'],
  url: 'https://app.openaa.com/jobs',
  description:
    'OpenAA 招聘频道为美国华人提供招聘求职信息，涵盖纽约招聘、兼职、全职、餐馆、司机、仓库、电工、装修等工作信息，帮助华人更方便找工作和发布招聘。',
  isPartOf: {
    '@type': 'WebSite',
    name: 'OpenAA',
    url: 'https://app.openaa.com/',
  },
}

const TABS: Array<{ key: JobPostingType; label: string }> = [
  { key: 'hiring', label: '招聘岗位' },
  { key: 'seeking', label: '求职人才' },
]

function toSortableTime(value: string | null | undefined): number {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function isEffectivePinned(post: JobPosting, nowTime: number): boolean {
  if (!post.is_pinned) return false
  if (post.status !== 'published') return false
  if (!post.pinned_until) return true
  return toSortableTime(post.pinned_until) > nowTime
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<JobPostingType>('hiring')
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState(ALL_REGIONS)

  const fetchJobs = useCallback(async () => {
    setLoading(true)

    // Note: 'type' is a new column; some environments might not have it yet.
    // We try applying the filter, and if it errors we fall back to the old query.
    const baseQuery = supabase
      .from('job_postings')
      .select('*, user:users(status)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    let query = baseQuery
    query = query.eq('type', activeTab)

    if (jobType) query = query.eq('job_type', jobType)
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (!error) {
      setJobs((data || []).filter((job) => isPublicOwnerVisible((job as JobPosting).user)) as JobPosting[])
      setLoading(false)
      return
    }

    // Fallback: ignore type filter (for older DB without the column)
    let fallback = baseQuery
    if (jobType) fallback = fallback.eq('job_type', jobType)
    if (category) fallback = fallback.eq('category', category)

    const { data: fallbackData } = await fallback
    setJobs(((fallbackData || []) as JobPosting[]).filter((job) => isPublicOwnerVisible(job.user)))
    setLoading(false)
  }, [activeTab, jobType, category])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase()
    const nowTime = Date.now()
    return jobs
      .filter((job) =>
        (!search ||
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.location.toLowerCase().includes(searchLower)) &&
        (location === ALL_REGIONS || job.location === location)
      )
      .sort((a, b) => {
        const aPinned = isEffectivePinned(a, nowTime)
        const bPinned = isEffectivePinned(b, nowTime)
        if (aPinned !== bPinned) return aPinned ? -1 : 1

        if (aPinned && bPinned) {
          const pinnedOrderDiff = (a.pinned_order ?? 0) - (b.pinned_order ?? 0)
          if (pinnedOrderDiff !== 0) return pinnedOrderDiff

          const createdAtDiff = toSortableTime(b.created_at) - toSortableTime(a.created_at)
          if (createdAtDiff !== 0) return createdAtDiff
        }

        return toSortableTime(b.created_at) - toSortableTime(a.created_at)
      })
  }, [jobs, search, location])

  const pageTitle = activeTab === 'hiring' ? '招聘信息' : '求职信息'
  const publishLabel = activeTab === 'hiring' ? '发布职位' : '发布求职'

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* JSON-LD: lightweight, page-level only */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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
          <RegionFilter value={location} onChange={setLocation} />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">💼</div>
            <p>暂无符合条件的招聘信息</p>
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

        {/* Lightweight SEO copy (near bottom) */}
        <section className="mt-8">
          <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-4 text-[12.5px] leading-relaxed text-zinc-600">
            OpenAA 招聘频道为美国华人和美华人提供招聘求职信息，涵盖纽约招聘、兼职、全职、餐馆、司机、仓库、电工、装修等工作信息，帮助华人更方便找工作和发布招聘。
          </div>
        </section>
      </div>

      <BackToTopButton />
    </div>
  )
}
