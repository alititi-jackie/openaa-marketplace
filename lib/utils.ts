import { DEFAULT_LOCATION } from './locationOptions'
import type { JobSalaryUnit } from '@/types'

const DEFAULT_SALARY_UNIT: JobSalaryUnit = '/小时'
const SALARY_UNITS: JobSalaryUnit[] = ['/小时', '/月薪', '/年薪']

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
}

export function normalizeSalaryUnit(unit?: string | null): JobSalaryUnit {
  return SALARY_UNITS.includes(unit as JobSalaryUnit) ? (unit as JobSalaryUnit) : DEFAULT_SALARY_UNIT
}

export function formatSalary(
  min: number | string | null | undefined,
  max?: number | string | null | undefined,
  unit?: string | null
): string {
  const parseSalaryValue = (value: number | string | null | undefined): number => {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    }
    return 0
  }

  const minVal = parseSalaryValue(min)
  const maxVal = parseSalaryValue(max)
  const salary = minVal > 0 ? minVal : maxVal > 0 ? maxVal : 0

  if (salary <= 0) return '薪资电议'

  return `${salary} ${normalizeSalaryUnit(unit)}`
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function formatJobLocation(location?: string | null): string {
  if (!location || location.trim() === '') return DEFAULT_LOCATION
  return location
}
