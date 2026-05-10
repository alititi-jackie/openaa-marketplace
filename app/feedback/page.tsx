'use client'

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DetailBackButton from '@/components/DetailBackButton'
import { supabase } from '@/lib/supabase'

const FEEDBACK_TYPES = ['信息举报', '页面错误', '功能建议', '新闻线索 / 投稿建议', '广告合作', '其它问题'] as const
type FeedbackType = (typeof FEEDBACK_TYPES)[number]

function normalizeType(value: string | null): FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType) ? (value as FeedbackType) : FEEDBACK_TYPES[0]
}

function hasPreviousPage() {
  return typeof window !== 'undefined' && (document.referrer !== '' || window.history.length > 2)
}

function FeedbackPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryType = useMemo(() => normalizeType(searchParams.get('type')), [searchParams])
  const queryRelatedUrl = useMemo(() => searchParams.get('related_url') || '', [searchParams])

  const [type, setType] = useState<FeedbackType>(queryType)
  const [relatedUrl, setRelatedUrl] = useState(queryRelatedUrl)
  const [contact, setContact] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setType(queryType)
  }, [queryType])

  useEffect(() => {
    setRelatedUrl(queryRelatedUrl)
  }, [queryRelatedUrl])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const trimmedType = type.trim()
    const trimmedContent = content.trim()

    if (!trimmedType) {
      setErrorMessage('请选择反馈类型。')
      return
    }

    if (!trimmedContent) {
      setErrorMessage('请填写反馈内容。')
      return
    }

    const trimmedRelatedUrl = relatedUrl.trim()
    if (trimmedRelatedUrl) {
      try {
        new URL(trimmedRelatedUrl)
      } catch {
        setErrorMessage('相关链接格式不正确，请输入完整 URL。')
        return
      }
    }

    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from('feedback_posts').insert({
        user_id: user?.id ?? null,
        type: trimmedType,
        related_url: trimmedRelatedUrl || null,
        contact: contact.trim() || null,
        content: trimmedContent,
      })

      if (error) throw error

      setSubmitted(true)
      setSuccessMessage('感谢你的反馈，我们会尽快查看并处理。')
      setContent('')
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败，请稍后重试。'
      setErrorMessage(`提交失败：${message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackToPrevious = () => {
    if (hasPreviousPage()) {
      window.history.back()
      return
    }

    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <DetailBackButton fallbackHref="/" label="← 返回" />

      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
        {submitted ? (
          <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-center sm:px-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
                ✓
              </div>
              <h1 className="mt-4 text-2xl font-bold text-gray-900">提交成功</h1>
              <p className="mt-2 text-sm leading-relaxed text-green-700">{successMessage}</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleBackToPrevious}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                返回上一级
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full rounded-lg bg-[#1976d2] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1565c0]"
              >
                返回首页
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">反馈与举报</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              如果你发现虚假信息、诈骗内容、页面错误，或有任何建议，可以在这里提交给 OpenAA。
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {errorMessage ? (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</div>
              ) : null}

              <div>
                <label htmlFor="feedback-type" className="mb-1 block text-sm font-medium text-gray-700">
                  反馈类型
                </label>
                <select
                  id="feedback-type"
                  value={type}
                  onChange={(e) => setType(normalizeType(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                >
                  {FEEDBACK_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="feedback-related-url" className="mb-1 block text-sm font-medium text-gray-700">
                  相关链接
                </label>
                <input
                  id="feedback-related-url"
                  type="url"
                  value={relatedUrl}
                  onChange={(e) => setRelatedUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                />
              </div>

              <div>
                <label htmlFor="feedback-contact" className="mb-1 block text-sm font-medium text-gray-700">
                  联系方式（选填）
                </label>
                <input
                  id="feedback-contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="邮箱 / 电话 / 微信，方便我们联系你"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                />
              </div>

              <div>
                <label htmlFor="feedback-content" className="mb-1 block text-sm font-medium text-gray-700">
                  反馈内容
                </label>
                <textarea
                  id="feedback-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="请尽量描述清楚问题，例如虚假信息、联系方式异常、页面打不开等"
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#1976d2] py-2.5 font-medium text-white transition hover:bg-[#1565c0] disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交反馈'}
              </button>
            </form>

            <p className="mt-5 text-sm leading-relaxed text-gray-500">
              如有紧急问题或需加急处理，请邮件联系：323748@gmail.com，我们会优先查看。
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-gray-500">加载中...</div>}>
      <FeedbackPageInner />
    </Suspense>
  )
}
