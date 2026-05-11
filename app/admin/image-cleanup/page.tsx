'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'
import { useAutoMessage } from '@/hooks/useAutoMessage'

type ScanItem = {
  bucket: 'news-covers' | 'ads' | 'post-images'
  path: string
  publicUrl: string
  isUsed: boolean
  references: string[]
}

type FilterType = 'deletable' | 'protected' | 'all'

function isScanItems(value: unknown): value is ScanItem[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== 'object') return false
    const row = item as Record<string, unknown>
    return (
      typeof row.bucket === 'string' &&
      typeof row.path === 'string' &&
      typeof row.publicUrl === 'string' &&
      typeof row.isUsed === 'boolean' &&
      Array.isArray(row.references)
    )
  })
}

export default function AdminImageCleanupPage() {
  const [token, setToken] = useState('')
  const [inputToken, setInputToken] = useState('')
  const [isUsingUnifiedToken, setIsUsingUnifiedToken] = useState(false)
  const [showTokenEditor, setShowTokenEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [message, setMessage] = useAutoMessage()
  const [items, setItems] = useState<ScanItem[]>([])
  const [filter, setFilter] = useState<FilterType>('deletable')
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    const stored = getAdminToken()
    if (!stored) return
    setToken(stored)
    setInputToken(stored)
    setIsUsingUnifiedToken(true)
  }, [])

  function saveToken() {
    const nextToken = inputToken.trim()
    if (!nextToken) {
      setMessage('请输入 Admin Token')
      return
    }
    setAdminToken(nextToken)
    setToken(nextToken)
    setInputToken(nextToken)
    setIsUsingUnifiedToken(true)
    setShowTokenEditor(false)
    setMessage('')
  }

  function logoutAdmin() {
    clearAdminToken()
    setToken('')
    setInputToken('')
    setIsUsingUnifiedToken(false)
    setShowTokenEditor(false)
    setMessage('')
    setItems([])
    setDeletingPath(null)
    setExpandedItems({})
  }

  async function handleScan() {
    if (!token) {
      setMessage('请先输入 Admin Token')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/image-cleanup', {
        headers: { 'x-admin-token': token },
      })
      const json: unknown = await res.json()

      if (json && typeof json === 'object' && 'data' in json && isScanItems((json as Record<string, unknown>).data)) {
        setItems((json as { data: ScanItem[] }).data)
        setFilter('deletable')
        setExpandedItems({})
        setCopiedKey(null)
        const total = (json as { data: ScanItem[] }).data.length
        setMessage(`扫描完成：共 ${total} 张图片`)
      } else {
        const errorMessage = json && typeof json === 'object' && 'error' in json
          ? String((json as Record<string, unknown>).error || '扫描失败')
          : '扫描失败'
        setMessage(errorMessage)
      }
    } catch {
      setMessage('网络错误，扫描失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(item: ScanItem) {
    if (item.isUsed) return

    const confirmed = window.confirm('确定删除这张疑似未使用的图片吗？此操作不可恢复。')
    if (!confirmed) return

    setDeletingPath(`${item.bucket}/${item.path}`)
    setMessage('')

    try {
      const res = await fetch('/api/admin/image-cleanup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          bucket: item.bucket,
          path: item.path,
          publicUrl: item.publicUrl,
        }),
      })
      const json: unknown = await res.json()
      if (res.ok) {
        setItems((prev) => prev.filter((row) => !(row.bucket === item.bucket && row.path === item.path)))
        setExpandedItems((prev) => {
          const next = { ...prev }
          delete next[`${item.bucket}/${item.path}`]
          return next
        })
        setCopiedKey(null)
        setMessage('删除成功')
      } else {
        const errorMessage = json && typeof json === 'object' && 'error' in json
          ? String((json as Record<string, unknown>).error || '删除失败')
          : '删除失败'
        setMessage(errorMessage)
      }
    } catch {
      setMessage('网络错误，删除失败')
    } finally {
      setDeletingPath(null)
    }
  }

  async function handleCopyUrl(item: ScanItem) {
    const key = `${item.bucket}/${item.path}`
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('clipboard not available')
      }
      await navigator.clipboard.writeText(item.publicUrl)
      setCopiedKey(key)
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev))
      }, 1500)
    } catch {
      window.prompt('复制以下 URL', item.publicUrl)
    }
  }

  const deletableCount = items.filter((item) => !item.isUsed).length
  const protectedCount = items.filter((item) => item.isUsed).length
  const totalCount = items.length
  const filteredItems = items.filter((item) => {
    if (filter === 'deletable') return !item.isUsed
    if (filter === 'protected') return item.isUsed
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
      >
        ← 返回总后台
      </Link>

      <h1 className="text-2xl font-bold mb-6 mt-3">图片清理工具</h1>

      {!token ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
          <label className="block text-sm font-medium mb-1">Admin Token</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveToken() }}
              placeholder="输入管理 Token"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={saveToken}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              确认
            </button>
          </div>
          {message ? <p className="mt-2 text-sm text-red-500">{message}</p> : null}
        </div>
      ) : (
        <div className="mb-6 rounded-xl border bg-gray-50 p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              {isUsingUnifiedToken ? '已使用统一后台登录 Token' : '已使用当前 Admin Token'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTokenEditor((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg border text-sm text-gray-600 hover:bg-gray-50"
              >
                更换 Token
              </button>
              <button
                type="button"
                onClick={logoutAdmin}
                className="px-3 py-1.5 rounded-lg border text-sm text-gray-600 hover:bg-gray-50"
              >
                退出后台
              </button>
            </div>
          </div>
          {showTokenEditor ? (
            <div className="flex gap-2">
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveToken() }}
                placeholder="输入新的 Admin Token"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={saveToken}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                保存 Token
              </button>
            </div>
          ) : null}
        </div>
      )}

      {token ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleScan}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '扫描中...' : '开始扫描'}
          </button>
        </div>
      ) : null}

      {message ? (
        <p className={`mb-4 text-sm ${message.includes('成功') || message.includes('扫描完成') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-xl border bg-white p-3 sm:p-4">
            <p className="text-sm text-zinc-700">
              全部 {totalCount} 张 / 可删除 {deletableCount} 张 / 不可删除 {protectedCount} 张
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter('deletable')}
                className={`rounded-full border px-3 py-1 text-xs sm:text-sm ${filter === 'deletable' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}
              >
                可删除 {deletableCount}
              </button>
              <button
                type="button"
                onClick={() => setFilter('protected')}
                className={`rounded-full border px-3 py-1 text-xs sm:text-sm ${filter === 'protected' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}
              >
                不可删除 {protectedCount}
              </button>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-full border px-3 py-1 text-xs sm:text-sm ${filter === 'all' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}
              >
                全部 {totalCount}
              </button>
            </div>
          </div>

          {filteredItems.length === 0 && filter === 'deletable' ? (
            <div className="rounded-xl border bg-white p-4 text-sm text-zinc-600">暂无可删除图片</div>
          ) : null}

          {filteredItems.map((item) => {
            const key = `${item.bucket}/${item.path}`
            const isExpanded = !!expandedItems[key]
            return (
              <div key={key} className="rounded-xl border bg-white p-4">
                <div className="grid gap-3 grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr]">
                  <div className="overflow-hidden rounded-lg border bg-zinc-50">
                    <img
                      src={item.publicUrl}
                      alt={item.path}
                      className="h-24 w-full object-cover sm:h-28"
                    />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">{item.bucket}</span>
                      {item.isUsed ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-100">正在使用</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-100">疑似未使用</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!item.isUsed ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingPath === key}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingPath === key ? '删除中...' : '删除'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-400"
                        >
                          不可删除
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }))}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                      >
                        {isExpanded ? '收起详情' : '详情'}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-3 space-y-2 rounded-lg border bg-zinc-50 p-3 text-xs text-zinc-700">
                    <p className="break-all whitespace-pre-wrap"><span className="font-medium">path：</span>{item.path}</p>
                    <p className="break-all whitespace-pre-wrap"><span className="font-medium">publicUrl：</span>{item.publicUrl}</p>
                    <p className="break-all whitespace-pre-wrap"><span className="font-medium">引用来源：</span>{item.references.length > 0 ? item.references.join('、') : '无'}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item)}
                        className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                      >
                        {copiedKey === key ? '已复制' : '复制 URL'}
                      </button>
                      <a
                        href={item.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                      >
                        打开原图
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : token && !loading ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-zinc-600">暂无扫描结果，请点击“开始扫描”。</div>
      ) : null}
    </div>
  )
}
