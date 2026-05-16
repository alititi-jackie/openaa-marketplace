'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookMarked, Shuffle, ClipboardList, AlertCircle, FileText } from 'lucide-react'
import AppTopSection from '@/components/AppTopSection'
import BackToTopButton from '@/components/BackToTopButton'
import DetailBackButton from '@/components/DetailBackButton'
import { getSiteUrl } from '@/lib/site'
const entryCards = [
  {
    title: '查看题库',
    desc: '按分类筛选与搜索，支持边看边做题。',
    href: '/dmv/ny/questions',
    Icon: BookMarked,
    colorClass: 'bg-blue-50 text-blue-600',
  },
  {
    title: '随机 / 顺序练习',
    desc: '全题库随机或顺序练习，答题后立即显示正确答案和解释。',
    href: '/dmv/ny/quiz',
    Icon: Shuffle,
    colorClass: 'bg-orange-50 text-orange-500',
  },
  {
    title: '模拟考试',
    desc: '按 DMV 规则出题，提交后立即看结果。',
    href: '/dmv/ny/mock-test',
    Icon: ClipboardList,
    colorClass: 'bg-green-50 text-green-600',
  },
  {
    title: '错题练习',
    desc: '自动汇总错题，集中练习薄弱题目。',
    href: '/dmv/ny/wrong-questions',
    Icon: AlertCircle,
    colorClass: 'bg-red-50 text-red-500',
  },
]

export default function PracticeHomePage() {
  const [shareToast, setShareToast] = useState('')

  const handleShare = async () => {
    const url = getSiteUrl('/dmv/ny/practice')
    const shareData = {
      title: 'OpenAA 纽约 DMV 中文笔试模拟',
      text: '支持中文 DMV 刷题、随机练习、模拟考试、错题练习。',
      url,
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
      } catch {}
      setShareToast('链接已复制')
      setTimeout(() => setShareToast(''), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      <AppTopSection bannerPosition="dmv" />

      <div className="px-4 pt-4">
        <DetailBackButton fallbackHref="/dmv" />

        <section className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-black text-zinc-900">纽约 DMV 中文笔试模拟</h1>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                查看题库、练习模式、模拟考试、错题练习，适合手机刷题学习。
              </p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="shrink-0 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 active:scale-[0.97]"
            >
              📤 分享
            </button>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          {entryCards.map(({ title, desc, href, Icon, colorClass }) => (
            <Link
              key={title}
              href={href}
              className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-sm font-bold text-zinc-900">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
            </Link>
          ))}
        </section>

        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <FileText size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <div className="space-y-1 text-xs leading-5 text-amber-900">
              <p>OpenAA 只提供中文整理和入口导航。</p>
              <p>DMV 规则、费用、预约和罚单信息以官方页面为准。</p>
              <p>涉及法律、罚单争议、保险等问题，请咨询专业人士或官方机构。</p>
            </div>
          </div>
        </section>
      </div>

      {shareToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white z-50">
          {shareToast}
        </div>
      )}

      <BackToTopButton />
    </div>
  )
}
