import Link from 'next/link'
import { Car, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

const rates = [
  { from: 'USD', to: 'CNY', rate: '7.24', trend: 'up', change: '+0.03' },
  { from: 'USD', to: 'JPY', rate: '149.2', trend: 'up', change: '+0.5' },
  { from: 'EUR', to: 'CNY', rate: '7.87', trend: 'down', change: '-0.02' },
]

export default function InfoCardsSection() {
  return (
    <section className="px-4 pt-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-[18px] bg-blue-500 rounded-full" />
        <h2 className="text-[15px] font-bold text-zinc-800">实用工具</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* DMV card */}
        <Link
          href="/dmv"
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg active:scale-[0.97] transition-transform duration-150"
        >
          {/* Decorative circles */}
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute top-6 -right-2 w-14 h-14 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

          <div className="relative">
            <div className="w-10 h-10 rounded-[14px] bg-white/20 flex items-center justify-center mb-3">
              <Car size={20} className="text-white" strokeWidth={1.8} />
            </div>
            <h3 className="text-white font-bold text-[14px] leading-tight">DMV 服务</h3>
            <p className="text-white/75 text-[11px] mt-1 leading-relaxed">
              预约考试 · 笔试题库
              <br />
              换驾照 · 选车指南
            </p>
            <div className="flex items-center gap-0.5 mt-3 text-white/90 text-[11px] font-semibold">
              立即查看
              <ChevronRight size={12} />
            </div>
          </div>
        </Link>

        {/* Exchange rate card */}
        <div className="rounded-2xl p-4 bg-white border border-zinc-100 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-[14px] bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
              <span className="text-[18px] font-black text-emerald-500 leading-none">$</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium bg-zinc-50 px-2 py-0.5 rounded-full">实时汇率</span>
          </div>

          <h3 className="text-[13px] font-bold text-zinc-800 mb-2.5">今日汇率</h3>

          <div className="space-y-2">
            {rates.map(({ from, to, rate, trend, change }) => (
              <div key={`${from}-${to}`} className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-medium">
                  {from} → {to}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-zinc-800">
                    {rate}
                  </span>
                  <div
                    className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                      trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {trend === 'up' ? (
                      <TrendingUp size={10} />
                    ) : (
                      <TrendingDown size={10} />
                    )}
                    <span>{change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
