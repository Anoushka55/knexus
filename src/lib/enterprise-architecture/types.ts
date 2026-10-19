/**
 * Shared types for the Enterprise Architecture Intelligence agent.
 * Mirrors models/schemas.py and the ad-hoc result shapes produced by
 * agents/*.py in the source ea-ai-agent FastAPI app.
 */

export type RationalizationAction =
  | "Retain"
  | "Rehost"
  | "Replatform"
  | "Refactor"
  | "Replace"
  | "Retire";

export type TimeClassification = "Invest" | "Tolerate" | "Migrate" | "Eliminate";

export type Criticality = "Critical" | "High" | "Medium" | "Low" | null;

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface ToolScores {
  business_value: number;
  adoption_rate: number;
  integration_depth: number;
  vendor_support: number;
  cost_efficiency: number;
  technical_health: number;
  risk_score: number;
}

/** A single application/tool record, before or after scoring. */
export interface Application {
  id: string;
  name: string;
  category: string;
  vendor?: string | null;
  criticality?: Criticality;
  annual_cost?: number | null;
  user_count?: number | null;
  deployment?: string | null;
  integrations?: number | null;
  age_years?: number | null;
  end_of_life: boolean;
  compliance_required: boolean;
  business_unit?: string | null;
  subcategory?: string | null;
  // Fields attached by scoring
  scores?: ToolScores;
  composite_score?: number;
  rationalization_action?: RationalizationAction;
  time_classification?: TimeClassification;
  confidence_level?: ConfidenceLevel;
  [key: string]: unknown;
}

export interface Duplication {
  id: string;
  category: string;
  tool_a: string;
  tool_b: string;
  overlap_percentage: number;
  retain_candidate?: string;
  consolidate_candidate?: string;
  rationale: string;
  potential_annual_savings: number;
  priority: "High" | "Medium" | "Low";
}

export interface PortfolioSummary {
  total_apps: number;
  total_annual_cost: number;
  action_breakdown: Record<string, number>;
  duplications_found: number;
  potential_savings: number;
}

export interface TimeAssessment {
  executive_summary?: string;
  portfolio_overview?: {
    total_tools?: number;
    total_annual_cost?: number;
    portfolio_health?: "Healthy" | "At Risk" | "Critical" | string;
    health_rationale?: string;
  };
  top_recommendations?: Array<{
    rank?: number;
    title?: string;
    description?: string;
    impact?: string;
    effort?: "Low" | "Medium" | "High" | string;
    priority?: "Critical" | "High" | "Medium" | string;
    confidence?: "High" | "Medium" | "Low" | string;
    timeline?: string;
  }>;
  roadmap?: {
    short_term?: string[];
    medium_term?: string[];
    long_term?: string[];
  };
  expected_outcomes?: {
    cost_savings_annual?: number;
    risk_reduction?: string;
    tool_reduction?: string;
    operational_simplification?: string;
    strategic_gains?: string;
  };
  raw_response?: string;
  parse_error?: boolean | string;
  [key: string]: unknown;
}

export interface TimeResult {
  applications: Application[];
  portfolio_summary: PortfolioSummary;
  duplications: Duplication[];
  assessment: TimeAssessment;
}

export interface ArbResult {
  decision: "APPROVED" | "REJECTED" | "CONDITIONAL" | string;
  confidence_score: number;
  compliance_score: number;
  risks: string[];
  anti_patterns_detected: string[];
  redundancy_flags: string[];
  integration_complexity: "LOW" | "MEDIUM" | "HIGH" | string;
  recommendations: string[];
  conditions: string[];
  reasoning: string;
  proposal?: Record<string, unknown>;
  flagged_count?: number;
  total_apps?: number;
  raw_response?: string;
  parse_error?: boolean | string;
  [key: string]: unknown;
}

export interface ArbProposal {
  proposal_title?: string | null;
  description?: string | null;
  technology_stack?: string[] | null;
  timeline?: string | null;
  estimated_cost?: number | null;
  annual_running_cost?: number | null;
  business_case?: string | null;
  current_system?: string | null;
  integration_points?: string | null;
  security_compliance?: string | null;
  data_sensitivity?: string | null;
  alternatives_considered?: string | null;
  [key: string]: unknown;
}

export interface ArbSignoff {
  architect: { name: string; decision: string; notes: string };
  cio: { name: string; decision: string; notes: string } | null;
  effective_decision: string;
  ai_decision: string;
  signed_at: string;
}

export interface MappingAppAnalysis {
  app_name: string;
  rationalization_action?: string;
  integration_count?: number | null;
  known_dependencies?: string[];
  impact_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  affected_business_processes?: string[];
  coupling_score?: number | null;
  single_points_of_failure?: string[];
  removal_risk?: string;
  recommended_sequence?: string;
  migration_prerequisites?: string[];
  data_confidence?: "HIGH" | "MEDIUM" | "LOW" | string;
  data_gaps?: string[];
}

export interface MappingResult {
  skipped?: boolean;
  reason?: string;
  pipeline_context?: string;
  data_basis?: string;
  app_analyses?: MappingAppAnalysis[];
  overall_impact_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  recommended_migration_order?: string[];
  cross_app_risks?: string[];
  quick_wins?: string[];
  data_limitations?: string;
  raw_response?: string;
  parse_error?: boolean | string;
  [key: string]: unknown;
}

export interface ComplianceAppRow {
  app_name: string;
  applicable_regulations: string[];
  compliance_status: "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT" | "UNKNOWN" | string;
  gaps: string[];
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  remediation_actions: string[];
  data_classification: string;
  data_confidence: "HIGH" | "MEDIUM" | "LOW" | string;
}

export interface ComplianceResult {
  skipped?: boolean;
  reason?: string;
  regulations_checked?: string[];
  app_compliance_map?: ComplianceAppRow[];
  overall_compliance_score?: number;
  regulation_summary?: Record<
    string,
    { apps_affected: number; gaps_count: number; non_compliant_count: number; risk: string }
  >;
  critical_gaps?: string[];
  top_risks?: string[];
  remediation_roadmap?: string[];
  data_limitations?: string;
  raw_response?: string;
  parse_error?: boolean | string;
  [key: string]: unknown;
}

export type MaturityBand = "Low" | "Medium" | "High" | "N/A";

export interface MaturityDimension {
  score: number;
  band: MaturityBand | string;
  pillar?: string;
  positive_findings: string[];
  improvement_areas: string[];
}

export interface MaturityResult {
  overall_maturity_score?: number;
  overall_band?: MaturityBand | string;
  pillar_scores?: Record<string, number>;
  dimensions?: Record<string, MaturityDimension>;
  top_priorities?: string[];
  roadmap?: Array<{ phase: string; actions: string[] }>;
  maturity_level?: string;
  raw_response?: string;
  parse_error?: boolean | string;
  [key: string]: unknown;
}

export interface InsightsResult {
  executive_summary?: string;
  financial_impact?: {
    total_potential_savings?: string;
    investment_required?: string;
    roi_projection?: string;
    cost_breakdown?: Record<string, unknown>;
  };
  risk_profile?: {
    overall_risk?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
    top_risks?: Array<{ risk: string; impact: string; mitigation: string }>;
  };
  strategic_recommendations?: Array<{
    priority?: number;
    recommendation?: string;
    business_value?: string;
    effort?: "LOW" | "MEDIUM" | "HIGH" | string;
    timeline?: string;
  }>;
  maturity_insights?: {
    summary?: string;
    capability_gaps?: string[];
    dimension_priorities?: Array<{
      dimension: string;
      current_score: number;
      target_score: number;
      gap: number;
      action: string;
    }>;
    maturity_recommendations?: Array<{
      rank?: number;
      recommendation?: string;
      pillar?: string;
      timeline?: string;
      expected_impact?: string;
    }>;
    target_maturity_score?: number;
    estimated_improvement_timeline?: string;
  };
  quick_wins?: string[];
  kpis?: Array<{ metric: string; current: string; target: string; timeframe: string }>;
  raw_response?: string;
  parse_error?: boolean | string;
  [key: string]: unknown;
}

export interface EaContext {
  industry: string;
  sub_sector: string;
  governance: string;
  ea_framework: string;
  ea_tools: string;
  cloud_strategy: string;
  additional_context: string;
}

export interface MappingContext {
  known_integrations: string;
  planned_changes: string;
  cloud_target: string;
  data_sensitivity: string;
  integration_complexity: string;
  cmdb_tool: string;
  additional_notes: string;
}

export interface PipelineSummary {
  industry: string;
  sub_sector: string;
  governance: string;
  ea_framework: string;
  cloud_strategy: string;
  stages_completed: string[];
  stages_failed: string[];
  errors: Record<string, string>;
  total_apps_assessed: number;
  flagged_for_action: number;
  compliance_score?: number | null;
  maturity_score?: number | null;
  overall_risk?: string | null;
  potential_savings: number;
  total_annual_cost: number;
}

export interface PipelineResult {
  ARB?: ArbResult;
  TIME?: TimeResult;
  MAPPING?: MappingResult;
  COMPLIANCE?: ComplianceResult;
  MATURITY?: MaturityResult;
  INSIGHTS?: InsightsResult;
  pipeline_summary: PipelineSummary;
}

/** Saved snapshot of a full pipeline run, shown on the Reports page. */
export interface SavedReport {
  id: string;
  createdAt: string;
  title: string;
  pipeline: PipelineResult;
}

// ── EA Maturity questionnaire (ported from frontend/ea_assessment.html) ──

export type QuestionOptionKey = "A" | "B" | "C" | "D" | "E";

export interface MaturityQuestion {
  id: string;
  sectionId: string;
  text: string;
  options: Record<QuestionOptionKey, string>;
}

export interface MaturitySection {
  id: string;
  label: string;
  pillar: string;
  questionIds: string[];
}

export interface Respondent {
  name: string;
  answers: Record<string, QuestionOptionKey>;
  completedAt: string;
}

export interface AssessmentSession {
  id: string;
  createdAt: string;
  users: Respondent[];
}

export interface AssessmentResultsPayload {
  source: string;
  respondent_count: number;
  respondent_names: string[];
  overall_score: number | null;
  overall_band: MaturityBand;
  dimensions: Array<{ id: string; label: string; score: number | null; band: MaturityBand }>;
  majority_answers: Record<string, QuestionOptionKey | null>;
  session_id: string;
  completed_at: string;
}

// ── Chat / agent query ──

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type AgentName = "ARB" | "TIME" | "MAPPING" | "MATURITY" | "INSIGHTS";

export interface AgentQueryResponse {
  agent_used: string;
  result: Record<string, unknown>;
  agents_chain: string[];
}

export const INDUSTRIES = [
  "Financial Services",
  "Healthcare",
  "Retail & E-commerce",
  "Manufacturing",
  "Telecommunications",
  "Government & Public Sector",
  "Energy & Utilities",
  "Technology",
  "Professional Services",
  "Media & Entertainment",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
