'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'

type ScanItem = {
  bucket: 'news-covers' | 'ads' | 'post-images'
  path: string
  publicUrl: string
  isUsed: boolean
  references: string[]
}

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
  const [message, setMessage] = useState('')
  const [items, setItems] = useState<ScanItem[]>([])

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
          {items.map((item) => {
            const key = `${item.bucket}/${item.path}`
            return (
              <div key={key} className="rounded-xl border bg-white p-4">
                <div className="grid gap-3 md:grid-cols-[140px_1fr_auto] md:items-start">
                  <div className="overflow-hidden rounded-lg border bg-zinc-50">
                    <img
                      src={item.publicUrl}
                      alt={item.path}
                      className="h-28 w-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">bucket：</span>{item.bucket}</p>
                    <p className="break-all"><span className="font-medium">path：</span>{item.path}</p>
                    <p className="break-all"><span className="font-medium">publicUrl：</span>{item.publicUrl}</p>
                    <p>
                      <span className="font-medium">状态：</span>
                      {item.isUsed ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-100">正在使用</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-100">疑似未使用</span>
                      )}
                    </p>
                    <p>
                      <span className="font-medium">引用来源：</span>
                      {item.references.length > 0 ? item.references.join('、') : '无'}
                    </p>
                  </div>

                  <div>
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
                  </div>
                </div>
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
