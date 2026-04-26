'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { JOB_CATEGORIES, JOB_TYPES } from '@/lib/constants'
import type { JobPostingType } from '@/types'

type PublishMode = JobPostingType

interface HiringFormData {
  title: string
  company: string
  description: string
  salary_min: string
  salary_max: string
  location: string
  job_type: string
  category: string
}

interface SeekingFormData {
  display_name: string
  desired_role: string
  region: string
  experience: string
  availability: string
  contact: string
  bio: string
}

interface Props {
  initialType?: JobPostingType
}

function line(label: string, value: string) {
  const v = value.trim()
  return v ? `${label}：${v}` : `${label}：-`
}

function buildSeekingDescription(seeking: SeekingFormData) {
  return [
    '【求职信息】',
    line('姓名/称呼', seeking.display_name),
    line('期望岗位', seeking.desired_role),
    line('所在地区', seeking.region),
    line('工作经验', seeking.experience),
    line('可工作时间', seeking.availability),
    line('联系方式', seeking.contact),
    '',
    '【个人简介】',
    seeking.bio.trim() || '-',
  ].join('\n')
}

export default function JobForm({ initialType = 'hiring' }: Props) {
  const router = useRouter()

  const defaultJobType = useMemo(() => {
    // user asked to default to “其他” for seeking placeholders
    return JOB_TYPES.includes('其他') ? '其他' : JOB_TYPES[0]
  }, [])

  const defaultCategory = useMemo(() => {
    return JOB_CATEGORIES.includes('其他') ? '其他' : JOB_CATEGORIES[0]
  }, [])

  const [mode, setMode] = useState<PublishMode>(initialType)

  const [hiring, setHiring] = useState<HiringFormData>({
    title: '',
    company: '',
    description: '',
    salary_min: '',
    salary_max: '',
    location: '',
    job_type: JOB_TYPES[0],
    category: JOB_CATEGORIES[0],
  })

  const [seeking, setSeeking] = useState<SeekingFormData>({
    display_name: '',
    desired_role: '',
    region: '',
    experience: '',
    availability: '',
    contact: '',
    bio: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleHiringChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setHiring((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSeekingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSeeking((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const payload =
      mode === 'hiring'
        ? {
            type: 'hiring' as const,
            title: hiring.title,
            company: hiring.company,
            description: hiring.description,
            salary_min: parseFloat(hiring.salary_min),
            salary_max: parseFloat(hiring.salary_max),
            location: hiring.location,
            job_type: hiring.job_type,
            category: hiring.category,
            status: 'published' as const,
            views: 0,
            user_id: user.id,
          }
        : {
            type: 'seeking' as const,
            // Placeholders (per requirement)
            title: seeking.desired_role.trim() || '求职',
            company: '个人求职',
            description: buildSeekingDescription(seeking),
            salary_min: 0,
            salary_max: 0,
            location: seeking.region.trim() || '-',
            job_type: defaultJobType,
            category: defaultCategory,
            status: 'published' as const,
            views: 0,
            user_id: user.id,
          }

    const { data, error: insertError } = await supabase
      .from('job_postings')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      setError('发布失败，请重试')
      setLoading(false)
      return
    }

    router.push(`/jobs/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>}

      {/* Mode switch */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">发布类型</label>
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('hiring')}
            className={
              mode === 'hiring'
                ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm'
                : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900'
            }
          >
            我要招人
          </button>
          <button
            type="button"
            onClick={() => setMode('seeking')}
            className={
              mode === 'seeking'
                ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm'
                : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900'
            }
          >
            我要求职
          </button>
        </div>
      </div>

      {mode === 'hiring' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">职位名称 *</label>
              <input
                type="text"
                name="title"
                value={hiring.title}
                onChange={handleHiringChange}
                required
                placeholder="例：高级前端工程师"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司名称 *</label>
              <input
                type="text"
                name="company"
                value={hiring.company}
                onChange={handleHiringChange}
                required
                placeholder="例：ABC 科技公司"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作类型 *</label>
              <select
                name="job_type"
                value={hiring.job_type}
                onChange={handleHiringChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              >
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">职位分类 *</label>
              <select
                name="category"
                value={hiring.category}
                onChange={handleHiringChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              >
                {JOB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作地点 *</label>
            <input
              type="text"
              name="location"
              value={hiring.location}
              onChange={handleHiringChange}
              required
              placeholder="例：San Francisco, CA 或 远程"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低年薪 (USD) *</label>
              <input
                type="number"
                name="salary_min"
                value={hiring.salary_min}
                onChange={handleHiringChange}
                required
                min="0"
                placeholder="80000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高年薪 (USD) *</label>
              <input
                type="number"
                name="salary_max"
                value={hiring.salary_max}
                onChange={handleHiringChange}
                required
                min="0"
                placeholder="120000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">职位描述 *</label>
            <textarea
              name="description"
              value={hiring.description}
              onChange={handleHiringChange}
              required
              rows={5}
              placeholder="请描述职位要求、工作内容、福利待遇等信息"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名/称呼 *</label>
              <input
                type="text"
                name="display_name"
                value={seeking.display_name}
                onChange={handleSeekingChange}
                required
                placeholder="例：Jackie / 王女士"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期望岗位 *</label>
              <input
                type="text"
                name="desired_role"
                value={seeking.desired_role}
                onChange={handleSeekingChange}
                required
                placeholder="例：前端工程师 / 会计"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所在地区 *</label>
            <input
              type="text"
              name="region"
              value={seeking.region}
              onChange={handleSeekingChange}
              required
              placeholder="例：纽约 / 新泽西 / 远程"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作经验</label>
              <input
                type="text"
                name="experience"
                value={seeking.experience}
                onChange={handleSeekingChange}
                placeholder="例：3年 / 应届"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">可工作时间</label>
              <input
                type="text"
                name="availability"
                value={seeking.availability}
                onChange={handleSeekingChange}
                placeholder="例：随时 / 两周后"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系方式 *</label>
            <input
              type="text"
              name="contact"
              value={seeking.contact}
              onChange={handleSeekingChange}
              required
              placeholder="例：微信 / 电话 / 邮箱"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">个人简介 *</label>
            <textarea
              name="bio"
              value={seeking.bio}
              onChange={handleSeekingChange}
              required
              rows={6}
              placeholder="简单介绍技能、经历、求职意向等"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
            />
            <p className="mt-2 text-xs text-gray-400">
              提示：求职信息会以“格式化文本”的方式保存到描述字段中（不新增多列）。
            </p>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1976d2] text-white py-3 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
      >
        {loading ? '发布中...' : '发布'}
      </button>
    </form>
  )
}
