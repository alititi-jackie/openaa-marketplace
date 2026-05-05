import Link from 'next/link'

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md mx-auto text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">邮箱验证成功！</h1>
        <p className="text-gray-700 text-sm leading-relaxed mb-6">
          您的 OpenAA 账号已完成邮箱确认。
          <br />
          请回到您刚才注册 OpenAA 的页面重新登录；也可以点击下方按钮进入登录页面。
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-[#1976d2] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition"
        >
          前往登录
        </Link>
        <p className="mt-5 text-xs text-zinc-400 leading-relaxed">
          如果登录时仍提示未验证，请稍等几秒后刷新再试。
        </p>
      </div>
    </div>
  )
}
