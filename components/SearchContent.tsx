'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

type ResultType = 'news' | 'job' | 'housing' | 'secondhand' | 'service'

interface SearchResult {
  type: ResultType
  label: string
  title: string
  subtitle: string
  excerpt: string
  href: string
  created_at: string
}

const TYPE_COLOR: Record<ResultType, string> = {
  news: 'bg-blue-50 text-blue-700',
  job: 'bg-green-50 text-green-700',
  housing: 'bg-orange-50 text-orange-700',
  secondhand: 'bg-purple-50 text-purple-700',
  service: 'bg-red-50 text-red-700',
}

function formatDate(value: string) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return value
  }
}

interface SearchContentProps {
  autoFocus?: boolean
  onResultClick?: () => void
}

export default function SearchContent({ autoFocus = false, onResultClick }: SearchContentProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 1) return

    setStatus('loading')
    setSearched(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      if (!res.ok) throw new Error('search failed')
      const json = (await res.json()) as { data: SearchResult[] }
      setResults(json.data ?? [])
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void doSearch(query)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setStatus('idle')
    setSearched(false)
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden pt-4">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-6 flex w-full max-w-full min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索新闻、招聘、房屋、二手、本地服务..."
            className="h-11 w-full min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-9 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            autoFocus={autoFocus}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="清空"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-600 active:bg-blue-700"
        >
          搜索
        </button>
      </form>

      {/* Status Messages */}
      {!searched && status === 'idle' && (
        <p className="text-sm text-zinc-500 text-center py-8">
          输入关键词，搜索 OpenAA 的新闻、招聘、房屋、二手和本地服务。
        </p>
      )}

      {status === 'loading' && (
        <p className="text-sm text-zinc-500 text-center py-8">正在搜索...</p>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-500 text-center py-8">搜索失败，请稍后再试。</p>
      )}

      {status === 'done' && results.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-8">
          暂时没有找到相关内容，请换个关键词试试。
        </p>
      )}

      {status === 'done' && results.length > 0 && (
        <>
          <p className="mb-3 break-words text-sm text-zinc-500">找到 {results.length} 条相关内容</p>
          <div className="space-y-3">
            {results.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block w-full rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                onClick={onResultClick}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`shrink-0 mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[item.type]}`}
                  >
                    {item.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2">{item.title}</h3>
                    {item.subtitle ? (
                      <p className="mt-0.5 text-xs text-zinc-500">{item.subtitle}</p>
                    ) : null}
                    {item.excerpt ? (
                      <p className="mt-1 text-xs text-zinc-600 line-clamp-2">{item.excerpt}</p>
                    ) : null}
                    <p className="mt-1.5 text-xs text-zinc-400">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
