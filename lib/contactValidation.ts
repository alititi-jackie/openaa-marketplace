/**
 * Unified contact validation for phone and wechat fields.
 * Used across all publish/edit forms (secondhand, jobs, housing, services).
 */

export interface ContactValidationResult {
  ok: boolean
  message?: string
}

/** The error message shown when both phone and wechat are empty. */
export const CONTACT_MISSING_MESSAGE = '请至少填写联系电话或微信，方便用户联系你。'

/**
 * Extracts only the digit characters from a phone string.
 */
export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Validates phone and wechat contact fields according to the unified rules:
 *
 * 1. Trims both inputs.
 * 2. Both empty → error.
 * 3. Phone not empty:
 *    a. Must contain only digits, +, space, -, ( and ).
 *       Otherwise → invalid-chars error.
 *    b. Digit count must be 8–15.
 *       Otherwise → length error.
 * 4. Wechat not empty:
 *    a. Length must be 4–50.
 *       Otherwise → length error.
 * 5. All checks pass → { ok: true }.
 */
export function validateContactFields(
  phone: string,
  wechat: string
): ContactValidationResult {
  const p = phone.trim()
  const w = wechat.trim()

  if (!p && !w) {
    return { ok: false, message: CONTACT_MISSING_MESSAGE }
  }

  if (p) {
    // Only allow digits, +, space, -, ( and )
    if (/[^\d+\s\-()\u0028\u0029]/.test(p)) {
      return { ok: false, message: '输入电话号码有误，请输入正确的联系电话。' }
    }

    const digits = normalizePhoneDigits(p)
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, message: '输入电话号码有误，请输入正确的联系电话。' }
    }
  }

  if (w) {
    if (w.length < 4 || w.length > 50) {
      return { ok: false, message: '微信号有误，请填写正确的微信号。' }
    }
  }

  return { ok: true }
}
