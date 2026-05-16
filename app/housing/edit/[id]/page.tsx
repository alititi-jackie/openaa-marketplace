import { redirect } from 'next/navigation'

export default async function HousingEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/housing/publish?edit=${id}`)
}
