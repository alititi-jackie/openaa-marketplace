'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import AdminPageHeader from '@/components/AdminPageHeader'
import BackToTopButton from '@/components/BackToTopButton'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'
import { DEFAULT_HOME_LATEST_SECTIONS, type HomeLatestSection } from '@/lib/homeSections'
import { useAutoMessage } from '@/hooks/useAutoMessage'

type EditableSection = Pick<
  HomeLatestSection,
  'section_key' | 'section_name' | 'section_type' | 'parent_key' | 'is_visible' | 'display_order' | 'limit_count'
>

function sortSections(a: EditableSection, b: EditableSection) {
  return a.display_order - b.display_order
}

export default function AdminHomeSectionsPage() {
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [isUsingUnifiedToken, setIsUsingUnifiedToken] = useState(false)
  const [showTokenEditor, setShowTokenEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useAutoMessage()
  const [successMessage, setSuccessMessage] = useAutoMessage()
  const [localSaveMessage, setLocalSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sections, setSections] = useState<EditableSection[]>(DEFAULT_HOME_LATEST_SECTIONS)
  const saveAreaRef = useRef<HTMLDivElement>(null)
  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchSections(adminToken: string) {
    if (!adminToken) return
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/admin/home-sections', {
        headers: { 'x-admin-token': adminToken },
      })
      const json = (await res.json()) as { error?: string; data?: EditableSection[] }
      if (!res.ok) {
        setErrorMessage(json.error || '加载失败')
        return
      }
      if (Array.isArray(json.data) && json.data.length > 0) {
        setSections(json.data)
      } else {
        setSections(DEFAULT_HOME_LATEST_SECTIONS)
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
    void fetchSections(stored)
  }, [])

  useEffect(() => {
    return () => {
      if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current)
    }
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
    void fetchSections(nextToken)
  }

  function logoutAdmin() {
    clearAdminToken()
    setToken('')
    setTokenInput('')
    setIsUsingUnifiedToken(false)
    setShowTokenEditor(false)
    setErrorMessage('')
    setSuccessMessage('')
    setSections(DEFAULT_HOME_LATEST_SECTIONS)
  }

  function updateSection(sectionKey: string, patch: Partial<EditableSection>) {
    setSections((prev) => prev.map((item) => (item.section_key === sectionKey ? { ...item, ...patch } : item)))
  }

  async function saveAll() {
    if (!token) {
      setErrorMessage('请先输入 Admin Token')
      return
    }
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    setLocalSaveMessage(null)
    if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current)
    try {
      const payload = sections.map((item) => ({
        section_key: item.section_key,
        is_visible: item.is_visible,
        display_order: item.display_order,
        limit_count: item.limit_count,
      }))
      const res = await fetch('/api/admin/home-sections', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ sections: payload }),
      })
      const json = (await res.json()) as { error?: string; data?: EditableSection[] }
      if (!res.ok) {
        setErrorMessage(json.error || '保存失败')
        setLocalSaveMessage({ type: 'error', text: json.error || '保存失败' })
        saveAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        return
      }
      if (Array.isArray(json.data) && json.data.length > 0) {
        setSections(json.data)
      }
      setSuccessMessage('保存成功')
      setLocalSaveMessage({ type: 'success', text: '保存成功' })
      saveAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      localSaveTimerRef.current = setTimeout(() => {
        setLocalSaveMessage(null)
      }, 4000)
    } catch {
      setErrorMessage('网络错误，请稍后重试')
      setLocalSaveMessage({ type: 'error', text: '网络错误，请稍后重试' })
      saveAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } finally {
      setSaving(false)
    }
  }

  const mainSections = useMemo(
    () => sections.filter((section) => section.section_type === 'main').sort(sortSections),
    [sections]
  )
  const newsSections = useMemo(
    () =>
      sections
        .filter((section) => section.section_type === 'news_category' && section.parent_key === 'latest_news')
        .sort(sortSections),
    [sections]
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      <AdminPageHeader
        title="首页最新发布管理"
        description="管理首页最新招聘、房屋、二手、本地服务、新闻板块显示和排序。"
        isLoggedIn={isUsingUnifiedToken}
        onChangeToken={() => setShowTokenEditor((prev) => !prev)}
        onLogout={logoutAdmin}
      />

      {!token || showTokenEditor ? (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <label className="mb-1 block text-sm font-medium text-zinc-700">Admin Token</label>
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
      {successMessage ? <p className="mb-4 text-sm font-semibold text-green-600">{successMessage}</p> : null}
      {loading ? <p className="mb-4 text-sm text-zinc-500">加载中...</p> : null}

      {token ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">主板块（首页最新发布）</h2>
            <div className="mt-4 space-y-3">
              {mainSections.map((section) => (
                <div key={section.section_key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-800">{section.section_name}</p>
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={section.is_visible}
                        onChange={(e) => updateSection(section.section_key, { is_visible: e.target.checked })}
                      />
                      显示
                    </label>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm text-zinc-700">
                      排序
                      <input
                        type="number"
                        min={0}
                        value={section.display_order}
                        onChange={(e) =>
                          updateSection(section.section_key, { display_order: Math.max(0, Number(e.target.value)) })
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-zinc-700">
                      显示条数
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={section.limit_count}
                        onChange={(e) =>
                          updateSection(section.section_key, {
                            limit_count: Math.min(30, Math.max(1, Number(e.target.value))),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">最新新闻小板块（仅控制取数）</h2>
            <div className="mt-4 space-y-3">
              {newsSections.map((section) => (
                <div key={section.section_key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-800">{section.section_name}</p>
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={section.is_visible}
                        onChange={(e) => updateSection(section.section_key, { is_visible: e.target.checked })}
                      />
                      显示
                    </label>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm text-zinc-700">
                      排序
                      <input
                        type="number"
                        min={0}
                        value={section.display_order}
                        onChange={(e) =>
                          updateSection(section.section_key, { display_order: Math.max(0, Number(e.target.value)) })
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-zinc-700">
                      显示条数
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={section.limit_count}
                        onChange={(e) =>
                          updateSection(section.section_key, {
                            limit_count: Math.min(30, Math.max(1, Number(e.target.value))),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div ref={saveAreaRef} className="flex flex-col items-end gap-2">
            {localSaveMessage ? (
              <p
                className={`text-sm font-medium ${
                  localSaveMessage.type === 'success' ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {localSaveMessage.text}
              </p>
            ) : null}
            <button
              type="button"
              onClick={saveAll}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      ) : null}

      <BackToTopButton />
    </div>
  )
}
