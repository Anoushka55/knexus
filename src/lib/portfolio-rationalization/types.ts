/**
 * Shared types for the Portfolio Rationalization agent, ported from the
 * standalone "Tech Rationalization AI Agent" FastAPI app (app.py / api/index.py).
 */

export type RationalizationAction =
  | "Retain"
  | "Rehost"
  | "Replatform"
  | "Refactor"
  | "Replace"
  | "Retire"
  | "TBD";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type Criticality = "Critical" | "High" | "Medium" | "Low";

export type Deployment = "Cloud" | "On-Prem" | "Hybrid";

export interface ToolScores {
  business_value: number;
  adoption_rate: number;
  integration_depth: number;
  vendor_support: number;
  cost_efficiency: number;
  technical_health: number;
  risk_score: number;
}

export interface Tool {
  id: string;
  name: string;
  vendor?: string | null;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  owner?: string | null;
  business_unit?: string | null;
  annual_cost?: number | null;
  user_count?: number | null;
  license_type?: string | null;
  deployment?: string | null;
  criticality?: string | null;
  integrations?: number | null;
  age_years?: number | null;
  end_of_life?: boolean;
  compliance_required?: boolean;
  pain_points?: string | null;
  rationalization_action?: RationalizationAction;

  // Added after scoring
  scores?: ToolScores;
  composite_score?: number;
  confidence_level?: ConfidenceLevel;
}

export interface Duplication {
  id: string;
  category: string;
  tool_a: string;
  tool_b: string;
  overlap_percentage: number;
  retain_candidate?: string;
  consolidate_candidate?: string;
  potential_annual_savings: number;
  priority: "High" | "Medium" | "Low";
  rationale: string;
}

export interface IngestSummary {
  total_tools: number;
  total_annual_cost: number;
  duplications_found: number;
  potential_savings: number;
}

export interface IngestResult {
  tools: Tool[];
  duplications: Duplication[];
  pain_points: string[];
  detected_budget: number | null;
  summary: IngestSummary;
  errors?: string[];
}

export interface TopRecommendation {
  rank: number;
  title: string;
  description: string;
  impact: string;
  effort: "Low" | "Medium" | "High";
  priority: "Critical" | "High" | "Medium";
  confidence: ConfidenceLevel;
  timeline: string;
}

export interface ToolAnalysisFact {
  label: string;
  value: string;
}

export interface ToolAnalysis {
  tool_name: string;
  overview: string;
  facts: ToolAnalysisFact[];
  strengths: string[];
  challenges: string[];
  gaps: string[];
  cost_analysis: string;
  benchmarking: string;
  recommendation: RationalizationAction;
}

export interface ConsolidationOpportunity {
  tools: string[];
  category: string;
  overlap_pct: number;
  recommended_action: string;
  estimated_savings: number;
  rationale: string;
}

export interface RiskHighlight {
  risk_type: "Security" | "Compliance" | "Vendor" | "Obsolescence" | "Operational" | string;
  severity: "Critical" | "High" | "Medium" | string;
  affected_tools: string[];
  description: string;
  mitigation: string;
}

export interface ExecutiveSummary {
  tool_ecosystem: string;
  overlapping_tools: string;
  benchmarking: string;
  kpis_success_factors: string;
  recommendations: string;
  rollout_roadmap: string;
}

export interface ThreePillars {
  as_is_assessment: string;
  governance_framework: string;
  tools_standardization: string;
}

export interface BeforeAfterState {
  tool_count?: number;
  annual_cost?: number;
  duplicate_pairs?: number;
  eol_tools?: number;
  risk_level?: string;
  key_issues?: string[];
  projected_tool_count?: number;
  projected_annual_cost?: number;
  estimated_annual_savings?: number;
  eol_tools_resolved?: number;
  improvements?: string[];
}

export interface BeforeAfterComparison {
  current_state: BeforeAfterState;
  future_state: BeforeAfterState;
}

export interface Roadmap {
  short_term?: string[];
  medium_term?: string[];
  long_term?: string[];
}

export interface ExpectedOutcomes {
  cost_savings_annual?: number;
  risk_reduction?: string;
  tool_reduction?: string;
  strategic_gains?: string;
}

export interface Assessment {
  executive_summary?: ExecutiveSummary | string;
  three_pillars?: ThreePillars;
  portfolio_overview?: {
    total_tools: number;
    total_annual_cost: number;
    portfolio_health: "Healthy" | "At Risk" | "Critical";
    health_rationale: string;
  };
  before_after_comparison?: BeforeAfterComparison;
  portfolio_pain_areas?: string[];
  rationalization_summary?: Record<string, number>;
  duplicate_tools?: {
    tool_a: string;
    tool_b: string;
    category: string;
    overlap_reason: string;
    recommendation: string;
  }[];
  top_recommendations?: TopRecommendation[];
  tool_analysis?: ToolAnalysis[];
  consolidation_opportunities?: ConsolidationOpportunity[];
  risk_highlights?: RiskHighlight[];
  roadmap?: Roadmap;
  expected_outcomes?: ExpectedOutcomes;
}

export interface OrgPhaseData {
  organisation: string;
  industry: string;
  size: string;
  businessUnits: string;
  geography: string;
}

export interface BusinessPhaseData {
  compliance: string[];
  priorities: string[];
  focus: string;
  challenges: string;
}

export interface TechnicalPhaseData {
  cloudStrategy: string;
  provider: string;
  timeline: string;
  slaRequirement: string;
  painPoints: string;
}

export interface FinancialPhaseData {
  budget: string;
  savingsTarget: string;
  priority: string;
  disruptionTolerance: string;
}

export interface WizardData {
  org: OrgPhaseData;
  business: BusinessPhaseData;
  technical: TechnicalPhaseData;
  financial: FinancialPhaseData;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const INDUSTRIES = [
  "telecom",
  "banking",
  "insurance",
  "retail",
  "healthcare",
  "manufacturing",
  "energy",
  "public sector",
  "technology",
  "other",
] as const;

export const RATIONALIZATION_ACTIONS: RationalizationAction[] = [
  "Retain",
  "Rehost",
  "Replatform",
  "Refactor",
  "Replace",
  "Retire",
];
