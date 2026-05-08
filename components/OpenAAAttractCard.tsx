import Link from 'next/link'

export default function OpenAAAttractCard() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-4">
      <p className="text-sm font-bold text-blue-900">OpenAA 美国华人生活平台</p>
      <p className="mt-1 text-xs text-blue-700">
        一站查看招聘、房屋、二手、本地服务与实用资讯，获取最新华人生活信息。
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-[#1976d2] px-3 py-1.5 text-xs font-semibold text-white"
        >
          回到首页
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"
        >
          查看本地服务
        </Link>
      </div>
    </div>
  )
}
