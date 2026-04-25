'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import BannerCarousel from '@/components/BannerCarousel'
import { Search, ExternalLink } from 'lucide-react'
import { navigationCategories } from '@/data/navigationLinks'

function normalize(s: string) {
  return s.trim().toLowerCase()
}

export default function NavigationPage() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = normalize(q)
    if (!query) return navigationCategories

    return navigationCategories
      .map((cat) => {
        const links = cat.links.filter((l) => {
          const hay = `${cat.title} ${cat.description} ${l.name} ${l.description}`.toLowerCase()
          return hay.includes(query)
        })
        return { ...cat, links }
      })
      .filter((cat) => cat.links.length > 0)
  }, [q])

  const totalResults = useMemo(() => {
    return filtered.reduce((acc, c) => acc + c.links.length, 0)
  }, [filtered])

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-[860px] px-4 pt-6 pb-16">
        {/* Header */}
        <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-5">
          <h1 className="text-[18px] md:text-[22px] font-black text-zinc-900 tracking-tight">
            美国华人生活导航
          </h1>
          <p className="mt-1 text-[12px] md:text-[13px] text-zinc-500">
            常用网站 · 政务办事 · 招聘房屋 · AI工具
          </p>

          {/* Search */}
          <div className="mt-4">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-4 text-zinc-400 pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索网站 / 分类…"
                className="w-full h-11 pl-10 pr-4 bg-zinc-50 border border-zinc-100 rounded-full text-sm text-zinc-700 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition shadow-sm"
              />
            </div>

            <div className="mt-2 text-[11px] text-zinc-400">
              {q ? `找到 ${totalResults} 个结果` : '输入关键词可快速筛选'}
            </div>
          </div>
        </div>

        {/* Optional banner */}
        <div className="mt-4">
          <BannerCarousel />
        </div>

        {/* Categories */}
        <div className="mt-6 space-y-5">
          {q && totalResults === 0 ? (
            <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-6 text-center">
              <p className="text-[14px] font-bold text-zinc-900">没有找到相关网站</p>
              <p className="mt-1 text-[12px] text-zinc-500">
                试试更短的关键词，例如：DMV / Bank / AI / 纽约
              </p>
            </div>
          ) : (
            filtered.map((cat) => (
              <section key={cat.id}>
                <div className="flex items-end justify-between px-1 mb-2">
                  <div>
                    <h2 className="text-[14px] md:text-[15px] font-black text-zinc-900">
                      <span className="mr-2">{cat.icon}</span>
                      {cat.title}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{cat.description}</p>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">{cat.links.length}</span>
                </div>

                <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {cat.links.map((l) => {
                      if (l.isExternal) {
                        return (
                          <a
                            key={`${cat.id}-${l.name}`}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group rounded-2xl px-3 py-3 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[12.5px] font-bold text-zinc-900">{l.name}</div>
                              <ExternalLink size={14} className="text-zinc-400" />
                            </div>
                            <div className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{l.description}</div>
                          </a>
                        )
                      }

                      return (
                        <Link
                          key={`${cat.id}-${l.name}`}
                          href={l.url}
                          className="group rounded-2xl px-3 py-3 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition"
                        >
                          <div className="text-[12.5px] font-bold text-zinc-900">{l.name}</div>
                          <div className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{l.description}</div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </section>
            ))
          )}
        </div>

        {/* Bottom SEO */}
        <div className="mt-8 rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-5">
          <h3 className="text-[13px] font-black text-zinc-900">关于本页</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-600">
            OpenAA 美国华人生活导航整理在美华人常用网站入口，包括 DMV、USCIS、IRS、银行开户、招聘求职、房屋生活、
            二手交易、AI工具和新闻资讯等，帮助用户快速找到可靠资源。
          </p>
        </div>
      </div>
    </div>
  )
}
