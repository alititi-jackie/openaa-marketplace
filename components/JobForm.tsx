'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { JOB_CATEGORIES, JOB_TYPES } from '@/lib/constants'
import type { JobPosting, JobPostingType } from '@/types'

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
  editJob?: JobPosting | null
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

function safeNumber(s: string): number {
  const n = parseFloat((s || '').trim())
  return Number.isFinite(n) ? n : 0
}

export default function JobForm({ initialType = 'hiring', editJob = null }: Props) {
  const router = useRouter()
  const isEditing = !!editJob

  const defaultJobType = useMemo(() => {
    // For DB NOT NULL safety, prefer “其他”
    return JOB_TYPES.includes('其他') ? '其他' : JOB_TYPES[0]
  }, [])

  const defaultCategory = useMemo(() => {
    return JOB_CATEGORIES.includes('其他') ? '其他' : JOB_CATEGORIES[0]
  }, [])

  const [mode, setMode] = useState<PublishMode>(initialType)

  // Hiring: only description required, other fields optional in UI
  const [hiring, setHiring] = useState<HiringFormData>({
    title: '',
    company: '',
    description: '',
    salary_min: '',
    salary_max: '',
    location: '',
    job_type: defaultJobType,
    category: defaultCategory,
  })

  // Seeking: only personal description/info content required (bio), use existing placeholders
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

  // Edit mode: use DB job.type and prefill fields
  useEffect(() => {
    if (!editJob) return

    const t: JobPostingType = editJob.type === 'seeking' ? 'seeking' : 'hiring'
    setMode(t)

    if (t === 'hiring') {
      setHiring({
        title: editJob.title ?? '',
        company: editJob.company ?? '',
        description: editJob.description ?? '',
        salary_min: String(editJob.salary_min ?? 0),
        salary_max: String(editJob.salary_max ?? 0),
        location: editJob.location ?? '',
        job_type: editJob.job_type ?? defaultJobType,
        category: editJob.category ?? defaultCategory,
      })
    } else {
      // We can't reliably parse structured fields back from description.
      // Keep lightweight UX: prefill required content field from existing description.
      setSeeking((prev) => ({
        ...prev,
        desired_role: editJob.title ?? '',
        region: editJob.location ?? '',
        bio: editJob.description ?? '',
      }))
    }
  }, [editJob, defaultJobType, defaultCategory])

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

    // DB NOT NULL safe defaults (per requirements)
    const payload =
      mode === 'hiring'
        ? {
            type: 'hiring' as const,
            title: hiring.title.trim() || '招聘信息',
            company: hiring.company.trim() || '匿名发布',
            description: hiring.description.trim(),
            salary_min: safeNumber(hiring.salary_min),
            salary_max: safeNumber(hiring.salary_max),
            location: hiring.location.trim() || '-',
            job_type: hiring.job_type?.trim() || defaultJobType,
            category: hiring.category?.trim() || defaultCategory,
            status: 'published' as const,
            views: editJob?.views ?? 0,
            user_id: user.id,
          }
        : {
            type: 'seeking' as const,
            // Existing seeking placeholders
            title: seeking.desired_role.trim() || '求职',
            company: '个人求职',
            description: isEditing ? seeking.bio.trim() : buildSeekingDescription(seeking),
            salary_min: 0,
            salary_max: 0,
            location: seeking.region.trim() || '-',
            job_type: defaultJobType,
            category: defaultCategory,
            status: 'published' as const,
            views: editJob?.views ?? 0,
            user_id: user.id,
          }

    // Enforce required content only
    const contentOk = mode === 'hiring' ? payload.description.trim() : seeking.bio.trim()
    if (!contentOk) {
      setError('请填写信息内容')
      setLoading(false)
      return
    }

    if (isEditing && editJob) {
      const { error: updateError } = await supabase
        .from('job_postings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editJob.id)
        .eq('user_id', user.id)

      if (updateError) {
        setError('保存失败，请重试')
        setLoading(false)
        return
      }

      router.push('/profile/my-jobs')
      return
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
            disabled={isEditing}
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
            disabled={isEditing}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">职位名称</label>
              <input
                type="text"
                name="title"
                value={hiring.title}
                onChange={handleHiringChange}
                placeholder="不填默认：招聘信息"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
              <input
                type="text"
                name="company"
                value={hiring.company}
                onChange={handleHiringChange}
                placeholder="不填默认：匿名发布"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作类型</label>
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
              <p className="mt-1 text-xs text-gray-400">不选默认：其他</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">职位分类</label>
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
              <p className="mt-1 text-xs text-gray-400">不选默认：其他</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作地点</label>
            <input
              type="text"
              name="location"
              value={hiring.location}
              onChange={handleHiringChange}
              placeholder="不填默认：-"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低年薪 (USD)</label>
              <input
                type="number"
                name="salary_min"
                value={hiring.salary_min}
                onChange={handleHiringChange}
                min="0"
                placeholder="不填默认：0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高年薪 (USD)</label>
              <input
                type="number"
                name="salary_max"
                value={hiring.salary_max}
                onChange={handleHiringChange}
                min="0"
                placeholder="不填默认：0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">信息内容 / 职位描述 *</label>
            <textarea
              name="description"
              value={hiring.description}
              onChange={handleHiringChange}
              required
              rows={6}
              placeholder="请写清楚：招聘岗位、要求、待遇、联系方式等（可只写一段内容）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名/称呼</label>
            <input
              type="text"
              name="display_name"
              value={seeking.display_name}
              onChange={handleSeekingChange}
              placeholder="例：Jackie / 王女士（可不填）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期望岗位</label>
              <input
                type="text"
                name="desired_role"
                value={seeking.desired_role}
                onChange={handleSeekingChange}
                placeholder="不填默认：求职"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所在地区</label>
              <input
                type="text"
                name="region"
                value={seeking.region}
                onChange={handleSeekingChange}
                placeholder="不填默认：-"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作经验</label>
              <input
                type="text"
                name="experience"
                value={seeking.experience}
                onChange={handleSeekingChange}
                placeholder="例：3年 / 应届（可不填）"
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
                placeholder="例：随时 / 两周后（可不填）"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
            <input
              type="text"
              name="contact"
              value={seeking.contact}
              onChange={handleSeekingChange}
              placeholder="例：微信 / 电话 / 邮箱（可不填）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">信息内容 / 个人简介 *</label>
            <textarea
              name="bio"
              value={seeking.bio}
              onChange={handleSeekingChange}
              required
              rows={7}
              placeholder="简单介绍技能、经历、求职意向等（可只写一段内容）"
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
        {loading ? (isEditing ? '保存中...' : '发布中...') : isEditing ? '保存修改' : '发布'}
      </button>
    </form>
  )
}
