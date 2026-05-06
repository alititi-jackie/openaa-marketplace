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

export function formatSalary(min: number, max: number): string | null {
  const minVal = min > 0 ? min : 0
  const maxVal = max > 0 ? max : 0
  if (minVal === 0 && maxVal === 0) return null
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`)
  if (maxVal > 0 && minVal === 0) return `≤ $${fmt(maxVal)}`
  if (minVal > 0 && maxVal === 0) return `$${fmt(minVal)}+`
  if (minVal === maxVal) return `$${fmt(minVal)}`
  return `$${fmt(minVal)} - $${fmt(maxVal)}/年`
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function formatJobLocation(location?: string | null): string {
  if (!location || location.trim() === '') return '未填写'
  return location
}
