import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Car,
  ChevronRight,
  ClipboardCheck,
  FileText,
  MapPin,
  RefreshCw,
} from 'lucide-react'

const practiceLink = 'https://openaa.com/dmv/ny/practice/index.html'
const ticketsLink = 'https://openaa.com/dmv/tickets/index.html'

const quickTools = [
  { title: 'DMV 笔试模拟', desc: 'Learner Permit 练习入口', href: practiceLink, Icon: BookOpen, external: false },
  { title: '罚单查询', desc: '交通罚单与处理指引', href: ticketsLink, Icon: AlertTriangle, external: false },
  { title: '驾照申请', desc: 'Learner Permit 官方入口', href: 'https://dmv.ny.gov/driver-license/get-learner-permit', Icon: FileText, external: true },
  { title: '车辆注册', desc: '车辆注册与牌照流程', href: 'https://dmv.ny.gov/registration/register-and-title-vehicle-new-york-state', Icon: Car, external: true },
  { title: '驾照更新', desc: '到期续期与资料要求', href: 'https://dmv.ny.gov/driver-license/renew-license', Icon: RefreshCw, external: true },
  { title: '地址变更', desc: '搬家后地址更新入口', href: 'https://dmv.ny.gov/address-change/how-change-your-address', Icon: MapPin, external: true },
]

const licenseSteps = [
  '准备身份证明和地址证明',
  '申请 Learner Permit',
  '参加 DMV 笔试',
  '拿到学习驾照后练车',
  '预约路考',
  '通过后领取正式驾照',
]

const officialLinks = [
  { title: 'NY DMV 官网', desc: '纽约州 DMV 官方首页，具体规则以官网最新信息为准。', href: 'https://dmv.ny.gov/' },
  { title: 'Learner Permit 申请', desc: '学习驾照申请入口与所需材料说明。', href: 'https://dmv.ny.gov/driver-license/get-learner-permit' },
  { title: 'Road Test 路考预约', desc: '官方路考预约与流程说明。', href: 'https://dmv.ny.gov/driver-license/schedule-and-take-road-test' },
  { title: 'License Renewal 驾照更新', desc: '驾照续期入口，具体费用与流程以官网为准。', href: 'https://dmv.ny.gov/driver-license/renew-license' },
  { title: 'Vehicle Registration 车辆注册', desc: '车辆注册、过户与牌照相关官方入口。', href: 'https://dmv.ny.gov/registration' },
  { title: 'Change Address 地址变更', desc: '地址变更官方说明与办理入口。', href: 'https://dmv.ny.gov/address-change' },
  { title: 'Traffic Tickets 交通罚单', desc: '纽约州交通罚单查询与处理入口。', href: 'https://dmv.ny.gov/tickets' },
  { title: 'NYC Parking Tickets 停车罚单', desc: '纽约市停车罚单查询与缴费入口。', href: 'https://www.nyc.gov/site/finance/vehicles/services-violation.page' },
]

const localServices = ['驾校', '汽车保险', '翻译公证', '罚单律师', '修车服务', '二手车买卖']

const dmvGuides = [
  '纽约 DMV 笔试怎么准备？',
  'Learner Permit 是什么？',
  '纽约路考预约流程',
  '纽约停车罚单怎么查？',
  '新手买车后需要做什么？',
]

export default function DMVPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 pt-5 pb-28">
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm">
        <h1 className="text-2xl font-black text-zinc-900">OpenAA DMV 工具中心</h1>
        <p className="mt-2 text-sm font-medium text-blue-700">纽约 DMV 笔试、罚单查询、驾照申请与车辆服务入口</p>
        <p className="mt-2 text-sm text-zinc-600">为美国华人整理常用 DMV 工具、官方入口和中文说明</p>
      </section>

      <section className="mt-4">
        <h2 className="text-base font-bold text-zinc-900">DMV 快捷工具</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {quickTools.map(({ title, desc, href, Icon, external }) => (
            <Link
              key={title}
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={16} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">{title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{desc}</p>
                </div>
                <ChevronRight size={14} className="mt-1 shrink-0 text-zinc-400" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">新手办驾照流程</h2>
        <div className="mt-3 space-y-2">
          {licenseSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="text-sm text-zinc-700">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">纽约 DMV 笔试模拟</h3>
              <p className="mt-1 text-sm text-zinc-600">适合准备 Learner Permit 的新手提前练习</p>
            </div>
            <ClipboardCheck size={18} className="shrink-0 text-blue-600" />
          </div>
          <Link
            href={practiceLink}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            开始练习
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">罚单查询</h3>
              <p className="mt-1 text-sm text-zinc-600">整理停车罚单、红灯摄像头、交通罚单等常用入口</p>
            </div>
            <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          </div>
          <Link
            href={ticketsLink}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-sm font-medium text-white"
          >
            查询罚单
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">官方入口</h2>
        <div className="mt-2 divide-y divide-zinc-100">
          {officialLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-zinc-400" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">DMV 相关本地服务</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {localServices.map((item) => (
            <Link
              key={item}
              href="/services"
              className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 transition-colors active:bg-zinc-100"
            >
              {item}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">DMV 教程文章</h2>
        <div className="mt-2 divide-y divide-zinc-100">
          {dmvGuides.map((item) => (
            <Link key={item} href="/news?category=DMV教程" className="flex items-center justify-between py-3">
              <p className="text-sm text-zinc-700">{item}</p>
              <ChevronRight size={15} className="shrink-0 text-zinc-400" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div className="flex items-start gap-2">
          <FileText size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <div className="space-y-1 text-xs leading-5 text-amber-900">
            <p>OpenAA 只提供中文整理和入口导航。</p>
            <p>DMV 规则、费用、预约和罚单信息以官方页面为准。</p>
            <p>涉及法律、罚单争议、保险等问题，请咨询专业人士或官方机构。</p>
          </div>
        </div>
      </section>
    </div>
  )
}
