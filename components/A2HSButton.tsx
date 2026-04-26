'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, PlusSquare } from 'lucide-react'

type InstallState =
  | { kind: 'unavailable' }
  | { kind: 'android'; prompt: BeforeInstallPromptEvent }
  | { kind: 'ios' }
  | { kind: 'installed' }

// Minimal typing for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userChoice: Promise<any>
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iosStandalone = (window.navigator as any).standalone === true
  // other browsers
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches
  return Boolean(iosStandalone || displayModeStandalone)
}

export function useA2HS() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      // Android/Chrome
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const state: InstallState = useMemo(() => {
    if (typeof window === 'undefined') return { kind: 'unavailable' }
    if (isStandalone()) return { kind: 'installed' }
    if (deferredPrompt) return { kind: 'android', prompt: deferredPrompt }
    if (isIos()) return { kind: 'ios' }
    return { kind: 'unavailable' }
  }, [deferredPrompt])

  const promptInstall = async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    try {
      await deferredPrompt.userChoice
    } finally {
      setDeferredPrompt(null)
    }
    return true
  }

  return { state, promptInstall }
}

export default function A2HSButton({
  className,
  onIosNeedInstructions,
}: {
  className?: string
  onIosNeedInstructions?: () => void
}) {
  const { state, promptInstall } = useA2HS()

  const label = '📲 添加 OpenAA 到手机桌面'

  const disabled = state.kind === 'installed' || state.kind === 'unavailable'

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (state.kind === 'android') {
          await promptInstall()
          return
        }
        if (state.kind === 'ios') {
          onIosNeedInstructions?.()
          return
        }
      }}
      disabled={disabled}
      aria-label={label}
      title={disabled ? '当前浏览器不支持或已安装' : label}
    >
      {label}
    </button>
  )
}

export function IosA2HSModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[calc(100%-32px)] max-w-[520px] rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
              <PlusSquare size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-[13px] font-black text-zinc-900">添加到主屏幕</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">iPhone / Safari</div>
            </div>
          </div>
          <button
            type="button"
            aria-label="关闭"
            className="w-9 h-9 rounded-full bg-zinc-50 ring-1 ring-zinc-100 flex items-center justify-center"
            onClick={onClose}
          >
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        <div className="mt-3 text-[13px] leading-relaxed text-zinc-700">
          请点击浏览器分享按钮，然后选择“添加到主屏幕”。
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="w-full rounded-2xl bg-zinc-900 text-white font-bold text-[13px] py-3"
            onClick={onClose}
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}
