import { LOCATION_OPTIONS } from '@/lib/locationOptions'

export const ALL_REGIONS = '全部'

interface RegionFilterProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function RegionFilter({ value, onChange, className }: RegionFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1976d2]'
      }
    >
      <option value={ALL_REGIONS}>全部地区</option>
      {LOCATION_OPTIONS.map((loc) => (
        <option key={loc} value={loc}>
          {loc}
        </option>
      ))}
    </select>
  )
}
