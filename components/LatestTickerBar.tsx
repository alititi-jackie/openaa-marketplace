'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

const DEFAULT_INTERVAL_MS = 4000
const SWIPE_THRESHOLD = 40

export default function LatestTickerBar() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading')
  const [index, setIndex] = useState(0)
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const didSwipeRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/latest-ticker')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        const intervalSeconds = Number(json?.interval_seconds)
        if (Number.isInteger(intervalSeconds) && intervalSeconds >= 3 && intervalSeconds <= 10) {
          setIntervalMs(intervalSeconds * 1000)
        } else {
          setIntervalMs(DEFAULT_INTERVAL_MS)
        }
        const data: TickerItem[] = Array.isArray(json?.data) ? json.data : []
        if (data.length === 0) {
          setStatus('empty')
        } else {
          setItems(data)
          setStatus('ok')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIntervalMs(DEFAULT_INTERVAL_MS)
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const restartTimer = useCallback((count: number, nextIntervalMs: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (count <= 1) return
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, nextIntervalMs)
  }, [])

  // Auto-rotate
  useEffect(() => {
    if (status !== 'ok' || items.length <= 1) return
    restartTimer(items.length, intervalMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, items.length, intervalMs, restartTimer])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null
    didSwipeRef.current = false
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartXRef.current
    const endX = e.changedTouches[0]?.clientX ?? null
    touchStartXRef.current = null
    if (startX === null || endX === null || items.length <= 1) return
    const dx = endX - startX
    if (Math.abs(dx) < SWIPE_THRESHOLD) return
    didSwipeRef.current = true
    if (dx < 0) {
      setIndex((prev) => (prev + 1) % items.length)
    } else {
      setIndex((prev) => (prev - 1 + items.length) % items.length)
    }
    restartTimer(items.length, intervalMs)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (didSwipeRef.current) {
      e.preventDefault()
      didSwipeRef.current = false
    }
  }

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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <Zap size={15} className="shrink-0 mr-2 text-blue-400" />
      <span className="flex-1 truncate">{text}</span>
      <ChevronRight size={14} className="shrink-0 ml-1 text-zinc-400" />
    </Link>
  )
}
