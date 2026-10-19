'use client'

import { AiCommandCenterStrip } from './ai-command-center-strip'
import { CustomerSnapshotCard } from './customer-snapshot-card'
import { KpiStrip } from './kpi-strip'
import { LeadQualityTrendCard } from './lead-quality-trend-card'
import { PipelineOverviewCard } from './pipeline-overview-card'
import { RecommendedActionsCard } from './recommended-actions-card'
import { RiskAlertsCard } from './risk-alerts-card'
import { TopCampaignsCard } from './top-campaigns-card'
import { useOverviewData } from '@/lib/kpmg-dice/lib/selectors/use-overview-data'

export function OverviewDashboard() {
  const {
    kpis,
    funnel,
    overallConversion,
    trend,
    campaigns,
    nextBestActions,
    alerts,
  } = useOverviewData()

  return (
    <div className="animate-fade-in space-y-4">
      <KpiStrip values={kpis} />

      {/* The two tables need more width than the chart, which reads fine narrow. */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.15fr_0.92fr_1.13fr]">
        <PipelineOverviewCard
          stages={funnel}
          overallConversion={overallConversion}
        />
        <LeadQualityTrendCard data={trend} />
        <TopCampaignsCard campaigns={campaigns} />
      </div>

      {/* Wider outer columns: the action table and the 360 snapshot both carry
          more content than the alert list between them — but the alert
          headlines still need enough width to wrap at phrase level. */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.4fr_1.15fr_1.45fr]">
        <RecommendedActionsCard rows={nextBestActions} />
        <RiskAlertsCard alerts={alerts.slice(0, 4)} />
        <CustomerSnapshotCard />
      </div>

      <AiCommandCenterStrip />
    </div>
  )
}
