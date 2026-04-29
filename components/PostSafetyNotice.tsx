'use client'

import Link from 'next/link'

const MAILTO = 'mailto:323748@gmail.com?subject=OpenAA信息投诉举报'

export default function PostSafetyNotice() {
  return (
    <section className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
      <h2 className="text-[13px] font-semibold text-amber-900">温馨提示</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-amber-900/80">
        联系对方时，请说明是在 OpenAA 平台看到的信息，以便对方更快了解您的来意。
      </p>

      <h2 className="mt-4 text-[13px] font-semibold text-amber-900">安全提醒</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-amber-900/80">
        本平台信息均由用户自行发布，请注意甄别信息真实性。涉及金钱交易、押金、转账、个人隐私时请提高警惕，谨防诈骗。
      </p>

      <div className="mt-4">
        <Link
          href={MAILTO}
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-amber-800 hover:bg-amber-50 transition"
        >
          信息投诉 / 举报
        </Link>
      </div>
    </section>
  )
}
