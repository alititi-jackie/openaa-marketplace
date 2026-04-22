'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Clock, ChevronRight } from 'lucide-react'

const TABS = ['全部', '招聘', '房屋', '二手'] as const
type Tab = (typeof TABS)[number]

interface Post {
  id: number
  category: Tab
  title: string
  location: string
  price: string
  time: string
  gradient: string
  icon: string
  href: string
}

const posts: Post[] = [
  {
    id: 1,
    category: '招聘',
    title: '中文餐厅服务员/厨师',
    location: '法拉盛',
    price: '$18–22/hr',
    time: '2小时前',
    gradient: 'from-blue-400 to-blue-600',
    icon: '💼',
    href: '/jobs',
  },
  {
    id: 2,
    category: '房屋',
    title: '法拉盛整租一室一厅',
    location: '皇后区 · 近地铁',
    price: '$1,800/月',
    time: '3小时前',
    gradient: 'from-emerald-400 to-emerald-600',
    icon: '🏠',
    href: '/housing',
  },
  {
    id: 3,
    category: '二手',
    title: 'iPhone 14 Pro 256G 九成新',
    location: '曼哈顿',
    price: '$750',
    time: '5小时前',
    gradient: 'from-violet-400 to-violet-600',
    icon: '📱',
    href: '/secondhand',
  },
  {
    id: 4,
    category: '招聘',
    title: '华人超市收银/理货',
    location: '布鲁克林',
    price: '$16/hr',
    time: '1天前',
    gradient: 'from-blue-300 to-blue-500',
    icon: '🏪',
    href: '/jobs',
  },
  {
    id: 5,
    category: '房屋',
    title: '布鲁克林单间合租',
    location: '布鲁克林 · 近学校',
    price: '$950/月',
    time: '1天前',
    gradient: 'from-teal-400 to-teal-600',
    icon: '🏡',
    href: '/housing',
  },
  {
    id: 6,
    category: '二手',
    title: '宜家双人床架+床垫套装',
    location: '皇后区',
    price: '$150',
    time: '2天前',
    gradient: 'from-amber-400 to-orange-500',
    icon: '🛋️',
    href: '/secondhand',
  },
]

export default function LatestPostsSection() {
  const [activeTab, setActiveTab] = useState<Tab>('全部')

  const filtered =
    activeTab === '全部' ? posts : posts.filter((p) => p.category === activeTab)

  return (
    <section className="pt-8">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-[18px] bg-blue-500 rounded-full" />
          <h2 className="text-[15px] font-bold text-zinc-800">最新发布</h2>
        </div>
        <Link
          href="/secondhand"
          className="flex items-center gap-0.5 text-[12px] text-blue-500 font-medium"
        >
          更多
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              activeTab === tab
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-300'
                : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Post grid */}
      <div className="px-4 grid grid-cols-2 gap-4">
        {filtered.map((post) => (
          <Link
            key={post.id}
            href={post.href}
            className="bg-white rounded-2xl overflow-hidden shadow-md border border-zinc-100/70 active:scale-[0.97] transition-transform duration-150"
          >
            {/* Image placeholder */}
            <div
              className={`h-[112px] bg-gradient-to-br ${post.gradient} flex items-center justify-center relative overflow-hidden`}
            >
              {/* Subtle shine */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              <span className="text-[40px] drop-shadow-md relative z-10">{post.icon}</span>
            </div>

            {/* Details */}
            <div className="p-3.5">
              <p className="text-[13px] font-semibold text-zinc-800 line-clamp-2 leading-snug">
                {post.title}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin size={10} className="text-zinc-400 flex-shrink-0" />
                <span className="text-[11px] text-zinc-400 truncate">
                  {post.location}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-zinc-100">
                <span className="text-[13px] font-bold text-blue-600">
                  {post.price}
                </span>
                <div className="flex items-center gap-0.5 text-zinc-400">
                  <Clock size={9} />
                  <span className="text-[10px]">{post.time}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
