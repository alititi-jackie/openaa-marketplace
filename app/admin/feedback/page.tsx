'use client'

import { useState, useEffect, Suspense } from 'react'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'
import AdminPageHeader from '@/components/AdminPageHeader'
import BackToTopButton from '@/components/BackToTopButton'
import { useAutoMessage } from '@/hooks/useAutoMessage'

type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'ignored'

interface FeedbackPost {
  id: string
  user_id: string | null
  type: string
  contact: string | null
  related_url: string | null
  content: string
  status: FeedbackStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已处理', value: 'resolved' },
  { label: '忽略', value: 'ignored' },
]

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已处理',
  ignored: '已忽略',
}

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  processing: 'bg-blue-50 text-blue-700 ring-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ignored: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
}

const STATUS_PRIORITY: Record<FeedbackStatus, number> = {
  pending: 0,
  processing: 1,
  ignored: 2,
  resolved: 3,
}

function toStatus(value: string | null | undefined): FeedbackStatus {
  const valid: FeedbackStatus[] = ['pending', 'processing', 'resolved', 'ignored']
  return valid.includes(value as FeedbackStatus) ? (value as FeedbackStatus) : 'pending'
}

function sortFeedbackPosts(posts: FeedbackPost[]): FeedbackPost[] {
  return [...posts].sort((a, b) => {
    const statusDiff = STATUS_PRIORITY[toStatus(a.status)] - STATUS_PRIORITY[toStatus(b.status)]
    if (statusDiff !== 0) return statusDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function FeedbackCard({
  post,
  token,
  onUpdated,
  onDeleted,
}: {
  post: FeedbackPost
  token: string
  onUpdated: (updated: FeedbackPost) => void
  onDeleted: (id: string) => void
}) {
  const [noteInput, setNoteInput] = useState(post.admin_note ?? '')
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useAutoMessage()

  const status = toStatus(post.status)

  async function handleStatusChange(newStatus: FeedbackStatus) {
    setUpdating(true)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/feedback/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ status: newStatus }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const errMsg =
          json !== null &&
          typeof json === 'object' &&
          'error' in json &&
          typeof (json as Record<string, unknown>).error === 'string'
            ? (json as { error: string }).error
            : '更新失败'
        setMessage(errMsg)
        return
      }
      if (
        json !== null &&
        typeof json === 'object' &&
        'data' in json
      ) {
        onUpdated((json as { data: FeedbackPost }).data)
      }
    } catch {
      setMessage('网络错误，请稍后重试')
    } finally {
      setUpdating(false)
    }
  }

  async function handleSaveNote() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/feedback/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ admin_note: noteInput }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const errMsg =
          json !== null &&
          typeof json === 'object' &&
          'error' in json &&
          typeof (json as Record<string, unknown>).error === 'string'
            ? (json as { error: string }).error
            : '保存失败'
        setMessage(errMsg)
        return
      }
      if (
        json !== null &&
        typeof json === 'object' &&
        'data' in json
      ) {
        onUpdated((json as { data: FeedbackPost }).data)
      }
      setMessage('备注已保存')
    } catch {
      setMessage('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这条反馈吗？')) return
    setDeleting(true)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/feedback/${post.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      })
      if (!res.ok) {
        const json: unknown = await res.json()
        const errMsg =
          json !== null &&
          typeof json === 'object' &&
          'error' in json &&
          typeof (json as Record<string, unknown>).error === 'string'
            ? (json as { error: string }).error
            : '删除失败'
        setMessage(errMsg)
        return
      }
      onDeleted(post.id)
    } catch {
      setMessage('网络错误，请稍后重试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS_COLORS[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
        <span className="inline-flex shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200">
          {post.type}
        </span>
        <span className="ml-auto text-xs text-zinc-400">{formatDate(post.created_at)}</span>
      </div>

      {/* Content */}
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-800">{post.content}</p>

      {/* Meta */}
      <div className="mt-2 space-y-1 text-xs text-zinc-500">
        <p>
          联系方式：<span className="text-zinc-700">{post.contact || '未填写'}</span>
        </p>
        {post.related_url ? (
          <p>
            相关页面：{' '}
            <a
              href={post.related_url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-blue-600 underline hover:text-blue-800"
            >
              打开相关页面
            </a>
          </p>
        ) : null}
      </div>

      {/* Admin note */}
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-zinc-500">后台备注</label>
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          rows={2}
          placeholder="输入备注（仅管理员可见）"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {status !== 'processing' ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => handleStatusChange('processing')}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            标记处理中
          </button>
        ) : null}
        {status !== 'resolved' ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => handleStatusChange('resolved')}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            标记已处理
          </button>
        ) : null}
        {status !== 'ignored' ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => handleStatusChange('ignored')}
            className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
          >
            忽略
          </button>
        ) : null}
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveNote}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存备注'}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="ml-auto rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          {deleting ? '删除中...' : '删除'}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-2 text-xs ${message.includes('成功') || message.includes('保存') ? 'text-emerald-600' : 'text-red-500'}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}

function FeedbackAdminContent() {
  const DEFAULT_USER_DAILY_LIMIT = 5
  const DEFAULT_TOTAL_DAILY_LIMIT = 100
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [isUsingUnifiedToken, setIsUsingUnifiedToken] = useState(false)
  const [showTokenEditor, setShowTokenEditor] = useState(false)
  const [posts, setPosts] = useState<FeedbackPost[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [userDailyLimitInput, setUserDailyLimitInput] = useState(String(DEFAULT_USER_DAILY_LIMIT))
  const [totalDailyLimitInput, setTotalDailyLimitInput] = useState(String(DEFAULT_TOTAL_DAILY_LIMIT))
  const [fetchingSettings, setFetchingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useAutoMessage()

  async function fetchFeedback(t: string, status?: string) {
    if (!t) return
    setLoading(true)
    setMessage('')
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (status) params.set('status', status)
      const res = await fetch(`/api/admin/feedback?${params.toString()}`, {
        headers: { 'x-admin-token': t },
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const errMsg =
          json !== null &&
          typeof json === 'object' &&
          'error' in json &&
          typeof (json as Record<string, unknown>).error === 'string'
            ? (json as { error: string }).error
            : '加载失败'
        setMessage(errMsg)
        return
      }
      if (
        json !== null &&
        typeof json === 'object' &&
        'data' in json &&
        Array.isArray((json as { data: unknown }).data)
      ) {
        setPosts(sortFeedbackPosts((json as { data: FeedbackPost[] }).data))
      }
    } catch {
      setMessage('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFeedbackSettings(t: string) {
    if (!t) return
    setFetchingSettings(true)
    setSettingsMessage('')
    try {
      const res = await fetch('/api/admin/feedback/settings', {
        headers: { 'x-admin-token': t },
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const errMsg =
          json !== null &&
          typeof json === 'object' &&
          'error' in json &&
          typeof (json as Record<string, unknown>).error === 'string'
            ? (json as { error: string }).error
            : '加载设置失败'
        setSettingsMessage(errMsg)
        return
      }
      if (
        json !== null &&
        typeof json === 'object' &&
        'userDailyLimit' in json &&
        typeof (json as Record<string, unknown>).userDailyLimit === 'number' &&
        'totalDailyLimit' in json &&
        typeof (json as Record<string, unknown>).totalDailyLimit === 'number'
      ) {
        setUserDailyLimitInput(String((json as { userDailyLimit: number }).userDailyLimit))
        setTotalDailyLimitInput(String((json as { totalDailyLimit: number }).totalDailyLimit))
      }
    } catch {
      setSettingsMessage('网络错误，请稍后重试')
    } finally {
      setFetchingSettings(false)
    }
  }

  useEffect(() => {
    const saved = getAdminToken()
    if (saved) {
      setToken(saved)
      setTokenInput(saved)
      setIsUsingUnifiedToken(true)
      fetchFeedback(saved, '')
      fetchFeedbackSettings(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function saveToken() {
    const nextToken = tokenInput.trim()
    if (!nextToken) {
      setMessage('请输入 Admin Token')
      return
    }
    setAdminToken(nextToken)
    setToken(nextToken)
    setIsUsingUnifiedToken(true)
    setShowTokenEditor(false)
    setMessage('')
    fetchFeedback(nextToken, statusFilter)
    fetchFeedbackSettings(nextToken)
  }

  function logoutAdmin() {
    clearAdminToken()
    setToken('')
    setTokenInput('')
    setIsUsingUnifiedToken(false)
    setShowTokenEditor(false)
    setPosts([])
    setMessage('')
    setUserDailyLimitInput(String(DEFAULT_USER_DAILY_LIMIT))
    setTotalDailyLimitInput(String(DEFAULT_TOTAL_DAILY_LIMIT))
    setSettingsMessage('')
  }

  function handleFilterChange(status: string) {
    setStatusFilter(status)
    fetchFeedback(token, status)
  }

  function handleUpdated(updated: FeedbackPost) {
    setPosts((prev) => sortFeedbackPosts(prev.map((p) => (p.id === updated.id ? updated : p))))
  }

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsMessage('')

    const userDailyLimit = parseInt(userDailyLimitInput, 10)
    const totalDailyLimit = parseInt(totalDailyLimitInput, 10)

    if (
      !Number.isInteger(userDailyLimit) ||
      !Number.isInteger(totalDailyLimit) ||
      userDailyLimit < 1 ||
      userDailyLimit > 1000 ||
      totalDailyLimit < 1 ||
      totalDailyLimit > 1000
    ) {
      setSettingsMessage('请输入 1~1000 之间的整数')
      return
    }
    if (userDailyLimit > totalDailyLimit) {
      setSettingsMessage('单个用户每日上限不能大于全站每日反馈总上限')
      return
    }

    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/feedback/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          userDailyLimit,
          totalDailyLimit,
        }),
      })

      const json: unknown = await res.json()
      if (!res.ok) {
        const errMsg =
          json !== null &&
          typeof json === 'object' &&
          'error' in json &&
          typeof (json as Record<string, unknown>).error === 'string'
            ? (json as { error: string }).error
            : '保存设置失败'
        setSettingsMessage(errMsg)
        return
      }

      if (
        json !== null &&
        typeof json === 'object' &&
        'userDailyLimit' in json &&
        typeof (json as Record<string, unknown>).userDailyLimit === 'number' &&
        'totalDailyLimit' in json &&
        typeof (json as Record<string, unknown>).totalDailyLimit === 'number'
      ) {
        setUserDailyLimitInput(String((json as { userDailyLimit: number }).userDailyLimit))
        setTotalDailyLimitInput(String((json as { totalDailyLimit: number }).totalDailyLimit))
      }
      setSettingsMessage('保存成功')
    } catch {
      setSettingsMessage('网络错误，请稍后重试')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <AdminPageHeader
        title="反馈与举报管理"
        description="查看用户提交的信息举报、页面错误、功能建议、新闻线索和其它反馈。"
        isLoggedIn={isUsingUnifiedToken}
        onLogout={logoutAdmin}
        onChangeToken={() => setShowTokenEditor((prev) => !prev)}
      />

      {/* Token section */}
      {!token || showTokenEditor ? (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <label className="mb-1 block text-sm font-medium text-zinc-700">Admin Token</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="输入管理 Token"
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={saveToken}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showTokenEditor ? '更新 Token' : '保存 Token'}
            </button>
          </div>
          {!token ? (
            <p className="mt-2 text-xs text-zinc-500">
              或先前往{' '}
              <a href="/admin" className="text-blue-600 underline hover:text-blue-800">
                /admin
              </a>{' '}
              登录后台。
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Filters */}
      {token && !showTokenEditor ? (
        <>
          <form onSubmit={handleSaveSettings} className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-semibold text-zinc-900">反馈提交设置</h2>
            <p className="mt-1 text-xs text-zinc-500">
              用于限制每天反馈提交数量，防止垃圾反馈或恶意刷提交。
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">单个用户 / 访客每日上限</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={userDailyLimitInput}
                  onChange={(e) => setUserDailyLimitInput(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">全站每日反馈总上限</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={totalDailyLimitInput}
                  onChange={(e) => setTotalDailyLimitInput(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {settingsMessage ? (
              <p
                className={`mt-3 text-sm ${settingsMessage.includes('成功') ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {settingsMessage}
              </p>
            ) : null}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={fetchingSettings}
                onClick={() => fetchFeedbackSettings(token)}
                className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-200 disabled:opacity-50"
              >
                {fetchingSettings ? '加载中...' : '重新加载'}
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSettings ? '保存中...' : '保存设置'}
              </button>
            </div>
          </form>

          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFilterChange(f.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors ${
                  statusFilter === f.value
                    ? 'bg-blue-600 text-white ring-blue-600'
                    : 'bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              disabled={loading}
              onClick={() => fetchFeedback(token, statusFilter)}
              className="ml-auto rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>

          {message ? (
            <p className="mb-4 text-sm text-red-500">{message}</p>
          ) : null}

          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-400">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-400">暂无反馈记录</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <FeedbackCard
                  key={post.id}
                  post={post}
                  token={token}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export default function AdminFeedbackPage() {
  return (
    <>
      <Suspense fallback={<div className="flex justify-center py-20 text-sm text-zinc-400">加载中...</div>}>
        <FeedbackAdminContent />
      </Suspense>
      <BackToTopButton />
    </>
  )
}
