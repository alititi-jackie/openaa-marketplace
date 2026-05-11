import { useCallback, useEffect, useRef, useState } from 'react'

const SUCCESS_DELAY = 3000
const ERROR_DELAY = 4500

function isSuccessText(msg: string): boolean {
  return msg.includes('成功') || msg.includes('完成') || msg.includes('已保存')
}

/**
 * Drop-in replacement for useState('') that auto-clears the message after a delay.
 * Success messages (containing '成功', '完成', '已保存') clear after 3 s.
 * Other messages (errors / warnings) clear after 4.5 s.
 * Calling setMessage('') clears immediately without scheduling a new timer.
 */
export function useAutoMessage(): [string, (msg: string) => void] {
  const [message, setMessageState] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const setMessage = useCallback(
    (msg: string) => {
      clearTimer()
      setMessageState(msg)
      if (msg) {
        const delay = isSuccessText(msg) ? SUCCESS_DELAY : ERROR_DELAY
        timerRef.current = setTimeout(() => {
          setMessageState('')
          timerRef.current = null
        }, delay)
      }
    },
    [clearTimer],
  )

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return [message, setMessage]
}
