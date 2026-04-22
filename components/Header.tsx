import Link from 'next/link'
import Image from 'next/image'
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

        {/* Center: logo image only */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center select-none"
          aria-label="OpenAA 首页"
        >
          <Image
            src="/openaa-logo.png"
            alt="OpenAA"
            width={110}
            height={36}
            className="object-contain"
            priority
          />
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
