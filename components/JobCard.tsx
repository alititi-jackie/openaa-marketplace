import Link from 'next/link'
import { formatDate, formatSalary } from '@/lib/utils'
import type { JobPosting } from '@/types'

interface Props {
  job: JobPosting
}

export default function JobCard({ job }: Props) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
            <p className="text-gray-600 mt-1">{job.company}</p>
          </div>
          <span className="text-sm bg-blue-50 text-[#1976d2] px-2 py-1 rounded font-medium ml-2 shrink-0">
            {job.job_type}
          </span>
        </div>

        <p className="text-green-600 font-semibold mt-2">
          {formatSalary(job.salary_min, job.salary_max)}
        </p>

        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
          <span>📍 {job.location}</span>
          <span>·</span>
          <span>{job.category}</span>
        </div>

        <div className="mt-3">
          <p className="text-gray-500 text-sm line-clamp-2">{job.description}</p>
          <span className="text-xs text-gray-400 mt-1 block">{formatDate(job.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
