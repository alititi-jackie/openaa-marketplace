'use client'

import { useEffect, useRef, useState } from 'react'
import AdminPageHeader from '@/components/AdminPageHeader'
import BackToTopButton from '@/components/BackToTopButton'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'

type OpenMode = 'same' | 'new'

type TopQuickLink = {
  id: string
  title: string
  url: string
  sort_order: number
  is_active: boolean
  open_mode: OpenMode
  created_at: string
}

type FormState = {
  title: string
  url: string
  sort_order: number
  is_active: boolean
  open_mode: OpenMode
}

const EMPTY_FORM: FormState = {
  title: '',
  url: '',
  sort_order: 0,
  is_active: true,
  open_mode: 'same',
}

export default function AdminTopLinksPage() {
  const formRef = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [isUsingUnifiedToken, setIsUsingUnifiedToken] = useState(false)
  const [showTokenEditor, setShowTokenEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [links, setLinks] = useState<TopQuickLink[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function fetchTopLinks(adminToken: string) {
    if (!adminToken) return
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/admin/top-links', {
        headers: { 'x-admin-token': adminToken },
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '加载失败')
            : '加载失败'
        setErrorMessage(err)
        return
      }
      if (
        json !== null &&
        typeof json === 'object' &&
        'data' in json &&
        Array.isArray((json as Record<string, unknown>).data)
      ) {
        setLinks((json as { data: TopQuickLink[] }).data)
      } else {
        setErrorMessage('加载失败')
      }
    } catch {
      setErrorMessage('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stored = getAdminToken().trim()
    if (!stored) return
    setToken(stored)
    setTokenInput(stored)
    setIsUsingUnifiedToken(true)
    void fetchTopLinks(stored)
  }, [])

  function saveToken() {
    const nextToken = tokenInput.trim()
    if (!nextToken) {
      setErrorMessage('请输入 Admin Token')
      return
    }
    setAdminToken(nextToken)
    setToken(nextToken)
    setTokenInput(nextToken)
    setIsUsingUnifiedToken(true)
    setShowTokenEditor(false)
    setErrorMessage('')
    setSuccessMessage('')
    void fetchTopLinks(nextToken)
  }

  function logoutAdmin() {
    clearAdminToken()
    setToken('')
    setTokenInput('')
    setIsUsingUnifiedToken(false)
    setShowTokenEditor(false)
    setLinks([])
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrorMessage('')
    setSuccessMessage('')
  }

  function startEdit(item: TopQuickLink) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      url: item.url,
      sort_order: item.sort_order,
      is_active: item.is_active,
      open_mode: item.open_mode,
    })
    setErrorMessage('')
    setSuccessMessage('')
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const title = form.title.trim()
    const url = form.url.trim()
    if (!title) {
      setErrorMessage('名称不能为空')
      return
    }
    if (!url) {
      setErrorMessage('链接不能为空')
      return
    }
    if (!Number.isInteger(form.sort_order) || form.sort_order < 0) {
      setErrorMessage('排序必须是大于等于 0 的整数')
      return
    }
    if (form.open_mode !== 'same' && form.open_mode !== 'new') {
      setErrorMessage('打开方式无效')
      return
    }
    if (!token) {
      setErrorMessage('请先输入 Admin Token')
      return
    }

    setSaving(true)
    try {
      const isEditing = Boolean(editingId)
      const endpoint = isEditing ? `/api/admin/top-links/${editingId}` : '/api/admin/top-links'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          title,
          url,
          sort_order: form.sort_order,
          is_active: form.is_active,
          open_mode: form.open_mode,
        }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '保存失败')
            : '保存失败'
        setErrorMessage(err)
        return
      }
      setSuccessMessage(isEditing ? '更新成功' : '新增成功')
      resetForm()
      await fetchTopLinks(token)
    } catch {
      setErrorMessage('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!token) return
    if (!confirm('确认删除该快捷入口吗？')) return

    setErrorMessage('')
    setSuccessMessage('')
    try {
      const res = await fetch(`/api/admin/top-links/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '删除失败')
            : '删除失败'
        setErrorMessage(err)
        return
      }
      setSuccessMessage('删除成功')
      if (editingId === id) resetForm()
      await fetchTopLinks(token)
    } catch {
      setErrorMessage('网络错误，请稍后重试')
    }
  }

  async function toggleActive(item: TopQuickLink) {
    if (!token) return
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const res = await fetch(`/api/admin/top-links/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          is_active: !item.is_active,
        }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '操作失败')
            : '操作失败'
        setErrorMessage(err)
        return
      }
      setSuccessMessage(!item.is_active ? '已启用' : '已停用')
      await fetchTopLinks(token)
    } catch {
      setErrorMessage('网络错误，请稍后重试')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      <AdminPageHeader
        title="顶部快捷入口管理"
        description='管理 LOGO 栏左侧“纽约”展开后的快捷导航入口'
        isLoggedIn={isUsingUnifiedToken}
        onChangeToken={() => setShowTokenEditor((prev) => !prev)}
        onLogout={logoutAdmin}
      />

      {!token || showTokenEditor ? (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-gray-50 p-4">
          <label className="mb-1 block text-sm font-medium">Admin Token</label>
          <div className="flex flex-col gap-2 sm:flex-row">
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
        </div>
      ) : null}

      {errorMessage ? <p className="mb-4 text-sm text-red-500">{errorMessage}</p> : null}
      {successMessage ? <p className="mb-4 text-sm text-green-600">{successMessage}</p> : null}

      {token ? (
        <>
          <div ref={formRef} className="mb-6 scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">{editingId ? '编辑快捷入口' : '新增快捷入口'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">名称</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="例如：招聘"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">链接</label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="例如：/jobs 或 https://example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">排序</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.sort_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">打开方式</label>
                <select
                  value={form.open_mode}
                  onChange={(e) => setForm((prev) => ({ ...prev, open_mode: e.target.value as OpenMode }))}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option value="same">当前窗口</option>
                  <option value="new">新窗口</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                启用该入口
              </label>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? '保存中...' : editingId ? '保存修改' : '新增入口'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
                  >
                    取消编辑
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {loading ? <p className="text-sm text-zinc-500">加载中...</p> : null}
            {!loading && links.length === 0 ? <p className="text-sm text-zinc-400">暂无快捷入口</p> : null}
            {links.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                    <p className="break-all text-sm text-zinc-600">{item.url}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>排序：{item.sort_order}</span>
                      <span className={`rounded-full px-2 py-0.5 ring-1 ${item.is_active ? 'bg-green-50 text-green-700 ring-green-100' : 'bg-zinc-100 text-zinc-600 ring-zinc-200'}`}>
                        {item.is_active ? '启用中' : '已停用'}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-100">
                        {item.open_mode === 'new' ? '新窗口' : '当前窗口'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void toggleActive(item)
                      }}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      {item.is_active ? '停用' : '启用'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDelete(item.id)
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <BackToTopButton />
    </div>
  )
}
