import { customerJourneys, type CustomerJourney } from './customerJourneys';

export interface TrendPoint {
  date: string;
  value: number;
}

export interface ChainLink {
  label: string;
  value: string;
  /** sub-caption under the value, e.g. "Active signals" */
  caption: string;
  delta: string;
  /** lucide-react icon name */
  icon: string;
}

export interface AiPriority {
  rank: number;
  title: string;
  subtitle: string;
  priority: 'High' | 'Medium' | 'Low';
}

export type ActivityTone = 'purple' | 'red' | 'blue' | 'orange' | 'amber';

export interface ActivityItem {
  time: string;
  text: string;
  tag: string;
  tagTone: ActivityTone;
}

export interface SloComplianceRow {
  service: string;
  pct: number;
  delta: number;
}

const topBusinessImpacts: CustomerJourney[] = customerJourneys.slice(0, 4);

export const overview = {
  kpis: {
    engineeringHealth: 92,
    /** pct vs yesterday */
    engineeringHealthDelta: 6.4,
    criticalIncidents: 2,
    criticalIncidentsDelta: 1,
    servicesAtRisk: 7,
    servicesAtRiskDelta: 3,
    customerJourneysImpacted: 3,
    customerJourneysImpactedDelta: 1,
    estimatedBusinessExposure: '£184K',
    estimatedBusinessExposureDelta: -12,
  },
  engineeringHealthTrend: [
    { date: 'May 2', value: 84 },
    { date: 'May 3', value: 86 },
    { date: 'May 4', value: 83 },
    { date: 'May 5', value: 88 },
    { date: 'May 6', value: 85 },
    { date: 'May 7', value: 87 },
    { date: 'May 8', value: 92 },
  ] satisfies TrendPoint[],
  topBusinessImpacts,
  signalToBusinessChain: [
    { label: 'Signals', value: '1,248', caption: 'Active signals', delta: '+12%', icon: 'Radio' },
    {
      label: 'Infrastructure',
      value: '89',
      caption: 'Resources affected',
      delta: '+8%',
      icon: 'Server',
    },
    { label: 'Services', value: '7', caption: 'Services impacted', delta: '+3', icon: 'Box' },
    {
      label: 'Customer Journeys',
      value: '3',
      caption: 'Journeys impacted',
      delta: '+1',
      icon: 'Users',
    },
    {
      label: 'Transactions',
      value: '12,840',
      caption: 'Transactions affected',
      delta: '+18%',
      icon: 'CreditCard',
    },
    {
      label: 'Business Impact',
      value: '£184K',
      caption: 'Revenue exposure',
      delta: '+12%',
      icon: 'BarChart3',
    },
  ] satisfies ChainLink[],
  aiPriorities: [
    {
      rank: 1,
      title: 'Resolve Checkout Payment Degradation',
      subtitle: 'High business impact • £184K exposure',
      priority: 'High',
    },
    {
      rank: 2,
      title: 'Investigate DB Connection Saturation',
      subtitle: 'Affecting 3 services • 2.1K errors/min',
      priority: 'High',
    },
    {
      rank: 3,
      title: 'Optimize Cloud Costs',
      subtitle: '£412K annual savings opportunity',
      priority: 'Medium',
    },
    {
      rank: 4,
      title: 'Review Change Risk: payment-service v4.8.2',
      subtitle: 'Deployed 10:14 AM • High blast radius',
      priority: 'Medium',
    },
    {
      rank: 5,
      title: 'Reduce MTTR for P1 Incidents',
      subtitle: 'Current MTTR: 42m • Target: 20m',
      priority: 'Low',
    },
  ] satisfies AiPriority[],
  recentActivity: [
    {
      time: '10:24 AM',
      text: 'AI correlated 17 signals into 2 incidents',
      tag: 'AI',
      tagTone: 'purple',
    },
    {
      time: '10:22 AM',
      text: 'Checkout Payment Degradation incident detected',
      tag: 'P1',
      tagTone: 'red',
    },
    {
      time: '10:18 AM',
      text: 'Deployment: payment-service v4.8.2 to production',
      tag: 'Deploy',
      tagTone: 'blue',
    },
    {
      time: '10:15 AM',
      text: 'Database connection saturation alert triggered',
      tag: 'Alert',
      tagTone: 'orange',
    },
    {
      time: '10:12 AM',
      text: 'Cost anomaly detected in us-east-1',
      tag: 'Cost',
      tagTone: 'amber',
    },
  ] satisfies ActivityItem[],
  mttr: {
    currentMinutes: 42,
    targetMinutes: 20,
    gapMinutes: 22,
    deltaMinutes: -8,
    series: [
      { date: 'May 2', value: 52 },
      { date: 'May 3', value: 48 },
      { date: 'May 4', value: 54 },
      { date: 'May 5', value: 46 },
      { date: 'May 6', value: 58 },
      { date: 'May 7', value: 50 },
      { date: 'May 8', value: 42 },
    ] satisfies TrendPoint[],
  },
  sloCompliance: [
    { service: 'Checkout Service', pct: 98.5, delta: 2.1 },
    { service: 'Payment API', pct: 96.2, delta: -1.3 },
    { service: 'Order Service', pct: 99.1, delta: 1.8 },
    { service: 'Inventory Service', pct: 97.3, delta: 0.4 },
    { service: 'Customer Profile', pct: 99.4, delta: 2.5 },
  ] satisfies SloComplianceRow[],
};
