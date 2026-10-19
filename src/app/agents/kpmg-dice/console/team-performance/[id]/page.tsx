import { RepDetail } from '@/lib/kpmg-dice/components/team/rep-detail'

export default async function RepDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <RepDetail repId={id} />
}
