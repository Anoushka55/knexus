import { LeadsPage } from '@/lib/kpmg-dice/components/records/leads-page'

/** Reading searchParams server-side keeps the client free of useSearchParams. */
export default async function LeadsRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const one = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }

  return (
    <LeadsPage
      initial={{
        stage: one('stage'),
        intent: one('intent'),
        evidence: one('evidence'),
        owner: one('owner'),
        campaign: one('campaign'),
      }}
    />
  )
}
