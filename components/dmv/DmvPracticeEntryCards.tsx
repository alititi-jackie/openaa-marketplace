'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

export type DmvPracticeEntryCard = {
  title: string
  desc: string
  href: string
  Icon: LucideIcon
  colorClass: string
}

export default function DmvPracticeEntryCards({
  cards,
  className,
}: {
  cards: DmvPracticeEntryCard[]
  className?: string
}) {
  return (
    <section className={className ?? 'mt-4 grid grid-cols-2 gap-3'}>
      {cards.map(({ title, desc, href, Icon, colorClass }) => (
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
  )
}
