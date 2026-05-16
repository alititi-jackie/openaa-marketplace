'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import DmvShareButton from '@/components/dmv/DmvShareButton'

type StepSection = {
  prepare: string[]
  howTo: string[]
  notes: string[]
  links: Array<{ label: string; href: string; external?: boolean }>
}

const processSteps: Array<{ title: string; content: StepSection }> = [
  {
    title: '准备身份证明和地址证明',
    content: {
      prepare: [
        '纽约申请 Learner Permit / Driver License 前，需要准备 DMV 认可的身份证明、年龄证明和纽约地址证明。',
        '纽约 DMV 使用 6 分身份证明规则，Proof of Name 文件加起来通常要达到至少 6 分。',
        'Standard Permit / License 通常需要 1 份纽约地址证明。',
        'REAL ID / Enhanced 通常需要 2 份纽约地址证明。',
      ],
      howTo: [
        '当前地址必须显示在地址证明文件上；P.O. Box 通常不能作为地址证明。',
        '具体文件和分值以 NY DMV 官方 ID-44 / Document Guide 为准。',
        '最稳做法：去 DMV 前先用官方 Document Guide 检查资料是否够分。',
      ],
      notes: [
        '中国护照、绿卡、工卡、社安卡、美国银行卡/银行账单、水电费账单、租房合同、保险/学校/政府信件等，可能可作为不同类型证明。',
        '但是否可用、占几分，以官方 Document Guide / ID-44 为准。',
        '资料不够不要直接预约去考试，容易白跑。',
        '最省事方式：找驾校或熟悉 DMV 的人帮你先检查资料；想 DIY 自己办理，再按步骤继续。',
      ],
      links: [
        { label: 'DMV Document Guide', href: 'https://dmv.ny.gov/more-info/dmv-document-guide', external: true },
        { label: 'ID-44 文件清单', href: 'https://dmv.ny.gov/forms/id44.pdf', external: true },
      ],
    },
  },
  {
    title: '申请 Learner Permit',
    content: {
      prepare: [
        '资料准备好后，普通小车一般选择 Class D Learner Permit。',
        '需要填写 MV-44 表格：Application for Permit, Driver License or Non-Driver ID Card。',
      ],
      howTo: [
        'DMV 有中文 MV-44 表格，可提前下载填写；也可现场填写。',
        '英文不好要确认申请的是普通小车 Class D Learner Permit。',
        '可通过 Office Locations 查询办公室，有些服务可预约。',
      ],
      notes: [
        '非美国公民：MV-44 中涉及 voter registration / 选民登记要认真看，不要误勾。',
      ],
      links: [
        { label: '下载中文 MV-44', href: 'https://dmv.ny.gov/forms/mv44ch.pdf', external: true },
        { label: '查 DMV 办公室 / 预约', href: 'https://dmv.ny.gov/contact-us/office-locations', external: true },
      ],
    },
  },
  {
    title: '参加 DMV 笔试',
    content: {
      prepare: [
        '带齐身份证明、地址证明、MV-44 和付款方式。',
      ],
      howTo: [
        '通常流程：视力测试、交材料、拍照、缴费、笔试。',
        '通过后一般有临时 Learner Permit，正式文件可能邮寄。',
        '纽约 Class D 笔试规则：20 题，至少对 14 题，并且 4 道交通标志题至少对 2 道。',
      ],
      notes: [
        '费用以官方/现场为准；付款方式以官方/办公室为准。',
        '建议提前在 OpenAA 做中文题库练习和模拟。',
      ],
      links: [
        { label: '开始中文题库练习', href: '/dmv/ny/questions' },
        { label: '练习模式', href: '/dmv/ny/quiz' },
        { label: '模拟考试', href: '/dmv/ny/mock-test' },
        { label: 'DMV 费用说明', href: 'https://dmv.ny.gov/driver-license/fees-refunds', external: true },
      ],
    },
  },
  {
    title: '拿到学习驾照后练车',
    content: {
      prepare: [
        'Learner Permit 后不能自己单独开车。',
        '必须按纽约规定，在合格持证驾驶员陪同下练车。',
      ],
      howTo: [
        '建议驾校或有经验者陪练，熟悉纽约道路与常见项目（停车/转弯/让行/Stop Sign/路边停车等）。',
        '练车随身携带 Learner Permit。',
      ],
      notes: [
        '年龄/地点/时间段可能有额外限制，以官方 learner permit restrictions 为准。',
        '别急着约路考，先把基本动作练稳定。',
      ],
      links: [
        { label: '查看 NY DMV 新手驾照流程', href: 'https://dmv.ny.gov/driver-license/get-learner-permit', external: true },
      ],
    },
  },
  {
    title: '预约路考',
    content: {
      prepare: [
        '路考前通常需完成 5 小时 Pre-Licensing Course，或符合 DMV 认可 Driver Education。',
      ],
      howTo: [
        '预约所需：1）有效 NYS Learner Permit 2）有效 MV-278 或 MV-285 3）考试地点 ZIP Code 4）至少 1 次未使用的 road test 机会。',
        '等待时间可能几周，旺季更久，以系统为准。',
        '不一定必须在居住 county，可按可预约地点选择。',
      ],
      notes: [
        '成功后确认日期时间地点，并安排考试车辆。',
      ],
      links: [
        { label: '预约路考', href: 'https://dmv.ny.gov/driver-license/schedule-and-take-a-road-test', external: true },
        { label: '5 小时课程说明', href: 'https://dmv.ny.gov/driver-license/the-driver-pre-licensing-course', external: true },
      ],
    },
  },
  {
    title: '通过后领取正式驾照',
    content: {
      prepare: [
        '路考通过后按指示领取临时驾照/查看结果。',
      ],
      howTo: [
        '正式驾照通常邮寄到 DMV 记录地址。',
        '确认地址正确；搬家及时更新。',
        '未收到按指引查询处理。',
      ],
      notes: [
        '未通过则继续练习再预约。',
      ],
      links: [
        { label: 'NY DMV Driver License 首页', href: 'https://dmv.ny.gov/driver-license', external: true },
        { label: '路考页面', href: 'https://dmv.ny.gov/driver-license/schedule-and-take-a-road-test', external: true },
      ],
    },
  },
]

function StepBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
      <ul className="mt-1 space-y-1 text-sm leading-relaxed text-zinc-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DmvLicenseProcessModal({
  open,
  initialStep,
  onClose,
}: {
  open: boolean
  initialStep: number
  onClose: () => void
}) {
  const [expandedStep, setExpandedStep] = useState(initialStep)

  useEffect(() => {
    if (open) {
      setExpandedStep(initialStep)
    }
  }, [open, initialStep])

  useEffect(() => {
    if (!open) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="关闭弹窗遮罩"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-2xl md:inset-x-1/2 md:bottom-auto md:top-1/2 md:max-h-[85vh] md:w-[calc(100%-2rem)] md:max-w-[720px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white px-4 py-3 md:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-zinc-900">纽约新手办驾照流程</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                适合第一次在纽约申请 Learner Permit / Driver License 的华人参考
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭流程详情弹窗"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3">
            <DmvShareButton
              path="/dmv"
              title="OpenAA 纽约 DMV 新手办驾照流程"
              text="纽约新手办驾照流程（中文参考）：资料准备、Permit、笔试、练车、路考到领证。"
              label="分享"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 active:scale-[0.97]"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-4 md:px-5">
          <div className="space-y-3">
            {processSteps.map((step, index) => {
              const isOpen = expandedStep === index
              const buttonId = `dmv-license-step-${index + 1}`
              const panelId = `dmv-license-step-panel-${index + 1}`
              return (
                <div key={step.title} className="rounded-2xl border border-zinc-200 bg-zinc-50">
                  <button
                    id={buttonId}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setExpandedStep((prev) => (prev === index ? -1 : index))}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-zinc-800">{step.title}</span>
                    </div>
                    {isOpen ? <ChevronDown size={16} className="shrink-0 text-zinc-400" /> : <ChevronRight size={16} className="shrink-0 text-zinc-400" />}
                  </button>

                  {isOpen && (
                    <div id={panelId} role="region" aria-labelledby={buttonId} className="space-y-4 border-t border-zinc-200 bg-white px-3 py-3 text-sm">
                      <StepBlock title="需要准备什么" items={step.content.prepare} />
                      <StepBlock title="怎样做" items={step.content.howTo} />
                      <StepBlock title="注意事项" items={step.content.notes} />
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-900">相关按钮 / 官方链接</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {step.content.links.map((item) =>
                            item.external ? (
                              <a
                                key={item.href}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                              >
                                {item.label}
                              </a>
                            ) : (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                              >
                                {item.label}
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-zinc-500">
            以上内容为 OpenAA 根据纽约 DMV 官方资料整理的中文办事参考，实际要求可能因身份类型、申请类型、DMV 办公室和政策更新而不同。办理前请以
            NY DMV 官方网站和现场工作人员要求为准。
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 active:scale-[0.98]"
            >
              返回 DMV 首页
            </button>
            <Link
              href="/"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 active:scale-[0.98]"
            >
              返回总首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
