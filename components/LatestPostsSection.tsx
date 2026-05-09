'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatJobLocation } from '@/lib/utils'

type LatestJob = {
  id: string | number
  title: string | null
  location: string | null
}

type LatestSecondhand = {
  id: string | number
  title: string | null
  category?: string | null
}

type LatestHousing = {
  id: string | number
  title: string | null
  location: string | null
}

const quickLinks = [
  { label: '招聘', href: '/jobs' },
  { label: '房屋', href: '/housing' },
  { label: '二手', href: '/secondhand' },
  { label: '新闻', href: '/news' },
] as const

export default function LatestPostsSection() {
  const [jobs, setJobs] = useState<LatestJob[]>([])
  const [items, setItems] = useState<LatestSecondhand[]>([])
  const [housings, setHousings] = useState<LatestHousing[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const [jobsRes, itemsRes, housingsRes] = await Promise.all([
        supabase
          .from('job_postings')
          .select('id, title, location')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('secondhand_items')
          .select('id, title, category')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('housing_posts')
          .select('id, title, location')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (!jobsRes.error && jobsRes.data) {
        setJobs(
          jobsRes.data.map((job) => ({
            id: job.id,
            title: job.title,
            location: job.location,
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
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-[18px] bg-blue-500 rounded-full" />
          <h2 className="text-[15px] font-bold text-zinc-800">最新发布</h2>
        </div>

        {/* Quick nav links (not tabs) */}
        <div className="mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex-shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] transition"
            >
              {l.label}
            </Link>
          ))}
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
          <div className="grid grid-cols-2 gap-2">
            {jobs.map((job) => {
              const loc = formatJobLocation(job.location)
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex flex-col bg-white rounded-xl px-3 py-2.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-zinc-100/70 active:scale-[0.98] transition-transform duration-150 overflow-hidden"
                >
                  <p className="text-[13px] font-semibold text-zinc-800 line-clamp-2 break-words">{job.title}</p>
                  {loc ? (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-zinc-400 flex-shrink-0" />
                      <span className="text-[11px] text-zinc-400 truncate">{loc}</span>
                    </div>
                  ) : null}
                </Link>
              )
            })}
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
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/secondhand/${item.id}`}
                className="flex flex-col bg-white rounded-xl px-3 py-2.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-zinc-100/70 active:scale-[0.98] transition-transform duration-150 overflow-hidden"
              >
                <p className="text-[13px] font-semibold text-zinc-800 line-clamp-2 break-words">{item.title}</p>
                {item.category ? (
                  <span className="text-[11px] text-zinc-400 truncate mt-1">{item.category}</span>
                ) : null}
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
          <div className="grid grid-cols-2 gap-2">
            {housings.map((housing) => (
                <Link
                  key={housing.id}
                  href={`/housing/${housing.id}`}
                  className="flex flex-col bg-white rounded-xl px-3 py-2.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-zinc-100/70 active:scale-[0.98] transition-transform duration-150 overflow-hidden"
                >
                  <p className="text-[13px] font-semibold text-zinc-800 line-clamp-2 break-words">{housing.title}</p>
                  {housing.location ? (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-zinc-400 flex-shrink-0" />
                      <span className="text-[11px] text-zinc-400 truncate">{housing.location}</span>
                    </div>
                  ) : null}
                </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
