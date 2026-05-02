'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type FormState = {
  current: string
  newPassword: string
  confirm: string
}

type NoticeState = {
  type: 'error' | 'success'
  message: string
} | null

export default function ChangePasswordPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ current: '', newPassword: '', confirm: '' })
  const [notice, setNotice] = useState<NoticeState>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isFormDisabled = useMemo(() => submitting || success, [submitting, success])

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // 按要求：未登录则提示，并提供返回登录链接。
        setEmail(null)
        setLoading(false)
        setNotice({ type: 'error', message: '请先登录后再修改密码' })
        return
      }

      setEmail(user.email ?? null)
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setNotice(null)

    if (!email) {
      setNotice({ type: 'error', message: '请先登录后再修改密码' })
      return
    }

    // 前端校验（按要求保留）
    if (!form.current) {
      setNotice({ type: 'error', message: '请输入原密码' })
      return
    }
    if (!form.newPassword) {
      setNotice({ type: 'error', message: '请输入新密码' })
      return
    }
    if (form.newPassword.length < 6) {
      setNotice({ type: 'error', message: '新密码至少需要 6 位' })
      return
    }
    if (!form.confirm) {
      setNotice({ type: 'error', message: '请再次输入新密码' })
      return
    }
    if (form.newPassword !== form.confirm) {
      setNotice({ type: 'error', message: '两次输入的新密码不一致' })
      return
    }

    setSubmitting(true)

    try {
      // 1) 先验证原密码（email + currentPassword）
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: form.current,
      })

      if (verifyError) {
        // 原密码错误：不调用 updateUser，并尽量只清空原密码
        setForm(prev => ({ ...prev, current: '' }))
        setNotice({ type: 'error', message: '原密码不正确，请重新输入' })
        return
      }

      // 2) 原密码正确：更新为新密码
      const { error: updateError } = await supabase.auth.updateUser({ password: form.newPassword })

      if (updateError) {
        setNotice({ type: 'error', message: updateError.message || '修改密码失败，请稍后重试' })
        return
      }

      // 3) 修改成功：提示并登出，要求重新登录
      await supabase.auth.signOut()
      setSuccess(true)
      setNotice({ type: 'success', message: '密码修改成功，请使用新密码重新登录。' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20 text-zinc-500">加载中...</div>

  const isLoggedIn = Boolean(email)

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto max-w-[560px] px-4 pt-6 pb-24 space-y-4">
        <div className="px-1">
          <h1 className="text-[18px] font-black text-zinc-900 tracking-tight">修改密码</h1>
          <p className="mt-1 text-[12px] text-zinc-500">
            请输入原密码和新密码。修改成功后，请使用新密码重新登录。
          </p>
        </div>

        {!isLoggedIn ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5 p-6 space-y-3">
            {notice?.type === 'error' && (
              <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{notice.message}</div>
            )}
            <Link
              href="/auth/login"
              className="block w-full text-center bg-[#1976d2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition"
            >
              返回登录
            </Link>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5 p-6 space-y-4"
            >
              {notice && notice.type === 'success' && (
                <div className="bg-zinc-50 text-zinc-600 rounded-lg p-3 text-sm text-center">
                  {notice.message}
                </div>
              )}
              {notice && notice.type === 'error' && (
                <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{notice.message}</div>
              )}

              {!success && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">原密码</label>
                    <input
                      type="password"
                      value={form.current}
                      onChange={e => setForm(prev => ({ ...prev, current: e.target.value }))}
                      placeholder="请输入原密码"
                      disabled={isFormDisabled}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent disabled:bg-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={e => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="请输入新密码"
                      disabled={isFormDisabled}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent disabled:bg-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                    <input
                      type="password"
                      value={form.confirm}
                      onChange={e => setForm(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder="请再次输入新密码"
                      disabled={isFormDisabled}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent disabled:bg-zinc-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#1976d2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
                  >
                    {submitting ? '正在修改...' : '确认修改'}
                  </button>
                </>
              )}
            </form>

            {success ? (
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-[13px] text-[#1976d2] hover:text-[#1565c0] transition"
                >
                  返回登录
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <Link href="/profile/edit" className="text-[13px] text-zinc-500 hover:text-zinc-700 transition">
                  返回编辑资料
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
