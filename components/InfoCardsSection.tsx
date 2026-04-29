import Link from 'next/link'
import { Car, ChevronRight } from 'lucide-react'

const rates = [
  { from: 'USD', to: 'CNY', rate: '7.24' },
  { from: 'CNY', to: 'USD', rate: '0.14' },
]

export default function InfoCardsSection() {
  return (
    <section className="px-4 pt-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-[16px] bg-blue-500 rounded-full" />
        <h2 className="text-[14px] font-bold text-zinc-800">实用工具</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* DMV card */}
        <Link
          href="/dmv"
          className="rounded-2xl p-3 min-h-[108px] bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-100 shadow-[0_1px_10px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform duration-150"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/70 ring-1 ring-blue-100 flex items-center justify-center">
                <Car size={18} className="text-blue-600" strokeWidth={1.8} />
              </div>

              <h3 className="mt-2 text-[14px] font-bold text-zinc-900 leading-snug">DMV 服务</h3>
              <p className="mt-0.5 text-[11px] text-zinc-500 leading-snug line-clamp-2">
                预约考试 · 笔试题库 · 换驾照
              </p>
            </div>

            <div className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-700 flex-shrink-0">
              进入
              <ChevronRight size={12} />
            </div>
          </div>
        </Link>

        {/* Exchange rate card */}
        <div className="rounded-2xl p-3 min-h-[108px] bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-100 shadow-[0_1px_10px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/70 ring-1 ring-emerald-100 flex items-center justify-center">
                <span className="text-[16px] font-black text-emerald-600 leading-none">$</span>
              </div>
              <h3 className="mt-2 text-[14px] font-bold text-zinc-900 leading-snug">今日汇率</h3>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {rates.map(({ from, to, rate }) => (
              <div key={`${from}-${to}`} className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-medium">
                  {from} / {to}
                </span>
                <span className="text-[18px] font-bold text-zinc-900 leading-none">{rate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
