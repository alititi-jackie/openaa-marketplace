export interface UserProfile {
  id: string
  email: string
  username: string
  avatar_url?: string
  bio?: string
  phone?: string
  created_at: string
  updated_at: string
}

/** Partial user data returned by Supabase joined queries */
export interface JoinedUser {
  username: string
  avatar_url?: string
}

export type SecondhandItemType = 'selling' | 'buying'

export interface SecondhandItem {
  id: number
  user_id: string
  title: string
  description: string
  price: number
  category: string
  images: string[]
  status: 'published' | 'unpublished'
  views: number
  created_at: string
  updated_at: string
  type?: SecondhandItemType
  user?: JoinedUser
}

export type JobPostingType = 'hiring' | 'seeking'

export interface JobPosting {
  id: number
  user_id: string
  /**
   * Job post type.
   * - 'hiring': 招聘岗位
   * - 'seeking': 求职人才
   *
   * Optional for backward-compat with older rows / environments.
   */
  type?: JobPostingType
  title: string
  company: string
  description: string
  salary_min: number
  salary_max: number
  location: string
  job_type: string
  category: string
  status: 'published' | 'unpublished'
  views: number
  created_at: string
  updated_at: string
  user?: JoinedUser
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
