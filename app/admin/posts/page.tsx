'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { LOCATION_OPTIONS } from '@/lib/locationOptions'
import type { UnifiedPost } from '@/types'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'

const MODULE_FILTERS = [
  { key: 'all', label: '全部模块' },
  { key: 'jobs', label: '招聘' },
  { key: 'housing', label: '房屋' },
  { key: 'secondhand', label: '二手' },
] as const

const STATUS_FILTERS = [
  { key: 'all', label: '全部状态' },
  { key: 'published', label: '显示中' },
  { key: 'hidden', label: '已隐藏' },
  { key: 'deleted', label: '已删除' },
] as const

const LOCATION_FILTER_OPTIONS = ['全部地区', ...LOCATION_OPTIONS] as const

type ModuleFilter = 'all' | 'jobs' | 'housing' | 'secondhand'
type StatusFilter = 'all' | 'published' | 'hidden' | 'deleted'

function formatDate(s: string | null | undefined) {
  if (!s) return ''
  try {
    return new Date(s).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return s
  }
}

function moduleBadge(module: string) {
  if (module === 'jobs') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        招聘
      </span>
    )
  }
  if (module === 'housing') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100">
        房屋
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
      二手
    </span>
  )
}

function statusBadge(status: string) {
  if (status === 'deleted') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
        已删除
      </span>
    )
  }
  if (status === 'hidden' || status === 'unpublished') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100">
        已隐藏
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
      显示中
    </span>
  )
}

function moduleDetailHref(post: UnifiedPost): string {
  if (post.module === 'jobs') return `/jobs/${post.id}`
  if (post.module === 'housing') return `/housing/${post.id}`
  return `/secondhand/${post.id}`
}

function typeLabel(post: UnifiedPost): string | null {
  if (post.module === 'jobs') {
    return post.type === 'seeking' ? '求职' : '招聘'
  }
  if (post.module === 'housing') {
    return post.type === 'seeking' ? '求租' : '出租'
  }
  if (post.module === 'secondhand') {
    return post.type === 'buying' ? '求购' : '出售'
  }
  return null
}

function formatPrice(post: UnifiedPost): string | null {
  if (post.module === 'jobs') {
    const min = post.salary_min
    const max = post.salary_max
    if (!min && !max) return null
    if (min && max && min > 0 && max > 0) return `$${min}–$${max}`
    if (min && min > 0) return `$${min}+`
    return null
  }
  const v = post.price_value
  if (v == null || v <= 0) return null
  return `$${v}`
}

/** Check whether a post is effectively hidden (status-wise) */
function isHidden(status: string) {
  return status === 'hidden' || status === 'unpublished'
}

function isActive(status: string) {
  return status === 'published'
}

function isDeleted(status: string) {
  return status === 'deleted'
}

function AdminPostsContent() {
  const [token, setToken] = useState('')
  const [inputToken, setInputToken] = useState('')
  const [isUsingUnifiedToken, setIsUsingUnifiedToken] = useState(false)
  const [showTokenEditor, setShowTokenEditor] = useState(false)
  const [posts, setPosts] = useState<UnifiedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [listSuccessMessage, setListSuccessMessage] = useState('')
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [locationFilter, setLocationFilter] = useState('全部地区')

  const fetchPosts = useCallback(async (t: string) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/posts', {
        headers: { 'x-admin-token': t },
      })
      const json: unknown = await res.json()
      if (
        json !== null &&
        typeof json === 'object' &&
        'data' in json &&
        Array.isArray((json as Record<string, unknown>).data)
      ) {
        setPosts((json as { data: UnifiedPost[] }).data)
        const warnings = (json as { warnings?: string[] }).warnings
        if (warnings && warnings.length > 0) {
          setMessage(`部分模块加载失败：${warnings.join('；')}`)
        }
      } else if (json !== null && typeof json === 'object' && 'error' in json) {
        setMessage((json as { error: string }).error || '获取失败')
      }
    } catch {
      setMessage('网络错误')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const stored = getAdminToken()
    if (stored) {
      setToken(stored)
      setInputToken(stored)
      setIsUsingUnifiedToken(true)
      fetchPosts(stored)
    }
  }, [fetchPosts])

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
    fetchPosts(nextToken)
  }

  function logoutAdmin() {
    clearAdminToken()
    setToken('')
    setInputToken('')
    setIsUsingUnifiedToken(false)
    setShowTokenEditor(false)
    setPosts([])
    setMessage('')
    setListSuccessMessage('')
  }

  async function updatePost(post: UnifiedPost, status: string) {
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'x-admin-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: post.module, status }),
      })
      const json: unknown = await res.json()
      if (json !== null && typeof json === 'object' && 'data' in json) {
        // Update local state: reflect new status
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id && p.module === post.module
              ? { ...p, status: status as UnifiedPost['status'] }
              : p
          )
        )
        return true
      }
      setMessage(
        json !== null && typeof json === 'object' && 'error' in json
          ? String((json as { error?: string }).error || '操作失败')
          : '操作失败'
      )
      return false
    } catch {
      setMessage('网络错误')
      return false
    }
  }

  async function handleHide(post: UnifiedPost) {
    const ok = await updatePost(post, 'hidden')
    if (ok) {
      setListSuccessMessage('已隐藏')
      setTimeout(() => setListSuccessMessage(''), 4000)
    }
  }

  async function handleRestore(post: UnifiedPost) {
    const ok = await updatePost(post, 'published')
    if (ok) {
      setListSuccessMessage('已恢复显示')
      setTimeout(() => setListSuccessMessage(''), 4000)
    }
  }

  async function handleDelete(post: UnifiedPost) {
    if (!confirm(`确认删除此${post.module === 'jobs' ? '招聘' : post.module === 'housing' ? '房屋' : '二手'}帖子？`)) {
      return
    }
    const ok = await updatePost(post, 'deleted')
    if (ok) {
      setListSuccessMessage('已标记为删除')
      setTimeout(() => setListSuccessMessage(''), 4000)
    }
  }

  const filtered = useMemo(() => {
    const locationKeyword = locationFilter === '全部地区' ? '' : locationFilter.split(' ')[0]
    return posts.filter((p) => {
      const matchModule = moduleFilter === 'all' || p.module === moduleFilter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && isActive(p.status)) ||
        (statusFilter === 'hidden' && isHidden(p.status)) ||
        (statusFilter === 'deleted' && isDeleted(p.status))
      const matchLocation =
        !locationKeyword ||
        (p.location || '').includes(locationKeyword)
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.contact_name || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.wechat || '').toLowerCase().includes(q)
      return matchModule && matchStatus && matchLocation && matchSearch
    })
  }, [posts, moduleFilter, statusFilter, locationFilter, search])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
      >
        ← 返回总后台
      </Link>
      <h1 className="text-2xl font-bold mb-6 mt-3">帖子管理</h1>

      {/* Token input */}
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

      {message && (
        <p className={`mb-4 text-sm ${message.includes('成功') || message.includes('已') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      {/* Filters */}
      {token ? (
        <div className="mb-4 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题 / 地区 / 联系人 / 电话 / 微信..."
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Module filter */}
          <div className="flex flex-wrap gap-2">
            {MODULE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setModuleFilter(f.key)}
                className={
                  'px-3 py-1 rounded-full text-xs font-medium border transition ' +
                  (moduleFilter === f.key
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={
                  'px-3 py-1 rounded-full text-xs font-medium border transition ' +
                  (statusFilter === f.key
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Location filter */}
          <div className="flex flex-wrap gap-2">
            {LOCATION_FILTER_OPTIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocationFilter(loc)}
                className={
                  'px-3 py-1 rounded-full text-xs font-medium border transition ' +
                  (locationFilter === loc
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
                }
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading && <p className="text-sm text-gray-500 mb-4">加载中...</p>}

      {!loading && token && filtered.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">暂无符合条件的帖子</p>
      )}

      {/* List */}
      <div className="space-y-3">
        {listSuccessMessage && (
          <p className="mb-2 text-sm text-green-600">{listSuccessMessage}</p>
        )}
        {filtered.map((post) => {
          const label = typeLabel(post)
          const price = formatPrice(post)
          const deleted = isDeleted(post.status)
          const active = isActive(post.status)
          return (
            <div key={`${post.module}-${post.id}`} className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm truncate">{post.title}</span>
                    {moduleBadge(post.module)}
                    {statusBadge(post.status)}
                    {label ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100">
                        {label}
                      </span>
                    ) : null}
                    {price ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 ring-1 ring-green-100">
                        {price}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-500">
                    {post.location ? <span>📍 {post.location}</span> : null}
                    {post.contact_name ? <span>👤 {post.contact_name}</span> : null}
                    {post.phone ? <span>📞 {post.phone}</span> : null}
                    {post.wechat ? <span>💬 {post.wechat}</span> : null}
                    <span>🕒 {formatDate(post.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Link
                    href={moduleDetailHref(post)}
                    target="_blank"
                    className="text-xs px-3 py-1.5 rounded-lg border text-gray-700 hover:bg-gray-50 transition"
                  >
                    查看
                  </Link>
                  {!active ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(post)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                    >
                      恢复
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleHide(post)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                    >
                      下架
                    </button>
                  )}
                  {!deleted ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(post)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
                    >
                      删除
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {token && !loading && filtered.length > 0 && (
        <p className="mt-4 text-xs text-gray-400 text-right">共 {filtered.length} 条</p>
      )}
    </div>
  )
}

export default function AdminPostsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
      <AdminPostsContent />
    </Suspense>
  )
}
