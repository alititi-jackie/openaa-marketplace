import type { SupabaseClient } from '@supabase/supabase-js'

export type AccountStatus = 'active' | 'restricted' | 'banned'

export type AccountPermissionResult = {
  allowed: boolean
  status: AccountStatus | 'unknown'
  message?: string
}

export const BANNED_ACCOUNT_MESSAGE = '此账号因用户投诉举报，现已限制使用。如有疑问，请到“我的”页面提交反馈与举报联系 OpenAA。'
export const RESTRICTED_ACCOUNT_MESSAGE = '账号当前受限，暂不能发布或编辑内容。'
export const ACCOUNT_STATUS_CHECK_FAILED_MESSAGE = '账号状态暂时无法验证，请稍后重试。'

function normalizeAccountStatus(value: unknown): AccountStatus | null {
  if (value === 'active' || value === 'restricted' || value === 'banned') return value
  return null
}

export function getAccountStatusMessage(status: AccountStatus | 'unknown'): string {
  if (status === 'banned') return BANNED_ACCOUNT_MESSAGE
  if (status === 'restricted') return RESTRICTED_ACCOUNT_MESSAGE
  return ACCOUNT_STATUS_CHECK_FAILED_MESSAGE
}

export function isUserBlocked(status: AccountStatus | 'unknown'): boolean {
  return status !== 'active'
}

export async function getUserAccountStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<AccountPermissionResult> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('status')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      return {
        allowed: false,
        status: 'unknown',
        message: ACCOUNT_STATUS_CHECK_FAILED_MESSAGE,
      }
    }

    const status = normalizeAccountStatus((data as { status?: unknown }).status)
    if (!status) {
      return {
        allowed: false,
        status: 'unknown',
        message: ACCOUNT_STATUS_CHECK_FAILED_MESSAGE,
      }
    }

    if (status === 'active') {
      return { allowed: true, status }
    }

    return {
      allowed: false,
      status,
      message: getAccountStatusMessage(status),
    }
  } catch {
    return {
      allowed: false,
      status: 'unknown',
      message: ACCOUNT_STATUS_CHECK_FAILED_MESSAGE,
    }
  }
}

export async function assertUserCanPostOrEdit(
  supabase: SupabaseClient,
  userId: string
): Promise<AccountPermissionResult> {
  return getUserAccountStatus(supabase, userId)
}
