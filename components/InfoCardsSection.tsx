import Link from 'next/link'
import { AlertTriangle, Car, ChevronRight } from 'lucide-react'

export default function InfoCardsSection() {
  return (
    <section className="px-4 pt-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-[16px] bg-blue-500 rounded-full" />
        <h2 className="text-[14px] font-bold text-zinc-800">实用工具</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* DMV practice card */}
        <Link
          href="/dmv/ny/practice"
          className="rounded-2xl p-2.5 min-h-[110px] bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-100 shadow-[0_1px_10px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform duration-150"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/70 ring-1 ring-blue-100 flex items-center justify-center">
                <Car size={16} className="text-blue-600" strokeWidth={1.8} />
              </div>
              <h3 className="mt-1.5 text-[14px] font-bold text-zinc-900 leading-tight">DMV 笔试模拟</h3>
              <p className="mt-0.5 text-[11px] text-zinc-500 leading-tight line-clamp-2">
                纽约 Learner Permit 中文练习
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-700 flex-shrink-0">
              开始练习
              <ChevronRight size={12} />
            </div>
          </div>
        </Link>

        {/* Ticket query card */}
        <Link
          href="/dmv/tickets"
          className="rounded-2xl p-2.5 min-h-[110px] bg-gradient-to-br from-orange-50 to-rose-100 border border-orange-100 shadow-[0_1px_10px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform duration-150"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/70 ring-1 ring-orange-100 flex items-center justify-center">
                <AlertTriangle size={16} className="text-orange-600" strokeWidth={1.8} />
              </div>
              <h3 className="mt-1.5 text-[14px] font-bold text-zinc-900 leading-tight">罚单查询</h3>
              <p className="mt-0.5 text-[11px] text-zinc-500 leading-tight line-clamp-2">停车 / 闯红灯 / 超速拍照</p>
            </div>
            <div className="flex items-center gap-0.5 text-[11px] font-semibold text-orange-700 flex-shrink-0">
              点击查询
              <ChevronRight size={12} />
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
