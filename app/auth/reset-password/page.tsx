'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function ResetPasswordPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  useEffect(() => {
    // Check for an existing session first (handles PKCE / token-in-URL flows)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    // Also listen for the PASSWORD_RECOVERY event so the session is captured
    // when Supabase processes the token from the URL hash/query string.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSession(currentSession)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const validate = (): boolean => {
    let valid = true

    if (!newPassword) {
      setNewPasswordError('请输入新密码')
      valid = false
    } else if (newPassword.length < 6) {
      setNewPasswordError('密码至少需要 6 位')
      valid = false
    } else {
      setNewPasswordError('')
    }

    if (!confirmPassword) {
      setConfirmPasswordError('请再次输入新密码')
      valid = false
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('两次输入的密码不一致')
      valid = false
    } else {
      setConfirmPasswordError('')
    }

    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (updateError) {
      setError(updateError.message || '密码重置失败，请重新打开邮件链接或稍后重试')
      return
    }

    setSuccess(true)
  }

  // Still loading session
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md mx-auto text-center text-zinc-500 text-sm">
          正在验证重置链接…
        </div>
      </div>
    )
  }

  // No valid recovery session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">重置密码</h1>
          <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm leading-relaxed">
            重置链接无效或已过期，请重新申请密码重置邮件。
          </div>
          <p className="text-center text-sm text-gray-600 mt-6">
            <Link href="/auth/forgot-password" className="text-[#1976d2] hover:underline font-medium">
              重新申请
            </Link>
            {' · '}
            <Link href="/auth/login" className="text-[#1976d2] hover:underline font-medium">
              返回登录
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-900">重置密码</h1>

        <p className="mt-3 mb-6 text-center text-[13.5px] leading-relaxed text-zinc-500">
          请输入您的新密码。
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm leading-relaxed">
              密码重置成功，请返回登录页面重新登录。
            </div>
            <Link
              href="/auth/login"
              className="block w-full text-center bg-[#1976d2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition"
            >
              返回登录
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                新密码
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (newPasswordError) setNewPasswordError('')
                }}
                placeholder="至少 6 位"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
              {newPasswordError && (
                <p className="mt-1 text-xs text-red-500">{newPasswordError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                确认新密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) setConfirmPasswordError('')
                }}
                placeholder="再次输入新密码"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
              {confirmPasswordError && (
                <p className="mt-1 text-xs text-red-500">{confirmPasswordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1976d2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
            >
              {loading ? '提交中...' : '确认修改密码'}
            </button>
          </form>
        )}

        {!success && (
          <p className="text-center text-sm text-gray-600 mt-6">
            <Link href="/auth/login" className="text-[#1976d2] hover:underline font-medium">
              返回登录
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
