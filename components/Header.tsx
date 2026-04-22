import Link from 'next/link'
import { MapPin, ChevronDown, Share2 } from 'lucide-react'

export default function Header() {
  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] z-50 bg-white/96 backdrop-blur-md border-b border-zinc-100/80">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: location picker */}
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-semibold text-zinc-700 active:opacity-70 transition-opacity"
        >
          <MapPin size={14} className="text-blue-500" />
          <span>纽约</span>
          <ChevronDown size={12} className="text-zinc-400 mt-px" />
        </button>

        {/* Center: logo */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center font-extrabold text-[22px] tracking-tight select-none"
        >
          <span className="text-blue-500">Open</span>
          <span className="text-zinc-800">AA</span>
        </Link>

        {/* Right: share */}
        <button
          type="button"
          aria-label="分享"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 active:bg-zinc-100 transition-colors"
        >
          <Share2 size={16} className="text-zinc-600" />
        </button>
      </div>
    </header>
  )
}
