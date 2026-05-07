import Image from 'next/image'
import type { UserProfile } from '@/types'

interface Props {
  profile: UserProfile
}

export default function ProfileHeader({ profile }: Props) {
  return (
    <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] px-5 py-5 text-center">
      <div className="relative w-[76px] h-[76px] mx-auto mb-2">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.username}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-[76px] h-[76px] rounded-full bg-[#1976d2] flex items-center justify-center text-white text-[22px] font-bold">
            {profile.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
      <h2 className="text-lg font-bold text-gray-900 leading-tight">{profile.username}</h2>
      <p className="mt-1 text-gray-500 text-sm leading-tight">{profile.email}</p>
      {profile.bio && (
        <p className="text-gray-600 text-sm mt-1.5 leading-tight">{profile.bio}</p>
      )}
      {profile.phone && (
        <p className="text-gray-500 text-sm mt-1.5 leading-tight">📞 {profile.phone}</p>
      )}
    </div>
  )
}
