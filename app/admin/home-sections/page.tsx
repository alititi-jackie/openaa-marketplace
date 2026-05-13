'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/AdminPageHeader'
import BackToTopButton from '@/components/BackToTopButton'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'
import { DEFAULT_HOME_LATEST_SECTIONS, type HomeLatestSection } from '@/lib/homeSections'
import { useAutoMessage } from '@/hooks/useAutoMessage'
import {
  clampTickerDisplayCount,
  clampTickerIntervalSeconds,
  DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS,
  DEFAULT_LATEST_TICKER_SECTION_SETTINGS,
  normalizeLatestTickerGlobalSettings,
  normalizeLatestTickerSections,
  type LatestTickerGlobalSettings,
  type LatestTickerSectionSettings,
} from '@/lib/latestTickerSettings'

type EditableSection = Pick<
  HomeLatestSection,
  'section_key' | 'section_name' | 'section_type' | 'parent_key' | 'is_visible' | 'display_order' | 'limit_count'
>

type LatestTickerPayload = {
  global: LatestTickerGlobalSettings
  sections: LatestTickerSectionSettings[]
}

function sortSections(a: EditableSection, b: EditableSection) {
  return a.display_order - b.display_order
}

export default function AdminHomeSectionsPage() {
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [isUsingUnifiedToken, setIsUsingUnifiedToken] = useState(false)
  const [showTokenEditor, setShowTokenEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useAutoMessage()
  const [sections, setSections] = useState<EditableSection[]>(DEFAULT_HOME_LATEST_SECTIONS)
  const [latestTickerGlobal, setLatestTickerGlobal] = useState<LatestTickerGlobalSettings>(
    DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS,
  )
  const [latestTickerSections, setLatestTickerSections] = useState<LatestTickerSectionSettings[]>(
    DEFAULT_LATEST_TICKER_SECTION_SETTINGS,
  )
  const [savingLatestTicker, setSavingLatestTicker] = useState(false)
  const [latestTickerMessage, setLatestTickerMessage] = useAutoMessage()
  const [mainSaving, setMainSaving] = useState(false)
  const [mainMessage, setMainMessage] = useAutoMessage()
  const [newsSaving, setNewsSaving] = useState(false)
  const [newsMessage, setNewsMessage] = useAutoMessage()
  const [activeNav, setActiveNav] = useState<'main' | 'news' | 'dynamic'>('main')

  async function fetchSections(adminToken: string) {
    if (!adminToken) return
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/admin/home-sections', {
        headers: { 'x-admin-token': adminToken },
      })
      const json = (await res.json()) as {
        error?: string
        data?: EditableSection[]
        latest_ticker?: Partial<LatestTickerPayload>
      }
      if (!res.ok) {
        setErrorMessage(json.error || '加载失败')
        return
      }
      if (Array.isArray(json.data) && json.data.length > 0) {
        setSections(json.data)
      } else {
        setSections(DEFAULT_HOME_LATEST_SECTIONS)
      }
      const latestTickerGlobal = normalizeLatestTickerGlobalSettings(json.latest_ticker?.global)
      const latestTickerSections = normalizeLatestTickerSections(json.latest_ticker?.sections)
      setLatestTickerGlobal(latestTickerGlobal)
      setLatestTickerSections(latestTickerSections)
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
    void fetchSections(nextToken)
  }

  function logoutAdmin() {
    clearAdminToken()
    setToken('')
    setTokenInput('')
    setIsUsingUnifiedToken(false)
    setShowTokenEditor(false)
    setErrorMessage('')
    setSections(DEFAULT_HOME_LATEST_SECTIONS)
    setLatestTickerGlobal(DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS)
    setLatestTickerSections(DEFAULT_LATEST_TICKER_SECTION_SETTINGS)
  }

  function updateSection(sectionKey: string, patch: Partial<EditableSection>) {
    setSections((prev) => prev.map((item) => (item.section_key === sectionKey ? { ...item, ...patch } : item)))
  }

  function updateLatestTickerSection(sectionKey: string, patch: Partial<LatestTickerSectionSettings>) {
    setLatestTickerSections((prev) =>
      prev
        .map((item) => (item.section_key === sectionKey ? { ...item, ...patch } : item))
        .sort((a, b) => a.sort_order - b.sort_order),
    )
  }

  async function saveLatestTicker() {
    if (!token) {
      setLatestTickerMessage('请先输入 Admin Token')
      return
    }
    setSavingLatestTicker(true)
    setLatestTickerMessage('')
    try {
      const payload = {
        latest_ticker: {
          global: {
            is_enabled: latestTickerGlobal.is_enabled,
            interval_seconds: clampTickerIntervalSeconds(latestTickerGlobal.interval_seconds),
          },
          sections: latestTickerSections.map((section) => ({
            section_key: section.section_key,
            is_enabled: section.is_enabled,
            sort_order: section.sort_order,
            display_count: clampTickerDisplayCount(section.display_count),
          })),
        },
      }
      const res = await fetch('/api/admin/home-sections', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as {
        error?: string
        latest_ticker?: Partial<LatestTickerPayload>
      }
      if (!res.ok) {
        setLatestTickerMessage(json.error || '保存失败')
        return
      }
      const latestTickerGlobalFromApi = normalizeLatestTickerGlobalSettings(json.latest_ticker?.global)
      const latestTickerSectionsFromApi = normalizeLatestTickerSections(json.latest_ticker?.sections)
      setLatestTickerGlobal(latestTickerGlobalFromApi)
      setLatestTickerSections(latestTickerSectionsFromApi)
      setLatestTickerMessage('保存成功')
    } catch {
      setLatestTickerMessage('网络错误，请稍后重试')
    } finally {
      setSavingLatestTicker(false)
    }
  }

  function handleNavClick(key: 'main' | 'news' | 'dynamic', sectionId: string) {
    setActiveNav(key)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function saveMainSections() {
    if (!token) {
      setMainMessage('请先输入 Admin Token')
      return
    }
    setMainSaving(true)
    setMainMessage('')
    try {
      const payload = mainSections.map((item) => ({
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
        setMainMessage(json.error || '保存失败')
        return
      }
      if (Array.isArray(json.data) && json.data.length > 0) {
        setSections(json.data)
      }
      setMainMessage('保存成功')
    } catch {
      setMainMessage('网络错误，请稍后重试')
    } finally {
      setMainSaving(false)
    }
  }

  async function saveNewsSections() {
    if (!token) {
      setNewsMessage('请先输入 Admin Token')
      return
    }
    setNewsSaving(true)
    setNewsMessage('')
    try {
      const payload = newsSections.map((item) => ({
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
        setNewsMessage(json.error || '保存失败')
        return
      }
      if (Array.isArray(json.data) && json.data.length > 0) {
        setSections(json.data)
      }
      setNewsMessage('保存成功')
    } catch {
      setNewsMessage('网络错误，请稍后重试')
    } finally {
      setNewsSaving(false)
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
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:py-8 md:pb-24">
      <AdminPageHeader
        title="首页最新发布管理"
        description="管理首页最新招聘、房屋、二手、本地服务、新闻板块显示和排序。"
        isLoggedIn={isUsingUnifiedToken}
        onChangeToken={() => setShowTokenEditor((prev) => !prev)}
        onLogout={logoutAdmin}
      />

      {/* Category navigation bar */}
      <nav className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {(
          [
            { key: 'main', label: '主板块', sectionId: 'main-section' },
            { key: 'news', label: '新闻小板块', sectionId: 'news-section' },
            { key: 'dynamic', label: '最新动态', sectionId: 'dynamic-section' },
          ] as const
        ).map(({ key, label, sectionId }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleNavClick(key, sectionId)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeNav === key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

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
      {loading ? <p className="mb-4 text-sm text-zinc-500">加载中...</p> : null}

      {token ? (
        <div className="space-y-6">
          <section id="main-section" className="scroll-mt-20 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
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
            <div className="mt-4 flex flex-col items-center gap-2">
              {mainMessage ? (
                <p
                  className={`text-sm font-medium ${
                    mainMessage.includes('成功') ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {mainMessage}
                </p>
              ) : null}
              <button
                type="button"
                onClick={saveMainSections}
                disabled={mainSaving}
                className="min-w-[180px] rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {mainSaving ? '保存中...' : '保存主板块设置'}
              </button>
            </div>
          </section>

          <section id="news-section" className="scroll-mt-20 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
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
            <div className="mt-4 flex flex-col items-center gap-2">
              {newsMessage ? (
                <p
                  className={`text-sm font-medium ${
                    newsMessage.includes('成功') ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {newsMessage}
                </p>
              ) : null}
              <button
                type="button"
                onClick={saveNewsSections}
                disabled={newsSaving}
                className="min-w-[180px] rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {newsSaving ? '保存中...' : '保存新闻小板块设置'}
              </button>
            </div>
          </section>

          <section id="dynamic-section" className="scroll-mt-20 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">最新动态滚动条设置</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={latestTickerGlobal.is_enabled}
                      onChange={(e) =>
                        setLatestTickerGlobal((prev) => ({
                          ...prev,
                          is_enabled: e.target.checked,
                        }))
                      }
                    />
                    启用最新动态滚动条
                  </label>
                  <label className="text-sm text-zinc-700">
                    每条显示时长（秒）
                    <input
                      type="number"
                      min={3}
                      max={10}
                      value={latestTickerGlobal.interval_seconds}
                      onChange={(e) =>
                        setLatestTickerGlobal((prev) => ({
                          ...prev,
                          interval_seconds: clampTickerIntervalSeconds(Number(e.target.value)),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                {latestTickerSections.map((section) => (
                  <div key={section.section_key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <p className="text-sm font-semibold text-zinc-800">{section.section_name}</p>
                      <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                        <input
                          type="checkbox"
                          checked={section.is_enabled}
                          onChange={(e) =>
                            updateLatestTickerSection(section.section_key, { is_enabled: e.target.checked })
                          }
                        />
                        显示
                      </label>
                      <label className="text-sm text-zinc-700">
                        排序
                        <input
                          type="number"
                          min={0}
                          value={section.sort_order}
                          onChange={(e) =>
                            updateLatestTickerSection(section.section_key, {
                              sort_order: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="text-sm text-zinc-700">
                        显示数量
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={section.display_count}
                          onChange={(e) =>
                            updateLatestTickerSection(section.section_key, {
                              display_count: clampTickerDisplayCount(Number(e.target.value)),
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-2">
                {latestTickerMessage ? (
                  <p
                    className={`text-sm font-medium ${
                      latestTickerMessage.includes('成功') ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {latestTickerMessage}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={saveLatestTicker}
                  disabled={savingLatestTicker}
                  className="min-w-[180px] rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingLatestTicker ? '保存中...' : '保存最新动态设置'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <BackToTopButton />
    </div>
  )
}
