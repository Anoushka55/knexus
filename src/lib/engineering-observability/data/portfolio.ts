export type PortfolioCriticality = 'Business Critical' | 'Important' | 'At Risk';
export type PortfolioHealth = 'Healthy' | 'At Risk' | 'Needs Attention';
export type BusinessValue = 'High' | 'Medium' | 'Low';

export interface PortfolioApp {
  app: string;
  domain: string;
  criticality: PortfolioCriticality;
  health: PortfolioHealth;
  techStack: string;
  age: string;
  owners: string[];
}

export interface DistributionSlice {
  label: string;
  count?: number;
  pct: number;
  color: string;
}

export interface AgeBucket {
  bucket: string;
  count: number;
}

export interface ModernizationItem {
  initiative: string;
  app: string;
  target: string;
  businessValue: BusinessValue;
  timeline: string;
  /** lucide-react icon name */
  icon: string;
}

export interface RedundancyItem {
  app: string;
  type: string;
  impact: BusinessValue;
  annualCost: string;
}

export interface RetirementCandidate {
  app: string;
  reason: string;
  risk: BusinessValue;
  annualSavings: string;
}

export const portfolio = {
  kpis: {
    totalApplications: 212,
    totalDelta: 6,
    businessCritical: 48,
    businessCriticalPct: 22.6,
    businessCriticalDelta: 2,
    healthy: 128,
    healthyPct: 60.4,
    healthyDelta: 8,
    atRisk: 24,
    atRiskPct: 11.3,
    atRiskDelta: -1,
    redundant: 12,
    redundantPct: 5.7,
    redundantDelta: 2,
    retirementCandidates: 28,
    retirementDelta: 5,
  },
  applicationPortfolio: [
    {
      app: 'Online Checkout',
      domain: 'Digital Sales',
      criticality: 'Business Critical',
      health: 'Healthy',
      techStack: 'Java, Spring Boot, Oracle',
      age: '7 yrs',
      owners: ['RK', 'SP', '+3'],
    },
    {
      app: 'Payment Service',
      domain: 'Payments',
      criticality: 'Business Critical',
      health: 'At Risk',
      techStack: 'Java, Spring, PostgreSQL',
      age: '8 yrs',
      owners: ['AC', 'VM', '+2'],
    },
    {
      app: 'Inventory Service',
      domain: 'Fulfillment',
      criticality: 'Business Critical',
      health: 'Healthy',
      techStack: 'Go, gRPC, PostgreSQL',
      age: '4 yrs',
      owners: ['SG', 'AK', '+2'],
    },
    {
      app: 'Customer Profile',
      domain: 'Customer',
      criticality: 'Important',
      health: 'Healthy',
      techStack: '.NET, SQL Server',
      age: '9 yrs',
      owners: ['RM', 'DS', '+3'],
    },
    {
      app: 'Search Service',
      domain: 'Digital Experience',
      criticality: 'Important',
      health: 'At Risk',
      techStack: 'Java, Elasticsearch',
      age: '6 yrs',
      owners: ['NP', 'RT', '+2'],
    },
    {
      app: 'Legacy Order Management',
      domain: 'Fulfillment',
      criticality: 'At Risk',
      health: 'At Risk',
      techStack: 'WebLogic, Oracle, PL/SQL',
      age: '15 yrs',
      owners: ['PB', 'SS', '+1'],
    },
    {
      app: 'Reports & Analytics',
      domain: 'Data & Analytics',
      criticality: 'Important',
      health: 'Healthy',
      techStack: 'Python, Airflow, Snowflake',
      age: '5 yrs',
      owners: ['VS', 'AP', '+3'],
    },
    {
      app: 'Customer Support Portal',
      domain: 'Customer Service',
      criticality: 'Important',
      health: 'Healthy',
      techStack: 'React, Node.js, MongoDB',
      age: '3 yrs',
      owners: ['JM', 'PK', '+2'],
    },
  ] satisfies PortfolioApp[],
  healthDistribution: [
    { label: 'Healthy', count: 128, pct: 60.4, color: '#16A34A' },
    { label: 'At Risk', count: 24, pct: 11.3, color: '#EA580C' },
    { label: 'Needs Attention', count: 32, pct: 15.1, color: '#F59E0B' },
    { label: 'Redundant', count: 12, pct: 5.7, color: '#8B5CF6' },
    { label: 'Retirement Pending', count: 16, pct: 7.5, color: '#94A3B8' },
  ] satisfies DistributionSlice[],
  techStackDistribution: [
    { label: 'Java', pct: 35.4, color: '#1E40AF' },
    { label: '.NET', pct: 18.9, color: '#7C3AED' },
    { label: 'Python', pct: 15.6, color: '#F59E0B' },
    { label: 'JavaScript/Node', pct: 12.3, color: '#EAB308' },
    { label: 'Go', pct: 7.5, color: '#0D9488' },
    { label: 'Other', pct: 10.3, color: '#94A3B8' },
  ] satisfies DistributionSlice[],
  applicationAgeProfile: [
    { bucket: '0-2', count: 32 },
    { bucket: '3-5', count: 48 },
    { bucket: '6-10', count: 67 },
    { bucket: '11-15', count: 38 },
    { bucket: '16+', count: 27 },
  ] satisfies AgeBucket[],
  portfolioRiskExposure: {
    highRiskApplications: 24,
    technicalDebtScore: '7.2 / 10',
    slaAtRisk: 14,
    complianceGaps: 5,
  },
  modernizationRoadmap: [
    {
      initiative: 'Cloud Migration',
      app: 'Legacy Order Mgmt',
      target: 'AWS (Microservices)',
      businessValue: 'High',
      timeline: 'Q2 2025',
      icon: 'Cloud',
    },
    {
      initiative: 'Re-platform',
      app: 'Payment Service',
      target: 'Kubernetes + RDS',
      businessValue: 'High',
      timeline: 'Q3 2025',
      icon: 'Boxes',
    },
    {
      initiative: 'Refactor',
      app: 'Search Service',
      target: 'Go + OpenSearch',
      businessValue: 'Medium',
      timeline: 'Q3 2025',
      icon: 'Code',
    },
    {
      initiative: 'Re-architect',
      app: 'Customer Profile',
      target: 'Microservices',
      businessValue: 'High',
      timeline: 'Q4 2025',
      icon: 'Network',
    },
  ] satisfies ModernizationItem[],
  redundancyAnalysis: [
    {
      app: 'Reports & Analytics',
      type: 'Functional Overlap',
      impact: 'Medium',
      annualCost: '£86K',
    },
    { app: 'Legacy Reports', type: 'Functional Overlap', impact: 'High', annualCost: '£64K' },
    {
      app: 'Old Search Service',
      type: 'Technical Duplication',
      impact: 'Medium',
      annualCost: '£42K',
    },
    { app: 'Batch Data Export', type: 'Process Duplication', impact: 'Low', annualCost: '£28K' },
  ] satisfies RedundancyItem[],
  retirementCandidates: [
    { app: 'Legacy CRM', reason: 'Outdated / Replaced', risk: 'Low', annualSavings: '£120K' },
    { app: 'Old Admin Portal', reason: 'Low Usage', risk: 'Low', annualSavings: '£48K' },
    { app: 'File Transfer Service', reason: 'Replaced by SFTP', risk: 'Low', annualSavings: '£36K' },
    { app: 'Legacy Batch Jobs', reason: 'Business Sunset', risk: 'Medium', annualSavings: '£28K' },
  ] satisfies RetirementCandidate[],
  bottomBar: {
    totalAnnualRunCost: '£2.48M',
    totalRunCostDeltaPct: -5.6,
    potentialAnnualSavings: '£412K',
    savingsDeltaPct: 18.2,
    technicalDebtScore: '7.2 / 10',
    techDebtDelta: 0.4,
    modernizationProgressPct: 35,
    modernizationDeltaPct: 6,
    cloudAdoptionPct: 62,
    cloudAdoptionDeltaPct: 8,
    automationCoveragePct: 48,
    automationCoverageDeltaPct: 5,
  },
};
