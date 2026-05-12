export function getSafeAdminReturnPath(returnTo: string | null | undefined): string | null {
  const value = (returnTo ?? '').trim()

  if (!value) return null
  if (!/^\/admin(?:\/|$|\?)/.test(value)) return null

  return value
}
