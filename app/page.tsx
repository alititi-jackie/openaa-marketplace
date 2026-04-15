import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OpenAA 华人生活
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            美国华人综合服务平台
          </p>
          <p className="text-gray-500 mb-8">
            二手交易 · 招聘信息 · 社区服务
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/secondhand"
              className="inline-flex items-center justify-center gap-2 bg-[#1976d2] text-white px-8 py-3 rounded-lg hover:bg-[#1565c0] transition font-medium"
            >
              🛍️ 浏览二手商品
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              💼 浏览招聘信息
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition">
            <div className="text-4xl mb-4">🛍️</div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">二手交易</h2>
            <p className="text-gray-600 text-sm">
              轻松发布和购买二手物品，让闲置物品找到新主人
            </p>
            <Link
              href="/secondhand"
              className="mt-4 inline-block text-[#1976d2] hover:underline text-sm font-medium"
            >
              立即浏览 →
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition">
            <div className="text-4xl mb-4">💼</div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">招聘信息</h2>
            <p className="text-gray-600 text-sm">
              发布招聘需求，寻找优质华人人才
            </p>
            <Link
              href="/jobs"
              className="mt-4 inline-block text-[#1976d2] hover:underline text-sm font-medium"
            >
              查看职位 →
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition">
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">华人社区</h2>
            <p className="text-gray-600 text-sm">
              连接美国各地华人，共建温暖社区
            </p>
            <Link
              href="/auth/signup"
              className="mt-4 inline-block text-[#1976d2] hover:underline text-sm font-medium"
            >
              加入社区 →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-16 px-4 pb-16">
        <div className="max-w-2xl mx-auto bg-[#1976d2] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">立即加入 OpenAA</h2>
          <p className="opacity-90 mb-6">注册免费，开始发布商品和招聘信息</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-[#1976d2] px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              免费注册
            </Link>
            <Link
              href="/auth/login"
              className="border border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              已有账号？登录
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
