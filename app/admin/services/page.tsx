'use client'

import { useState, useEffect, useCallback } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { LOCATION_OPTIONS } from '@/lib/locationOptions'
import type { ServicePost } from '@/types'

const SERVICE_CATEGORIES_FILTER = [
  '全部',
  '装修维修',
  '搬家运输',
  '家政清洁',
  '汽车相关',
  '专业服务',
  '电脑手机',
  '餐饮商业',
  '其它服务',
] as const

const SERVICE_LOCATIONS_FILTER = [
  '全部',
  ...LOCATION_OPTIONS,
] as const

const STATUS_FILTERS = [
  { key: 'all', label: '全部状态' },
  { key: 'active', label: '显示中' },
  { key: 'hidden', label: '已隐藏' },
  { key: 'deleted', label: '已删除' },
] as const

type StatusFilter = 'all' | 'active' | 'hidden' | 'deleted'

function formatDate(s: string | null) {
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

function statusBadge(status: string, isActive: boolean) {
  if (status === 'deleted') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">已删除</span>
  if (status === 'hidden' || !isActive) return <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100">已隐藏</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">显示中</span>
}

function AdminServicesContent() {
  const [token, setToken] = useState('')
  const [inputToken, setInputToken] = useState('')
  const [posts, setPosts] = useState<ServicePost[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [locationFilter, setLocationFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const fetchPosts = useCallback(async (t: string) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/services', {
        headers: { 'x-admin-token': t },
      })
      const json: unknown = await res.json()
      if (
        json !== null &&
        typeof json === 'object' &&
        'data' in json &&
        Array.isArray((json as Record<string, unknown>).data)
      ) {
        setPosts((json as { data: ServicePost[] }).data)
      } else if (
        json !== null &&
        typeof json === 'object' &&
        'error' in json
      ) {
        setMessage((json as { error: string }).error || '获取失败')
      }
    } catch {
      setMessage('网络错误')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''
    const t = stored || ''
    if (t) {
      setToken(t)
      setInputToken(t)
      fetchPosts(t)
    }
  }, [fetchPosts])

  function saveToken() {
    localStorage.setItem('admin_token', inputToken)
    setToken(inputToken)
    fetchPosts(inputToken)
  }

  async function handleStatusChange(id: string, status: 'active' | 'hidden' | 'deleted') {
    const isActive = status === 'active'
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'x-admin-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, is_active: isActive }),
      })
      const json: unknown = await res.json()
      if (
        json !== null &&
        typeof json === 'object' &&
        'data' in json
      ) {
        setPosts((prev) =>
          prev.map((p) => p.id === id ? { ...p, status, is_active: isActive } : p)
        )
      } else {
        setMessage(
          (json !== null && typeof json === 'object' && 'error' in json)
            ? (json as { error: string }).error
            : '操作失败'
        )
      }
    } catch {
      setMessage('网络错误')
    }
  }

  const filtered = posts.filter((p) => {
    const matchCat = categoryFilter === '全部' || p.category === categoryFilter
    const matchLoc = locationFilter === '全部' || p.location === locationFilter
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.status === 'active' && p.is_active) ||
      (statusFilter === 'hidden' && (p.status === 'hidden' || (!p.is_active && p.status !== 'deleted'))) ||
      (statusFilter === 'deleted' && p.status === 'deleted')
    const q = search.trim().toLowerCase()
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.wechat || '').toLowerCase().includes(q) ||
      (p.contact_name || '').toLowerCase().includes(q)
    return matchCat && matchLoc && matchStatus && matchSearch
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">本地服务管理</h1>

      {/* Token input */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <label className="block text-sm font-medium mb-1">Admin Token</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
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
      </div>

      {message && (
        <p className={`mb-4 text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索标题 / 联系人 / 电话 / 微信..."
          className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES_FILTER.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={
                'px-3 py-1 rounded-full text-xs font-medium border transition ' +
                (categoryFilter === cat
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
              }
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SERVICE_LOCATIONS_FILTER.map((loc) => (
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
              {loc === '全部' ? '全部地区' : loc}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.key}
              type="button"
              onClick={() => setStatusFilter(sf.key)}
              className={
                'px-3 py-1 rounded-full text-xs font-medium border transition ' +
                (statusFilter === sf.key
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
              }
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500 mb-4">加载中...</p>}

      {!loading && filtered.length === 0 && token && (
        <p className="text-sm text-gray-400 mb-4">暂无符合条件的服务信息</p>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((post) => (
          <div key={post.id} className="p-4 bg-white rounded-xl border shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{post.title}</span>
                  {statusBadge(post.status, post.is_active)}
                  <span className="text-xs text-gray-500 bg-zinc-50 px-2 py-0.5 rounded-full ring-1 ring-zinc-100">
                    {post.category}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>📍 {post.location}</span>
                  {post.contact_name ? <span>👤 {post.contact_name}</span> : null}
                  {post.phone ? <span>📞 {post.phone}</span> : null}
                  {post.wechat ? <span>💬 {post.wechat}</span> : null}
                  <span>🕒 {formatDate(post.created_at)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <Link
                  href={`/services/${post.id}`}
                  target="_blank"
                  className="text-xs px-3 py-1.5 rounded-lg border text-gray-700 hover:bg-gray-50 transition"
                >
                  查看
                </Link>
                {post.status !== 'active' || !post.is_active ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(post.id, 'active')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                  >
                    恢复
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(post.id, 'hidden')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                  >
                    下架
                  </button>
                )}
                {post.status !== 'deleted' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('确认删除此服务信息？')) {
                        handleStatusChange(post.id, 'deleted')
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
      <AdminServicesContent />
    </Suspense>
  )
}
