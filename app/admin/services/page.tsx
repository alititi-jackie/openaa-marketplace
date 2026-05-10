'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { LOCATION_OPTIONS } from '@/lib/locationOptions'
import type { ServicePost } from '@/types'
import { getAdminToken, setAdminToken } from '@/lib/adminToken'

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
type PinFormState = {
  is_pinned: boolean
  pinned_order: number
  pinned_until: string
}

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

function toSortableTime(value: string | null | undefined): number {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function isEffectivePinned(post: ServicePost, nowTime: number): boolean {
  if (!post.is_pinned) return false
  if (!post.pinned_until) return true
  return toSortableTime(post.pinned_until) > nowTime
}

function formatPinnedUntil(value: string | null | undefined): string {
  if (!value) return '长期置顶'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toDatetimeLocalValue(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function AdminServicesContent() {
  const formRef = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState('')
  const [inputToken, setInputToken] = useState('')
  const [posts, setPosts] = useState<ServicePost[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [locationFilter, setLocationFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [pinEditingId, setPinEditingId] = useState<string | null>(null)
  const [pinForm, setPinForm] = useState<PinFormState>({
    is_pinned: false,
    pinned_order: 0,
    pinned_until: '',
  })

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
    const stored = getAdminToken()
    if (stored) {
      setToken(stored)
      setInputToken(stored)
      fetchPosts(stored)
    }
  }, [fetchPosts])

  function saveToken() {
    setAdminToken(inputToken)
    setToken(inputToken)
    fetchPosts(inputToken)
  }

  function scrollToForm() {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function startPinSettings(post: ServicePost) {
    setPinEditingId(post.id)
    setPinForm({
      is_pinned: post.is_pinned === true,
      pinned_order:
        typeof post.pinned_order === 'number' && Number.isInteger(post.pinned_order) && post.pinned_order >= 0
          ? post.pinned_order
          : 0,
      pinned_until: toDatetimeLocalValue(post.pinned_until),
    })
    setMessage('')
    scrollToForm()
  }

  async function updatePost(id: string, payload: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'x-admin-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json: unknown = await res.json()
      if (
        json !== null &&
        typeof json === 'object' &&
        'data' in json &&
        (json as { data?: ServicePost }).data
      ) {
        const updated = (json as { data: ServicePost }).data
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)))
        return true
      }

      setMessage(
        (json !== null && typeof json === 'object' && 'error' in json)
          ? String((json as { error?: string }).error || '操作失败')
          : '操作失败'
      )
      return false
    } catch {
      setMessage('网络错误')
      return false
    }
  }

  async function handleStatusChange(id: string, status: 'active' | 'hidden' | 'deleted') {
    const isActive = status === 'active'
    await updatePost(id, { status, is_active: isActive })
  }

  async function submitPinSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!pinEditingId) return
    if (!Number.isInteger(pinForm.pinned_order) || pinForm.pinned_order < 0) {
      setMessage('置顶排序必须是大于等于 0 的整数')
      return
    }

    const ok = await updatePost(pinEditingId, {
      is_pinned: pinForm.is_pinned,
      pinned_order: pinForm.pinned_order,
      pinned_until: pinForm.pinned_until.trim() || null,
    })
    if (ok) {
      setMessage('置顶设置保存成功')
    }
  }

  const filtered = useMemo(() => {
    const nowTime = Date.now()
    return posts
      .filter((p) => {
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
      .sort((a, b) => {
        const aPinned = isEffectivePinned(a, nowTime)
        const bPinned = isEffectivePinned(b, nowTime)
        if (aPinned !== bPinned) return aPinned ? -1 : 1

        if (aPinned && bPinned) {
          const pinnedOrderDiff = (a.pinned_order ?? 0) - (b.pinned_order ?? 0)
          if (pinnedOrderDiff !== 0) return pinnedOrderDiff

          const createdAtDiff = toSortableTime(b.created_at) - toSortableTime(a.created_at)
          if (createdAtDiff !== 0) return createdAtDiff
        }

        return toSortableTime(b.created_at) - toSortableTime(a.created_at)
      })
  }, [posts, categoryFilter, locationFilter, statusFilter, search])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
      >
        ← 返回总后台
      </Link>
      <h1 className="text-2xl font-bold mb-6 mt-3">本地服务管理</h1>

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

      {pinEditingId && (
        <div ref={formRef} className="mb-4 scroll-mt-24 rounded-xl border bg-white p-4 shadow-sm">
          <form onSubmit={submitPinSettings} className="space-y-3">
            <h2 className="text-base font-semibold">置顶设置</h2>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={pinForm.is_pinned}
                onChange={(e) => setPinForm((prev) => ({ ...prev, is_pinned: e.target.checked }))}
              />
              设为置顶
            </label>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">置顶排序</label>
              <input
                type="number"
                min={0}
                step={1}
                value={pinForm.pinned_order}
                onChange={(e) => setPinForm((prev) => ({ ...prev, pinned_order: Number(e.target.value) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">数字越小越靠前，0 为最高优先级；数字相同时，发布时间较新的排前。</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">置顶到期时间（可选）</label>
              <input
                type="datetime-local"
                value={pinForm.pinned_until}
                onChange={(e) => setPinForm((prev) => ({ ...prev, pinned_until: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">留空表示长期置顶。</p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                保存置顶设置
              </button>
              <button
                type="button"
                onClick={() => setPinEditingId(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

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
                  {post.is_pinned ? (
                    <>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">已置顶</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                        排序 {post.pinned_order ?? 0}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                        {post.pinned_until ? `到期：${formatPinnedUntil(post.pinned_until)}` : '长期置顶'}
                      </span>
                    </>
                  ) : null}
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
                <button
                  type="button"
                  onClick={() => startPinSettings(post)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  置顶设置
                </button>
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
