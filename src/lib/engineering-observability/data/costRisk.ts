export type RiskSeverity = 'High' | 'Medium' | 'Low';

export interface SpendDay {
  /** e.g. "Apr 9" */
  date: string;
  compute: number;
  storage: number;
  database: number;
  network: number;
  other: number;
  total: number;
}

export interface CostByDomain {
  domain: string;
  spend: string;
  pct: number;
}

export interface CostDriver {
  driver: string;
  spend: string;
  tone: RiskSeverity;
}

export interface OptimizationOpportunity {
  opportunity: string;
  impact: RiskSeverity;
  effort: RiskSeverity;
  annualSavings: string;
}

export interface RiskFinding {
  finding: string;
  severity: RiskSeverity;
  count: number;
}

export interface ProviderSpend {
  provider: string;
  spend: string;
  pct: number;
}

export interface CostAnomaly {
  service: string;
  spend: string;
  deltaPct: number;
  time: string;
}

/** Stacked-bar categories, in stack order (bottom to top). */
export const spendCategories = [
  { key: 'compute', label: 'Compute', color: '#1E40AF' },
  { key: 'storage', label: 'Storage', color: '#00A3E0' },
  { key: 'database', label: 'Database', color: '#7C3AED' },
  { key: 'network', label: 'Network', color: '#0D9488' },
  { key: 'other', label: 'Other', color: '#94A3B8' },
] as const;

const MONTH_DAY_LABELS = (() => {
  // 30 days ending May 8, 2025 -> Apr 9 .. May 8
  const labels: string[] = [];
  for (let day = 9; day <= 30; day += 1) labels.push(`Apr ${day}`);
  for (let day = 1; day <= 8; day += 1) labels.push(`May ${day}`);
  return labels;
})();

/**
 * Deterministic 30-day spend curve. Weighted so the month totals the
 * headline £2.48M and trends upward (+12.6% month on month).
 */
function buildCloudSpendOverTime(): SpendDay[] {
  const TARGET_TOTAL = 2_480_000;
  const split = { compute: 0.46, storage: 0.14, database: 0.22, network: 0.11, other: 0.07 };

  // Deterministic wobble — no Math.random so builds are reproducible.
  const weights = MONTH_DAY_LABELS.map((_, index) => {
    const trend = 0.93 + (0.14 * index) / (MONTH_DAY_LABELS.length - 1);
    const wobble = 1 + 0.045 * Math.sin(index * 1.7) + 0.02 * Math.cos(index * 0.9);
    return trend * wobble;
  });

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

  return MONTH_DAY_LABELS.map((date, index) => {
    const total = Math.round((weights[index] / weightSum) * TARGET_TOTAL);
    const compute = Math.round(total * split.compute);
    const storage = Math.round(total * split.storage);
    const database = Math.round(total * split.database);
    const network = Math.round(total * split.network);
    const other = total - compute - storage - database - network;
    return { date, compute, storage, database, network, other, total };
  });
}

export const costRisk = {
  kpis: {
    totalCloudSpend: '£2.48M',
    totalDeltaPct: 12.6,
    budgetActual: '£2.48M',
    budgetTotal: '£2.90M',
    budgetPctUsed: 85.5,
    forecastEoM: '£2.96M',
    forecastDeltaPct: 8.2,
    optimizationOpportunity: '£412K',
    optimizationPctOfSpend: 16.6,
    anomaliesDetected: 23,
    anomaliesDelta: 4,
    highRiskFindings: 17,
    highRiskDelta: 3,
  },
  cloudSpendOverTime: buildCloudSpendOverTime(),
  costByDomain: [
    { domain: 'Customer Experience', spend: '£842K', pct: 33.9 },
    { domain: 'Payments Platform', spend: '£612K', pct: 24.7 },
    { domain: 'Order Management', spend: '£418K', pct: 16.9 },
    { domain: 'Data & Analytics', spend: '£286K', pct: 11.5 },
    { domain: 'Identity & Access', spend: '£168K', pct: 6.8 },
    { domain: 'Other', spend: '£152K', pct: 6.1 },
  ] satisfies CostByDomain[],
  topCostDrivers: [
    { driver: 'Over-provisioned Compute', spend: '£184K', tone: 'High' },
    { driver: 'Unused/Idle Resources', spend: '£96K', tone: 'Medium' },
    { driver: 'Data Transfer Out', spend: '£54K', tone: 'Medium' },
    { driver: 'Orphaned Storage', spend: '£41K', tone: 'Low' },
    { driver: 'Unused Databases', spend: '£37K', tone: 'Low' },
  ] satisfies CostDriver[],
  optimizationOpportunities: [
    {
      opportunity: 'Rightsize compute instances',
      impact: 'High',
      effort: 'Low',
      annualSavings: '£124K',
    },
    {
      opportunity: 'Schedule non-prod shutdown',
      impact: 'High',
      effort: 'Low',
      annualSavings: '£98K',
    },
    {
      opportunity: 'Storage lifecycle policies',
      impact: 'Medium',
      effort: 'Low',
      annualSavings: '£64K',
    },
    {
      opportunity: 'Remove unused load balancers',
      impact: 'Medium',
      effort: 'Medium',
      annualSavings: '£48K',
    },
    {
      opportunity: 'Database optimization',
      impact: 'Medium',
      effort: 'Medium',
      annualSavings: '£42K',
    },
    {
      opportunity: 'Reserved instance coverage',
      impact: 'Low',
      effort: 'High',
      annualSavings: '£36K',
    },
  ] satisfies OptimizationOpportunity[],
  totalPotentialAnnualSavings: '£412K',
  riskCompliance: [
    { finding: 'IAM Over-privileged Roles', severity: 'High', count: 12 },
    { finding: 'Publicly Exposed Resources', severity: 'High', count: 8 },
    { finding: 'Unencrypted Resources', severity: 'Medium', count: 19 },
    { finding: 'Missing Cost Tags', severity: 'Medium', count: 37 },
    { finding: 'Outdated Dependencies', severity: 'Low', count: 24 },
  ] satisfies RiskFinding[],
  totalRiskFindings: 100,
  cloudSpendByProvider: [
    { provider: 'AWS', spend: '£1.48M', pct: 59.7 },
    { provider: 'Azure', spend: '£712K', pct: 28.7 },
    { provider: 'GCP', spend: '£228K', pct: 9.2 },
    { provider: 'Other', spend: '£56K', pct: 2.4 },
  ] satisfies ProviderSpend[],
  recentAnomalies: [
    {
      service: 'Payment API - High Data Transfer',
      spend: '£12.4K',
      deltaPct: 215,
      time: '10:15 AM',
    },
    { service: 'Inventory Service - CPU Spike', spend: '£8.7K', deltaPct: 156, time: '09:48 AM' },
    { service: 'Reports DB - Storage Growth', spend: '£6.2K', deltaPct: 132, time: '09:20 AM' },
    { service: 'Search Service - Unusual Traffic', spend: '£5.1K', deltaPct: 98, time: '08:55 AM' },
    { service: 'Auth Service - Error Surge', spend: '£3.8K', deltaPct: 87, time: '08:32 AM' },
  ] satisfies CostAnomaly[],
};
