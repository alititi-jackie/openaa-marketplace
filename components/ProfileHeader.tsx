import Image from 'next/image'
import type { UserProfile } from '@/types'

interface Props {
  profile: UserProfile
}

export default function ProfileHeader({ profile }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
      <div className="relative w-20 h-20 mx-auto mb-3">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.username}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#1976d2] flex items-center justify-center text-white text-2xl font-bold">
            {profile.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
      <h2 className="text-xl font-bold text-gray-900">{profile.username}</h2>
      <p className="text-gray-500 text-sm">{profile.email}</p>
      {profile.bio && (
        <p className="text-gray-600 text-sm mt-2">{profile.bio}</p>
      )}
      {profile.phone && (
        <p className="text-gray-500 text-sm mt-1">📞 {profile.phone}</p>
      )}
    </div>
  )
}
