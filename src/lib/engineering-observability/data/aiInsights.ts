export type InsightSeverity = 'P1' | 'P2' | 'P3' | 'P4';
export type StepStatus = 'completed' | 'exploring' | 'pending';

export interface InvestigationStep {
  id: number;
  label: string;
  status: StepStatus;
}

export type TraversalNodeKind = 'entry' | 'service' | 'data' | 'issue';
export type TraversalEdgeStyle =
  | 'investigated'
  | 'depends'
  | 'calls'
  | 'uses'
  | 'related'
  | 'impacts';

export interface TraversalNode {
  id: string;
  label: string;
  kind: TraversalNodeKind;
}

export interface TraversalEdge {
  from: string;
  to: string;
  style: TraversalEdgeStyle;
}

export interface TraversalLegendItem {
  label: string;
  style:
    | 'solid-blue'
    | 'solid-purple'
    | 'solid-teal'
    | 'dashed-slate'
    | 'dashed-orange'
    | 'dashed-purple';
}

export interface KeyInsight {
  severity: InsightSeverity | null;
  title: string;
  text: string;
  /** lucide-react icon name */
  icon: string;
}

export interface EvidenceRow {
  source: string;
  evidence: string;
  relevancePct: number;
  time: string;
}

export interface RootCauseStep {
  rank: number;
  severity: InsightSeverity;
  title: string;
  text: string;
}

export interface RecommendedAction {
  rank: number;
  title: string;
  priority: InsightSeverity;
  status: 'Approval required' | 'Auto-executable';
}

export interface MatchingAgent {
  name: string;
  matchPct: number;
  tone: 'compact' | 'featured';
  capabilities?: string[];
  reason?: string;
  owner?: string;
}

export const aiInsights = {
  kpis: {
    insightsGenerated: 24,
    insightsGeneratedDelta: 33,
    issuesPrevented: 7,
    issuesPreventedDelta: 40,
    mttrImprovementPct: 32,
    mttrImprovementDelta: 12,
    automationOpportunities: 18,
    automationDelta: 22,
    potentialImpact: '£142K',
    potentialImpactDelta: -18,
  },
  copilotQuestion: 'Why is the checkout payment failure rate high?',
  suggestedQuestions: [
    'Why is the payment failure rate high?',
    'What are the top error contributors?',
    'Which services are at risk?',
    'Why is MTTR increasing?',
  ],
  investigationSteps: [
    { id: 1, label: 'Understanding', status: 'completed' },
    { id: 2, label: 'Graph Traversal', status: 'exploring' },
    { id: 3, label: 'Correlating Signals', status: 'pending' },
    { id: 4, label: 'Root Cause', status: 'pending' },
    { id: 5, label: 'Recommendations', status: 'pending' },
  ] satisfies InvestigationStep[],
  traversalGraph: {
    nodes: [
      { id: 'checkout', label: 'Online Checkout', kind: 'entry' },
      { id: 'payment', label: 'Payment Service', kind: 'service' },
      { id: 'payments-db', label: 'Payments DB', kind: 'data' },
      { id: 'payment-api', label: 'Payment API', kind: 'service' },
      { id: 'auth', label: 'Auth Service', kind: 'service' },
      { id: 'db-pool', label: 'DB Connection Pool', kind: 'issue' },
      { id: 'net-lat', label: 'Network Latency', kind: 'issue' },
      { id: 'high-cpu', label: 'High CPU', kind: 'issue' },
      { id: 'conn-sat', label: 'Connection Saturation', kind: 'issue' },
    ] satisfies TraversalNode[],
    edges: [
      { from: 'checkout', to: 'payment', style: 'investigated' },
      { from: 'payment', to: 'payments-db', style: 'depends' },
      { from: 'payment', to: 'payment-api', style: 'calls' },
      { from: 'payment', to: 'auth', style: 'uses' },
      { from: 'payments-db', to: 'db-pool', style: 'related' },
      { from: 'payment-api', to: 'net-lat', style: 'impacts' },
      { from: 'payment-api', to: 'high-cpu', style: 'impacts' },
      { from: 'auth', to: 'conn-sat', style: 'related' },
    ] satisfies TraversalEdge[],
    legend: [
      { label: 'Depends On', style: 'solid-blue' },
      { label: 'Calls', style: 'solid-purple' },
      { label: 'Uses', style: 'solid-teal' },
      { label: 'Related To', style: 'dashed-slate' },
      { label: 'Impacts', style: 'dashed-orange' },
      { label: 'Investigated Path', style: 'dashed-purple' },
    ] satisfies TraversalLegendItem[],
  },
  keyInsights: [
    {
      severity: 'P1',
      title: 'Primary Issue Identified',
      text: 'Database connection pool saturation in Payments DB causing high checkout payment failures.',
      icon: 'ShieldAlert',
    },
    {
      severity: 'P2',
      title: 'Contributing Factor',
      text: 'Unoptimized connection settings in payment-service v4.8.2 leading to connection leaks.',
      icon: 'AlertTriangle',
    },
    {
      severity: null,
      title: 'Impact',
      text: '~12.8K transactions impacted with £184K revenue exposure in the last 24 hours.',
      icon: 'ShoppingCart',
    },
    {
      severity: null,
      title: 'Similar Incidents',
      text: '3 similar incidents in the last 30 days related to connection pool exhaustion.',
      icon: 'History',
    },
  ] satisfies KeyInsight[],
  evidence: [
    { source: 'APM', evidence: 'High DB connection wait time', relevancePct: 95, time: '10:18 AM' },
    {
      source: 'Logs',
      evidence: 'HikariPool - Connection timeout',
      relevancePct: 92,
      time: '10:17 AM',
    },
    {
      source: 'Metrics',
      evidence: 'Active connections near max limit',
      relevancePct: 90,
      time: '10:16 AM',
    },
    {
      source: 'Traces',
      evidence: 'Slow queries on payment_transactions',
      relevancePct: 85,
      time: '10:15 AM',
    },
    {
      source: 'Alerts',
      evidence: 'DB connection pool above 90%',
      relevancePct: 85,
      time: '10:14 AM',
    },
  ] satisfies EvidenceRow[],
  rootCause: {
    confidencePct: 87,
    steps: [
      {
        rank: 1,
        severity: 'P1',
        title: 'Primary Root Cause',
        text: 'Database connection pool saturation in Payments DB',
      },
      {
        rank: 2,
        severity: 'P2',
        title: 'Contributing Factor',
        text: 'Connection leaks in payment-service v4.8.2',
      },
      {
        rank: 3,
        severity: 'P3',
        title: 'Trigger',
        text: 'Traffic spike at 09:45 AM exceeded connection limit',
      },
      {
        rank: 4,
        severity: 'P3',
        title: 'Systemic Issue',
        text: 'Missing connection pool monitoring and auto-scaling',
      },
    ] satisfies RootCauseStep[],
  },
  businessImpact: {
    transactionsImpacted: '~12.8K',
    period: '24h',
    revenueExposure: '£184K',
    customerImpact: 'High',
    customerImpactDetail: 'Multiple journeys',
    slaImpact: '98.0%',
    slaDelta: -2.0,
    mttr: '42m',
    mttrDelta: -8,
  },
  recommendedActions: [
    {
      rank: 1,
      title: 'Increase DB connection pool size',
      priority: 'P1',
      status: 'Approval required',
    },
    {
      rank: 2,
      title: 'Fix connection leak in payment-service v4.8.2',
      priority: 'P1',
      status: 'Approval required',
    },
    {
      rank: 3,
      title: 'Enable auto-scaling for Payments DB',
      priority: 'P2',
      status: 'Approval required',
    },
    {
      rank: 4,
      title: 'Add connection pool monitoring & alerts',
      priority: 'P2',
      status: 'Auto-executable',
    },
  ] satisfies RecommendedAction[],
  matchingAgents: [
    { name: 'DB Optimization Agent', matchPct: 92, tone: 'compact' },
    { name: 'SRE Remediation Agent', matchPct: 88, tone: 'compact' },
    { name: 'Capacity Planning Agent', matchPct: 85, tone: 'compact' },
    {
      name: 'Payment Incident Investigator',
      matchPct: 94,
      tone: 'featured',
      capabilities: [
        'Payment API Diagnostics',
        'Log & Trace Analysis',
        'Dependency Analysis',
        'Incident Investigation',
      ],
      reason: 'Resolved 14 similar incidents in the last 60 days',
      owner: 'Payments CoE',
    },
    {
      name: 'Cloud Database Optimization Agent',
      matchPct: 82,
      tone: 'featured',
      capabilities: [
        'DB Performance Analysis',
        'Connection Pool Analysis',
        'Capacity Optimization',
        'Query Performance',
      ],
      reason: 'Detected DB saturation in 7 similar incidents',
      owner: 'Cloud CoE',
    },
  ] satisfies MatchingAgent[],
};
