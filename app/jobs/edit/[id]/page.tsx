import { redirect } from 'next/navigation'

export default async function JobEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/jobs/publish?edit=${id}`)
}
