'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import AdminPageHeader from '@/components/AdminPageHeader'
import BackToTopButton from '@/components/BackToTopButton'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'
import { useAutoMessage } from '@/hooks/useAutoMessage'

// ─── Types ────────────────────────────────────────────────────────────────────

type OpenMode = 'auto' | 'same' | 'new'

interface NavCategory {
  id: string
  name: string
  slug: string
  sort_order: number
  display_limit: number
  is_active: boolean
}

interface NavLink {
  id: string
  category_id: string
  title: string
  url: string
  description: string | null
  open_mode: OpenMode
  sort_order: number
  is_active: boolean
}

interface LinkFormState {
  title: string
  url: string
  open_mode: OpenMode
  sort_order: number
  is_active: boolean
}

const EMPTY_LINK_FORM: LinkFormState = {
  title: '',
  url: '',
  open_mode: 'auto',
  sort_order: 0,
  is_active: true,
}

const OPEN_MODE_LABELS: Record<OpenMode, string> = {
  auto: '自动',
  same: '当前窗口',
  new: '新窗口',
}

function linkToFormState(link: NavLink): LinkFormState {
  return {
    title: link.title,
    url: link.url,
    open_mode: link.open_mode,
    sort_order: link.sort_order,
    is_active: link.is_active,
  }
}

// ─── CategoryRow ──────────────────────────────────────────────────────────────

function CategoryRow({
  cat,
  token,
  onUpdated,
}: {
  cat: NavCategory
  token: string
  onUpdated: (updated: NavCategory) => void
}) {
  const [name, setName] = useState(cat.name)
  const [sortOrder, setSortOrder] = useState(String(cat.sort_order))
  const [displayLimit, setDisplayLimit] = useState(String(cat.display_limit))
  const [isActive, setIsActive] = useState(cat.is_active)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useAutoMessage()

  async function handleSave() {
    const sortNum = Number(sortOrder)
    const limitNum = Number(displayLimit)

    if (!name.trim()) { setMsg('分类名称不能为空'); return }
    if (!Number.isInteger(sortNum) || sortNum < 0) { setMsg('排序必须是大于等于 0 的整数'); return }
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) { setMsg('显示数量必须是 1–50 的整数'); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/navigation/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          name: name.trim(),
          sort_order: sortNum,
          display_limit: limitNum,
          is_active: isActive,
        }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '保存失败')
            : '保存失败'
        setMsg(err)
        return
      }
      const updated = (json as { data: NavCategory }).data
      onUpdated(updated)
      setMsg('保存成功')
    } catch {
      setMsg('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 font-mono">
          {cat.slug}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">分类名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">排序</label>
          <input
            type="number"
            min={0}
            step={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">前台显示数量</label>
          <input
            type="number"
            min={1}
            max={50}
            step={1}
            value={displayLimit}
            onChange={(e) => setDisplayLimit(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            前台显示
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => { void handleSave() }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
      {msg ? (
        <p className={`text-xs ${msg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
          {msg}
        </p>
      ) : null}
    </div>
  )
}

// ─── LinkRow ──────────────────────────────────────────────────────────────────

function LinkRow({
  link,
  token,
  onUpdated,
  onDeleted,
}: {
  link: NavLink
  token: string
  onUpdated: (updated: NavLink) => void
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<LinkFormState>(linkToFormState(link))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useAutoMessage()

  async function handleSave() {
    if (!form.title.trim()) { setMsg('名称不能为空'); return }
    if (!form.url.trim()) { setMsg('链接不能为空'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/navigation/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          title: form.title.trim(),
          url: form.url.trim(),
          open_mode: form.open_mode,
          sort_order: form.sort_order,
          is_active: form.is_active,
        }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '保存失败')
            : '保存失败'
        setMsg(err)
        return
      }
      const updated = (json as { data: NavLink }).data
      onUpdated(updated)
      setEditing(false)
      setMsg('保存成功')
    } catch {
      setMsg('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/navigation/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ is_active: !link.is_active }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '操作失败')
            : '操作失败'
        setMsg(err)
        return
      }
      onUpdated((json as { data: NavLink }).data)
    } catch {
      setMsg('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`确认隐藏"${link.title}"吗？`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/navigation/links/${link.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '删除失败')
            : '删除失败'
        setMsg(err)
        return
      }
      onDeleted(link.id)
    } catch {
      setMsg('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">网站名称</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">网址</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">打开方式</label>
            <select
              value={form.open_mode}
              onChange={(e) => setForm((p) => ({ ...p, open_mode: e.target.value as OpenMode }))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="auto">自动</option>
              <option value="same">当前窗口</option>
              <option value="new">新窗口</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">排序</label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
          />
          前台显示
        </label>
        {msg ? (
          <p className={`text-xs ${msg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => { void handleSave() }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-zinc-900 truncate">{link.title}</p>
        <p className="break-all text-xs text-zinc-500">{link.url}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 ring-1 ${link.is_active ? 'bg-green-50 text-green-700 ring-green-100' : 'bg-zinc-100 text-zinc-500 ring-zinc-200'}`}>
            {link.is_active ? '显示' : '隐藏'}
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-100">
            {OPEN_MODE_LABELS[link.open_mode]}
          </span>
          <span className="text-zinc-400">排序 {link.sort_order}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => { setForm(linkToFormState(link)); setEditing(true) }}
          className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          编辑
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => { void handleToggle() }}
          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
        >
          {link.is_active ? '隐藏' : '显示'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => { void handleDelete() }}
          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
        >
          删除
        </button>
      </div>
      {msg ? (
        <p className={`text-xs w-full ${msg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
      ) : null}
    </div>
  )
}

// ─── AddLinkForm ──────────────────────────────────────────────────────────────

function AddLinkForm({
  categoryId,
  token,
  onAdded,
  onCancel,
}: {
  categoryId: string
  token: string
  onAdded: (link: NavLink) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<LinkFormState>(EMPTY_LINK_FORM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useAutoMessage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setMsg('名称不能为空'); return }
    if (!form.url.trim()) { setMsg('链接不能为空'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/navigation/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          category_id: categoryId,
          title: form.title.trim(),
          url: form.url.trim(),
          open_mode: form.open_mode,
          sort_order: form.sort_order,
          is_active: form.is_active,
        }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err =
          json !== null && typeof json === 'object' && 'error' in json
            ? String((json as Record<string, unknown>).error || '新增失败')
            : '新增失败'
        setMsg(err)
        return
      }
      onAdded((json as { data: NavLink }).data)
      setForm(EMPTY_LINK_FORM)
    } catch {
      setMsg('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-2 mt-2">
      <p className="text-sm font-medium text-zinc-700">新增网址</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">网站名称</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="例如：Google 翻译"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">网址</label>
          <input
            type="text"
            value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="例如：https://example.com 或 /jobs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">打开方式</label>
          <select
            value={form.open_mode}
            onChange={(e) => setForm((p) => ({ ...p, open_mode: e.target.value as OpenMode }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="auto">自动</option>
            <option value="same">当前窗口</option>
            <option value="new">新窗口</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">排序</label>
          <input
            type="number"
            min={0}
            step={1}
            value={form.sort_order}
            onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
        />
        前台显示
      </label>
      {msg ? (
        <p className={`text-xs ${msg.includes('失败') || msg.includes('错误') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {saving ? '新增中...' : '确认新增'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          取消
        </button>
      </div>
    </form>
  )
}

// ─── CategoryLinksSection ─────────────────────────────────────────────────────

function CategoryLinksSection({
  category,
  links,
  token,
  onLinksChange,
}: {
  category: NavCategory
  links: NavLink[]
  token: string
  onLinksChange: (categoryId: string, updatedLinks: NavLink[]) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  function handleUpdated(updated: NavLink) {
    onLinksChange(
      category.id,
      links.map((l) => (l.id === updated.id ? updated : l))
    )
  }

  function handleDeleted(id: string) {
    onLinksChange(
      category.id,
      links.filter((l) => l.id !== id)
    )
  }

  function handleAdded(link: NavLink) {
    onLinksChange(category.id, [...links, link])
    setShowAddForm(false)
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-zinc-900">{category.name}</h3>
          <span className="text-xs bg-zinc-200 text-zinc-600 rounded-full px-2 py-0.5 font-mono">
            {category.slug}
          </span>
          {!category.is_active && (
            <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">
              已隐藏
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
        >
          + 新增网址
        </button>
      </div>

      {showAddForm && (
        <AddLinkForm
          categoryId={category.id}
          token={token}
          onAdded={handleAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="mt-2 space-y-2">
        {links.length === 0 ? (
          <p className="text-xs text-zinc-400">暂无网址</p>
        ) : (
          links.map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              token={token}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminNavigationPage() {
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [isUsingUnifiedToken, setIsUsingUnifiedToken] = useState(false)
  const [showTokenEditor, setShowTokenEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<NavCategory[]>([])
  const [linksByCategory, setLinksByCategory] = useState<Record<string, NavLink[]>>({})
  const [errorMessage, setErrorMessage] = useAutoMessage()
  const [successMessage, setSuccessMessage] = useAutoMessage()
  const loadedRef = useRef(false)

  const fetchData = useCallback(async (adminToken: string) => {
    if (!adminToken) return
    setLoading(true)
    setErrorMessage('')
    try {
      const [catRes, linkRes] = await Promise.all([
        fetch('/api/admin/navigation/categories', {
          headers: { 'x-admin-token': adminToken },
        }),
        fetch('/api/admin/navigation/links', {
          headers: { 'x-admin-token': adminToken },
        }),
      ])
      const catJson: unknown = await catRes.json()
      const linkJson: unknown = await linkRes.json()

      if (!catRes.ok) {
        const err =
          catJson !== null && typeof catJson === 'object' && 'error' in catJson
            ? String((catJson as Record<string, unknown>).error || '加载失败')
            : '加载失败'
        setErrorMessage(err)
        return
      }
      if (!linkRes.ok) {
        const err =
          linkJson !== null && typeof linkJson === 'object' && 'error' in linkJson
            ? String((linkJson as Record<string, unknown>).error || '加载失败')
            : '加载失败'
        setErrorMessage(err)
        return
      }

      const cats = (catJson as { data: NavCategory[] }).data ?? []
      const links = (linkJson as { data: NavLink[] }).data ?? []

      setCategories(cats)
      // Build grouped links in a single O(n) pass
      const grouped: Record<string, NavLink[]> = {}
      for (const cat of cats) grouped[cat.id] = []
      for (const link of links) {
        if (grouped[link.category_id]) {
          grouped[link.category_id].push(link)
        }
      }
      setLinksByCategory(grouped)
    } catch {
      setErrorMessage('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [setErrorMessage])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    const stored = getAdminToken().trim()
    if (!stored) return
    setToken(stored)
    setTokenInput(stored)
    setIsUsingUnifiedToken(true)
    void fetchData(stored)
  }, [fetchData])

  function saveToken() {
    const next = tokenInput.trim()
    if (!next) { setErrorMessage('请输入 Admin Token'); return }
    setAdminToken(next)
    setToken(next)
    setTokenInput(next)
    setIsUsingUnifiedToken(true)
    setShowTokenEditor(false)
    setErrorMessage('')
    setSuccessMessage('')
    void fetchData(next)
  }

  function logoutAdmin() {
    clearAdminToken()
    setToken('')
    setTokenInput('')
    setIsUsingUnifiedToken(false)
    setShowTokenEditor(false)
    setCategories([])
    setLinksByCategory({})
    setErrorMessage('')
    setSuccessMessage('')
    loadedRef.current = false
  }

  function handleCategoryUpdated(updated: NavCategory) {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  function handleLinksChange(categoryId: string, updatedLinks: NavLink[]) {
    setLinksByCategory((prev) => ({ ...prev, [categoryId]: updatedLinks }))
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      <AdminPageHeader
        title="导航管理"
        description="管理公共导航页面的分类和网址内容。"
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
        loading ? (
          <p className="text-sm text-zinc-500">加载中...</p>
        ) : (
          <div className="space-y-10">
            {/* Section A: Category management */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                分类管理
              </h2>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    token={token}
                    onUpdated={handleCategoryUpdated}
                  />
                ))}
              </div>
            </section>

            {/* Section B: Link management */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                网址管理
              </h2>
              <div className="space-y-4">
                {categories.map((cat) => (
                  <CategoryLinksSection
                    key={cat.id}
                    category={cat}
                    links={linksByCategory[cat.id] ?? []}
                    token={token}
                    onLinksChange={handleLinksChange}
                  />
                ))}
              </div>
            </section>
          </div>
        )
      ) : null}

      <BackToTopButton />
    </div>
  )
}
