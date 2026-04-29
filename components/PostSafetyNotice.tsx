'use client'

import Link from 'next/link'

const MAILTO = 'mailto:323748@gmail.com?subject=OpenAA信息投诉举报'

type Variant = 'contact' | 'safety'

type Props = {
  variant?: Variant
  className?: string
}

const BODY_CLASS = 'text-zinc-800 text-base leading-relaxed'

export default function PostSafetyNotice({ variant = 'safety', className }: Props) {
  if (variant === 'contact') {
    // Match description body typography (no card, no background)
    return (
      <p className={['mt-2', BODY_CLASS, className].filter(Boolean).join(' ')}>
        联系对方时，请说明是在 OpenAA 平台看到的信息。谢谢！
      </p>
    )
  }

  return (
    <section
      className={['mt-6 rounded-2xl border border-amber-100 bg-amber-50/40 p-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      <h2 className="text-[13px] font-semibold text-amber-900">安全提醒</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-amber-900/80">
        本平台信息均由用户自行发布，请注意甄别信息真实性。涉及金钱交易、押金、转账、个人隐私时请提高警惕，谨防诈骗。
      </p>

      <div className="mt-3">
        <Link
          href={MAILTO}
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-amber-800 hover:bg-amber-50 transition"
        >
          信息投诉 / 举报
        </Link>
      </div>
    </section>
  )
}
