'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Zap, ChevronRight } from 'lucide-react'

interface TickerItem {
  type: string
  label: string
  title: string
  subtitle: string
  href: string
  created_at: string
}

const INTERVAL_MS = 3500

export default function LatestTickerBar() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading')
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/latest-ticker')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        const data: TickerItem[] = Array.isArray(json?.data) ? json.data : []
        if (data.length === 0) {
          setStatus('empty')
        } else {
          setItems(data)
          setStatus('ok')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-rotate
  useEffect(() => {
    if (status !== 'ok' || items.length <= 1) return
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length)
    }, INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, items.length])

  // ── Placeholder states ──────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex items-center h-11 pl-4 pr-3 bg-zinc-50 border border-zinc-100 rounded-full text-sm text-zinc-400 select-none">
        <Zap size={15} className="shrink-0 mr-2 text-zinc-300" />
        <span className="truncate">正在加载 OpenAA 最新动态...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center h-11 pl-4 pr-3 bg-zinc-50 border border-zinc-100 rounded-full text-sm text-zinc-400 select-none">
        <Zap size={15} className="shrink-0 mr-2 text-zinc-300" />
        <span className="truncate">暂时无法加载最新动态</span>
      </div>
    )
  }

  if (status === 'empty' || items.length === 0) {
    return (
      <div className="flex items-center h-11 pl-4 pr-3 bg-zinc-50 border border-zinc-100 rounded-full text-sm text-zinc-400 select-none">
        <Zap size={15} className="shrink-0 mr-2 text-zinc-300" />
        <span className="truncate">OpenAA 最新发布，点击右上角放大镜搜索更多内容</span>
      </div>
    )
  }

  const current = items[index]
  const text = current.subtitle
    ? `[${current.label}] ${current.subtitle} ${current.title}`
    : `[${current.label}] ${current.title}`

  return (
    <Link
      href={current.href}
      className="flex items-center h-11 pl-4 pr-3 bg-zinc-50 border border-zinc-100 rounded-full text-sm text-zinc-600 hover:bg-zinc-100 transition-colors min-w-0"
      aria-label={`查看最新动态：${text}`}
    >
      <Zap size={15} className="shrink-0 mr-2 text-blue-400" />
      <span className="flex-1 truncate">{text}</span>
      <ChevronRight size={14} className="shrink-0 ml-1 text-zinc-400" />
    </Link>
  )
}
