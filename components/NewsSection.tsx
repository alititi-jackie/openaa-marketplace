import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
  category: string
  time: string
  summary: string
  badgeBg: string
  badgeText: string
  dot: string
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: '纽约市宣布新一轮华人社区扶持计划',
    summary: '市长办公室发布公告，将向法拉盛、日落公园等华人聚居区提供新一轮社区资金支持。',
    category: '社会',
    time: '1小时前',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-600',
    dot: 'bg-blue-400',
  },
  {
    id: 2,
    title: '法拉盛多家新餐厅盛大开业，美食再升级',
    summary: '近期法拉盛商圈迎来多家新式中餐与港式茶餐厅，特色小吃种类丰富，吸引大批食客。',
    category: '生活',
    time: '3小时前',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    dot: 'bg-emerald-400',
  },
  {
    id: 3,
    title: 'DMV 驾照笔试题库 2024 年版更新通知',
    summary: 'DMV 官方发布最新笔试题库更新，新增多道关于新交通法规的考题，备考请注意更新。',
    category: 'DMV',
    time: '6小时前',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
    dot: 'bg-amber-400',
  },
  {
    id: 4,
    title: '纽约年底租房市场分析：哪些区域性价比最高？',
    summary: '本文整理了皇后区、布鲁克林及布朗克斯各区 2024 年 Q4 租金走势与性价比对比报告。',
    category: '房屋',
    time: '1天前',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-600',
    dot: 'bg-violet-400',
  },
]

export default function NewsSection() {
  return (
    <section className="pt-6 pb-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-[18px] bg-blue-500 rounded-full" />
          <h2 className="text-[15px] font-bold text-zinc-800">本地新闻</h2>
        </div>
        <Link
          href="/news"
          className="flex items-center gap-0.5 text-[12px] text-blue-500 font-medium"
        >
          更多
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* News list */}
      <div className="px-4 space-y-2.5">
        {newsItems.map((item, idx) => (
          <Link
            key={item.id}
            href="/news"
            className="flex gap-3 bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-zinc-100/70 active:scale-[0.99] transition-transform duration-150"
          >
            {/* Left: rank */}
            <div className="flex-shrink-0 w-6 flex flex-col items-center pt-0.5 gap-1.5">
              <span
                className={`text-[12px] font-black tabular-nums ${
                  idx === 0
                    ? 'text-rose-500'
                    : idx === 1
                    ? 'text-orange-400'
                    : idx === 2
                    ? 'text-amber-400'
                    : 'text-zinc-300'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className={`w-1 h-1 rounded-full flex-shrink-0 ${item.dot}`} />
            </div>

            {/* Right: content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeBg} ${item.badgeText}`}
                >
                  {item.category}
                </span>
                <div className="flex items-center gap-0.5 text-zinc-400">
                  <Clock size={10} />
                  <span className="text-[10px]">{item.time}</span>
                </div>
              </div>
              <p className="text-[13px] font-semibold text-zinc-800 line-clamp-1 leading-snug">
                {item.title}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {item.summary}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
