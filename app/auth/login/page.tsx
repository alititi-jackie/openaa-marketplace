import LoginForm from '@/components/LoginForm'
import { resolveRedirectPath } from '@/lib/user-navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const redirectPath = resolveRedirectPath(
    typeof params.redirect === 'string' ? params.redirect : undefined,
    typeof params.redirectTo === 'string' ? params.redirectTo : undefined,
    typeof params.next === 'string' ? params.next : undefined,
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <LoginForm redirectPath={redirectPath} />
    </div>
  )
}
