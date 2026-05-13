import Link from 'next/link'

interface PageBackButtonProps {
  href?: string
  label?: string
}

export default function PageBackButton({
  href = '/profile',
  label = '← 返回我的页面',
}: PageBackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-xl border border-zinc-100 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50"
    >
      {label}
    </Link>
  )
}
