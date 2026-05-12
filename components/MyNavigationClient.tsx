'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, PencilLine, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAutoMessage } from '@/hooks/useAutoMessage'
import {
  getFriendlySiteName,
  getNavigationDomain,
  isValidNavigationUrl,
  normalizeNavigationUrl,
  resolveNavigationOpenTarget,
} from '@/lib/user-navigation'

type UserNavigationLink = {
  id: string
  title: string
  url: string
  description: string | null
  open_mode: 'auto' | 'same' | 'new'
  sort_order: number
  created_at: string
  updated_at: string
}

type NavigationDefault = 'public' | 'my'

type LinkFormState = {
  title: string
  url: string
}

function sortLinks(links: UserNavigationLink[]) {
  return [...links].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.created_at.localeCompare(b.created_at)
  })
}

function MyNavigationForm({
  title,
  submitText,
  form,
  onUrlChange,
  onTitleChange,
  onSubmit,
  onCancel,
  loading,
}: {
  title: string
  submitText: string
  form: LinkFormState
  onUrlChange: (value: string) => void
  onTitleChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-4 space-y-3">
      <div>
        <h3 className="text-[14px] font-black text-zinc-900">{title}</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-zinc-700">网址</label>
          <input
            type="text"
            inputMode="url"
            value={form.url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-2xl border border-zinc-200 px-3.5 py-3 text-[14px] text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-zinc-700">网站名称</label>
          <input
            type="text"
            value={form.title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="例如：Amazon"
            className="w-full rounded-2xl border border-zinc-200 px-3.5 py-3 text-[14px] text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-2xl bg-blue-600 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? '保存中...' : submitText}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
        >
          取消
        </button>
      </div>
    </div>
  )
}

export default function MyNavigationClient() {
  const [loading, setLoading] = useState(true)
  const [userReady, setUserReady] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [links, setLinks] = useState<UserNavigationLink[]>([])
  const [navigationDefault, setNavigationDefault] = useState<NavigationDefault>('public')
  const [savingDefault, setSavingDefault] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<LinkFormState>({ title: '', url: '' })
  const [addTitleEdited, setAddTitleEdited] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<LinkFormState>({ title: '', url: '' })
  const [editTitleEdited, setEditTitleEdited] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useAutoMessage()

  const authHeaders = useMemo(
    () =>
      accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        : null,
    [accessToken]
  )

  const loadData = useCallback(async () => {
    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token ?? null
    setAccessToken(token)

    if (!session?.user || !token) {
      setLinks([])
      setNavigationDefault('public')
      setUserReady(false)
      setLoading(false)
      return
    }

    setUserReady(true)

    try {
      const [linksRes, settingsRes] = await Promise.all([
        fetch('/api/user/navigation-links', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/user/navigation-settings', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (!linksRes.ok || !settingsRes.ok) {
        setMessage('加载失败，请稍后重试')
        setLinks([])
        setNavigationDefault('public')
        setLoading(false)
        return
      }

      const linksJson: unknown = await linksRes.json()
      const settingsJson: unknown = await settingsRes.json()

      const nextLinks =
        linksJson &&
        typeof linksJson === 'object' &&
        'data' in linksJson &&
        Array.isArray(linksJson.data)
          ? (linksJson.data as UserNavigationLink[])
          : []

      const nextDefault =
        settingsJson &&
        typeof settingsJson === 'object' &&
        'data' in settingsJson &&
        settingsJson.data &&
        typeof settingsJson.data === 'object' &&
        'navigation_default' in settingsJson.data &&
        settingsJson.data.navigation_default === 'my'
          ? 'my'
          : 'public'

      setLinks(sortLinks(nextLinks))
      setNavigationDefault(nextDefault)
    } catch {
      setMessage('加载失败，请稍后重试')
      setLinks([])
      setNavigationDefault('public')
    } finally {
      setLoading(false)
    }
  }, [setMessage])

  useEffect(() => {
    void loadData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadData])

  const resetAddForm = () => {
    setShowAddForm(false)
    setAddForm({ title: '', url: '' })
    setAddTitleEdited(false)
  }

  const resetEditForm = () => {
    setEditingId(null)
    setEditForm({ title: '', url: '' })
    setEditTitleEdited(false)
  }

  const handleAddUrlChange = (value: string) => {
    setAddForm((current) => ({
      ...current,
      url: value,
      title: addTitleEdited ? current.title : getFriendlySiteName(value),
    }))
  }

  const handleEditUrlChange = (value: string) => {
    setEditForm((current) => ({
      ...current,
      url: value,
      title: editTitleEdited ? current.title : getFriendlySiteName(value),
    }))
  }

  const submitAdd = async () => {
    if (!authHeaders) {
      setMessage('请先登录后再添加')
      return
    }

    const normalizedUrl = normalizeNavigationUrl(addForm.url)
    const normalizedTitle = addForm.title.trim() || getFriendlySiteName(normalizedUrl)

    if (!normalizedUrl || !isValidNavigationUrl(normalizedUrl)) {
      setMessage('请输入正确的网址')
      return
    }

    if (!normalizedTitle) {
      setMessage('请输入网站名称')
      return
    }

    setSubmitting(true)
    setAddForm({ url: normalizedUrl, title: normalizedTitle })

    try {
      const res = await fetch('/api/user/navigation-links', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          url: normalizedUrl,
          title: normalizedTitle,
        }),
      })

      const json: unknown = await res.json()
      if (!res.ok) {
        const error =
          json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
            ? json.error
            : '保存失败，请稍后重试'
        setMessage(error)
        return
      }

      const nextLink =
        json && typeof json === 'object' && 'data' in json ? (json.data as UserNavigationLink) : null

      if (nextLink) {
        setLinks((current) => sortLinks([...current, nextLink]))
      }
      resetAddForm()
      setMessage('添加成功')
    } catch {
      setMessage('保存失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const beginEdit = (link: UserNavigationLink) => {
    setEditingId(link.id)
    setEditForm({ title: link.title, url: link.url })
    setEditTitleEdited(false)
  }

  const submitEdit = async () => {
    if (!editingId || !authHeaders) return

    const normalizedUrl = normalizeNavigationUrl(editForm.url)
    const normalizedTitle = editForm.title.trim() || getFriendlySiteName(normalizedUrl)

    if (!normalizedUrl || !isValidNavigationUrl(normalizedUrl)) {
      setMessage('请输入正确的网址')
      return
    }

    if (!normalizedTitle) {
      setMessage('请输入网站名称')
      return
    }

    setSubmitting(true)
    setEditForm({ url: normalizedUrl, title: normalizedTitle })

    try {
      const res = await fetch(`/api/user/navigation-links/${editingId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          url: normalizedUrl,
          title: normalizedTitle,
        }),
      })

      const json: unknown = await res.json()
      if (!res.ok) {
        const error =
          json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
            ? json.error
            : '保存失败，请稍后重试'
        setMessage(error)
        return
      }

      const updatedLink =
        json && typeof json === 'object' && 'data' in json ? (json.data as UserNavigationLink) : null

      if (updatedLink) {
        setLinks((current) =>
          sortLinks(current.map((item) => (item.id === updatedLink.id ? updatedLink : item)))
        )
      }
      resetEditForm()
      setMessage('修改已保存')
    } catch {
      setMessage('保存失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const removeLink = async (id: string) => {
    if (!authHeaders) return
    if (!window.confirm('确定删除这个网址吗？')) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/user/navigation-links/${id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeaders.Authorization },
      })

      if (!res.ok) {
        const json: unknown = await res.json()
        const error =
          json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
            ? json.error
            : '删除失败，请稍后重试'
        setMessage(error)
        return
      }

      setLinks((current) => current.filter((item) => item.id !== id))
      if (editingId === id) {
        resetEditForm()
      }
      setMessage('删除成功')
    } catch {
      setMessage('删除失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleDefaultNavigation = async () => {
    if (!authHeaders) return

    const nextDefault: NavigationDefault = navigationDefault === 'my' ? 'public' : 'my'
    setSavingDefault(true)

    try {
      const res = await fetch('/api/user/navigation-settings', {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ navigation_default: nextDefault }),
      })

      const json: unknown = await res.json()
      if (!res.ok) {
        const error =
          json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
            ? json.error
            : '设置失败，请稍后重试'
        setMessage(error)
        return
      }

      setNavigationDefault(nextDefault)
      setMessage(nextDefault === 'my' ? '设置成功' : '已切换回 OpenAA 导航')
    } catch {
      setMessage('设置失败，请稍后重试')
    } finally {
      setSavingDefault(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[860px] px-4 pt-6 pb-24">
        <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-5 text-center text-sm text-zinc-400">
          加载中...
        </div>
      </div>
    )
  }

  if (!userReady) {
    return (
      <div className="mx-auto w-full max-w-[860px] px-4 pt-6 pb-24">
        <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-5">
          <h1 className="text-[18px] font-black text-zinc-900">设置我的导航</h1>
          <p className="mt-2 text-[13px] leading-6 text-zinc-600">
            登录后可以把常用网站保存到“我的导航”，以后打开 OpenAA 就能快速找到，不用每次重新搜索。
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/auth/login?redirect=/navigation/my"
              className="inline-flex justify-center rounded-2xl bg-blue-600 px-4 py-3 text-[14px] font-bold text-white transition hover:bg-blue-700"
            >
              登录设置我的导航
            </Link>
            <Link
              href="/navigation"
              className="inline-flex justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-bold text-zinc-700 transition hover:bg-zinc-50"
            >
              返回 OpenAA 导航
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 pt-6 pb-24">
      <div className="space-y-5">
        {message ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] text-blue-700">
            {message}
          </div>
        ) : null}

        <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/navigation"
              className="rounded-[22px] bg-zinc-50 px-4 py-4 ring-1 ring-zinc-100 transition hover:bg-white hover:ring-zinc-200"
            >
              <div className="text-[14px] font-black text-zinc-900">OpenAA 导航</div>
              <div className="mt-1 text-[12px] text-zinc-500">平台常用网站</div>
            </Link>

            <button
              type="button"
              onClick={toggleDefaultNavigation}
              disabled={savingDefault}
              className="text-left rounded-[22px] bg-zinc-50 px-4 py-4 ring-1 ring-zinc-100 transition hover:bg-white hover:ring-zinc-200 disabled:opacity-60"
            >
              <div className="text-[14px] font-black text-zinc-900">
                {navigationDefault === 'my' ? '改回 OpenAA 导航' : '设为默认导航'}
              </div>
              <div className="mt-1 text-[12px] text-zinc-500">
                {navigationDefault === 'my' ? '当前默认我的导航' : '下次优先打开我的导航'}
              </div>
            </button>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <h1 className="text-[18px] font-black text-zinc-900">我的导航</h1>
              <p className="mt-1 text-[12px] text-zinc-500">我的常用</p>
            </div>

            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1 rounded-2xl bg-zinc-900 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-zinc-800"
              >
                <Plus size={15} />
                添加网址
              </button>
            )}
          </div>

          {showAddForm ? (
            <MyNavigationForm
              title="添加网址"
              submitText="保存"
              form={addForm}
              onUrlChange={handleAddUrlChange}
              onTitleChange={(value) => {
                setAddTitleEdited(true)
                setAddForm((current) => ({ ...current, title: value }))
              }}
              onSubmit={submitAdd}
              onCancel={resetAddForm}
              loading={submitting}
            />
          ) : null}

          {links.length === 0 && !showAddForm ? (
            <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-5 text-center">
              <h2 className="text-[16px] font-black text-zinc-900">还没有添加常用网址</h2>
              <p className="mt-2 text-[13px] leading-6 text-zinc-500">
                把常用网站添加到这里，以后打开更方便。
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex justify-center rounded-2xl bg-blue-600 px-4 py-3 text-[14px] font-bold text-white transition hover:bg-blue-700"
                >
                  + 添加网址
                </button>
                <Link
                  href="/navigation"
                  className="inline-flex justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-bold text-zinc-700 transition hover:bg-zinc-50"
                >
                  使用 OpenAA 导航
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-1 text-[13px] font-black text-zinc-900">我的常用</div>
              <div className="grid grid-cols-2 gap-3">
                {links.map((link) =>
                  editingId === link.id ? (
                    <div key={link.id} className="col-span-2">
                      <MyNavigationForm
                        title="编辑网址"
                        submitText="保存修改"
                        form={editForm}
                        onUrlChange={handleEditUrlChange}
                        onTitleChange={(value) => {
                          setEditTitleEdited(true)
                          setEditForm((current) => ({ ...current, title: value }))
                        }}
                        onSubmit={submitEdit}
                        onCancel={resetEditForm}
                        loading={submitting}
                      />
                    </div>
                  ) : (
                    <div
                      key={link.id}
                      className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-3"
                    >
                      {(() => {
                        const target = resolveNavigationOpenTarget(link.url, link.open_mode)
                        return (
                          <a
                            href={link.url}
                            target={target === 'new' ? '_blank' : undefined}
                            rel={target === 'new' ? 'noopener noreferrer' : undefined}
                            className="block rounded-2xl bg-zinc-50 px-3 py-3 ring-1 ring-zinc-100 transition hover:bg-white hover:ring-zinc-200"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 text-[13px] font-black text-zinc-900 truncate">
                                {link.title}
                              </div>
                              <ExternalLink size={14} className="shrink-0 text-zinc-400" />
                            </div>
                            <div className="mt-1 text-[11px] text-zinc-500 truncate">
                              {getNavigationDomain(link.url)}
                            </div>
                          </a>
                        )
                      })()}

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => beginEdit(link)}
                          className="inline-flex items-center justify-center gap-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-[12px] font-bold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          <PencilLine size={14} />
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeLink(link.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
