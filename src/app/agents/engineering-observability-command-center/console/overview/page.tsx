import { HeartPulse, OctagonAlert, PoundSterling, TriangleAlert, Users } from 'lucide-react';

import { KpiTile } from '@/lib/engineering-observability/shared/KpiTile';
import { overview } from '@/lib/engineering-observability/data/overview';

import { AiPrioritiesCard } from './_components/AiPrioritiesCard';
import { BusinessImpactsCard } from './_components/BusinessImpactsCard';
import { CriticalIncidentsCard } from './_components/CriticalIncidentsCard';
import { HealthTrendCard } from './_components/HealthTrendCard';
import { MttrCard } from './_components/MttrCard';
import { PageToolbar } from './_components/PageToolbar';
import { RecentActivityCard } from './_components/RecentActivityCard';
import { SloComplianceCard } from './_components/SloComplianceCard';
import { ValueChainCard } from './_components/ValueChainCard';

const { kpis } = overview;

export default function OverviewPage() {
  return (
    <div className="space-y-3 p-5">
      <PageToolbar />

      {/* KPI row */}
      <div className="flex flex-wrap gap-3">
        <KpiTile
          icon={HeartPulse}
          iconTint="blue"
          label="Engineering Health"
          value={kpis.engineeringHealth}
          valueSuffix="/100"
          delta={kpis.engineeringHealthDelta}
          deltaSuffix="%"
          deltaLabel="vs yesterday"
          deltaTone="up-good"
        />
        <KpiTile
          icon={OctagonAlert}
          iconTint="red"
          label="Critical Incidents"
          value={kpis.criticalIncidents}
          delta={kpis.criticalIncidentsDelta}
          deltaLabel="vs yesterday"
          deltaTone="up-bad"
        />
        <KpiTile
          icon={TriangleAlert}
          iconTint="orange"
          label="Services at Risk"
          value={kpis.servicesAtRisk}
          delta={kpis.servicesAtRiskDelta}
          deltaLabel="vs yesterday"
          deltaTone="up-bad"
        />
        <KpiTile
          icon={Users}
          iconTint="purple"
          label="Customer Journeys Impacted"
          value={kpis.customerJourneysImpacted}
          delta={kpis.customerJourneysImpactedDelta}
          deltaLabel="vs yesterday"
          deltaTone="up-bad"
        />
        <KpiTile
          icon={PoundSterling}
          iconTint="blue"
          label="Estimated Business Exposure"
          value={kpis.estimatedBusinessExposure}
          delta={kpis.estimatedBusinessExposureDelta}
          deltaSuffix="%"
          deltaLabel="vs yesterday"
          deltaTone="up-bad"
        />
      </div>

      {/* Trend + business impacts + critical incidents */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.16fr_1fr_1.15fr]">
        <HealthTrendCard />
        <BusinessImpactsCard />
        <CriticalIncidentsCard />
      </div>

      {/* AI priorities + the signal-to-business chain */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[386fr_918fr]">
        <AiPrioritiesCard />
        <ValueChainCard />
      </div>

      {/* Activity + MTTR + SLOs */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[413fr_423fr_456fr]">
        <RecentActivityCard />
        <MttrCard />
        <SloComplianceCard />
      </div>
    </div>
  );
}
