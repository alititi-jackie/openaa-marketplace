import { redirect } from 'next/navigation'

export default async function SecondhandEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/secondhand/publish?edit=${id}`)
}
