import { CustomerProfile } from '@/lib/kpmg-dice/components/customer/customer-profile'

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CustomerProfile leadId={id} />
}
