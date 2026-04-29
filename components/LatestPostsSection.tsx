'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Clock, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatPrice } from '@/lib/utils'

type LatestJob = {
  id: string | number
  title: string | null
  location: string | null
  salary_min?: number | null
  salary_max?: number | null
  created_at: string | null
}

type LatestSecondhand = {
  id: string | number
  title: string | null
  category?: string | null
  price?: number | null
  created_at: string | null
}

type LatestHousing = {
  id: string | number
  title: string | null
  location: string | null
  price?: number | null
  created_at: string | null
}

function formatSalary(min?: number | null, max?: number | null) {
  if (typeof min === 'number' && typeof max === 'number') {
    return `$${min.toLocaleString()}-$${max.toLocaleString()}`
  }
  if (typeof min === 'number') {
    return `$${min.toLocaleString()}+`
  }
  if (typeof max === 'number') {
    return `最高 $${max.toLocaleString()}`
  }
  return '面议'
}

export default function LatestPostsSection() {
  const [jobs, setJobs] = useState<LatestJob[]>([])
  const [items, setItems] = useState<LatestSecondhand[]>([])
  const [housings, setHousings] = useState<LatestHousing[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const [jobsRes, itemsRes, housingsRes] = await Promise.all([
        supabase
          .from('job_postings')
          .select('id, title, location, salary_min, salary_max, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('secondhand_items')
          .select('id, title, category, price, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('housing_posts')
          .select('id, title, location, price, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      if (!jobsRes.error && jobsRes.data) {
        setJobs(
          jobsRes.data.map((job) => ({
            id: job.id,
            title: job.title,
            location: job.location,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            created_at: job.created_at,
          }))
        )
      } else {
        setJobs([])
      }

      if (!itemsRes.error && itemsRes.data) {
        setItems(
          itemsRes.data.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            price: item.price,
            created_at: item.created_at,
          }))
        )
      } else {
        setItems([])
      }

      if (!housingsRes.error && housingsRes.data) {
        setHousings(
          housingsRes.data.map((housing) => ({
            id: housing.id,
            title: housing.title,
            location: housing.location,
            price: housing.price,
            created_at: housing.created_at,
          }))
        )
      } else {
        setHousings([])
      }
    }

    fetchAll()
  }, [])

  return (
    <section className="pt-6">
      {/* Section header */}
      <div className="flex items-center px-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-[18px] bg-blue-500 rounded-full" />
          <h2 className="text-[15px] font-bold text-zinc-800">最新发布</h2>
        </div>
      </div>

      {/* 最新招聘 */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold text-zinc-500">最新招聘</h3>
          <Link href="/jobs" className="flex items-center gap-0.5 text-[12px] text-blue-500 font-medium">
            更多
            <ChevronRight size={13} />
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-[12px] text-zinc-400 py-2">暂无最新信息</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-zinc-100/70 active:scale-[0.98] transition-transform duration-150"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-zinc-800 truncate">{job.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-zinc-400 flex-shrink-0" />
                    <span className="text-[11px] text-zinc-400 truncate">{job.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-2 flex-shrink-0">
                  <span className="text-[12px] font-bold text-blue-600">{formatSalary(job.salary_min, job.salary_max)}</span>
                  <div className="flex items-center gap-0.5 text-zinc-400 mt-0.5">
                    <Clock size={9} />
                    <span className="text-[10px]">{formatDate(job.created_at ?? '')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 最新二手 */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold text-zinc-500">最新二手</h3>
          <Link
            href="/secondhand"
            className="flex items-center gap-0.5 text-[12px] text-blue-500 font-medium"
          >
            更多
            <ChevronRight size={13} />
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="text-[12px] text-zinc-400 py-2">暂无最新信息</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/secondhand/${item.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-zinc-100/70 active:scale-[0.98] transition-transform duration-150"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-zinc-800 truncate">{item.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] text-zinc-400 truncate">{item.category}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-2 flex-shrink-0">
                  <span className="text-[12px] font-bold text-blue-600">
                    {item.price == null ? '面议' : formatPrice(item.price)}
                  </span>
                  <div className="flex items-center gap-0.5 text-zinc-400 mt-0.5">
                    <Clock size={9} />
                    <span className="text-[10px]">{formatDate(item.created_at ?? '')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 最新房屋 */}
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold text-zinc-500">最新房屋</h3>
          <Link href="/housing" className="flex items-center gap-0.5 text-[12px] text-blue-500 font-medium">
            更多
            <ChevronRight size={13} />
          </Link>
        </div>
        {housings.length === 0 ? (
          <p className="text-[12px] text-zinc-400 py-2">暂无最新信息</p>
        ) : (
          <div className="space-y-2">
            {housings.map((housing) => (
              <Link
                key={housing.id}
                href={`/housing/${housing.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-zinc-100/70 active:scale-[0.98] transition-transform duration-150"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-zinc-800 truncate">{housing.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-zinc-400 flex-shrink-0" />
                    <span className="text-[11px] text-zinc-400 truncate">{housing.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-2 flex-shrink-0">
                  <span className="text-[12px] font-bold text-blue-600">
                    {housing.price == null ? '租金面议' : `$${housing.price}/月`}
                  </span>
                  <div className="flex items-center gap-0.5 text-zinc-400 mt-0.5">
                    <Clock size={9} />
                    <span className="text-[10px]">{formatDate(housing.created_at ?? '')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
