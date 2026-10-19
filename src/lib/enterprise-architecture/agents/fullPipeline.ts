import "server-only";
/**
 * Port of agents/full_pipeline.py: TIME → MAPPING → COMPLIANCE → MATURITY →
 * INSIGHTS, each stage receiving the accumulated outputs of prior stages.
 */
import { runTime, type RunTimeInput } from "./time";
import { runMappingBatch } from "./mapping";
import { runCompliance } from "./compliance";
import { runMaturity } from "./maturity";
import { runInsights } from "./insights";
import type {
  ArbResult,
  AssessmentResultsPayload,
  ComplianceResult,
  MappingResult,
  PipelineResult,
  TimeResult,
} from "../types";

interface UnifiedContext {
  industry: string;
  sub_sector: string;
  governance: string;
  ea_framework: string;
  ea_tools: string;
  cloud_strategy: string;
  additional_context: string;
  known_integrations: string;
  planned_changes: string;
  data_sensitivity: string;
  integration_complexity: string;
  cmdb_tool: string;
  mapping_notes: string;
  arb_governance?: string;
}

export interface RunFullPipelineInput extends RunTimeInput {
  ea_context?: Record<string, unknown>;
  mapping_context?: Record<string, unknown>;
  arb_result?: ArbResult | null;
  regulations?: string[];
  compliance_result?: ComplianceResult | null;
  assessment_results?: AssessmentResultsPayload | null;
}

export async function runFullPipeline(input: RunFullPipelineInput): Promise<PipelineResult> {
  const pipeline: Partial<PipelineResult> = {};
  const errors: Record<string, string> = {};

  const eaCtx = input.ea_context ?? {};
  const industry = input.industry || (eaCtx.industry as string) || "";
  const subSector = input.sub_sector || (eaCtx.sub_sector as string) || "";
  const governance = (eaCtx.governance as string) || "";
  const eaFramework = (eaCtx.ea_framework as string) || "";
  const eaTools = (eaCtx.ea_tools as string) || "";
  const cloudStrategy = (eaCtx.cloud_strategy as string) || "";
  const additionalCtx = (eaCtx.additional_context as string) || "";

  const mapCtx = input.mapping_context ?? {};
  const knownIntegrations = (mapCtx.known_integrations as string) || "";
  const plannedChanges = (mapCtx.planned_changes as string) || "";
  const cloudTarget = (mapCtx.cloud_target as string) || "";
  const dataSensitivity = (mapCtx.data_sensitivity as string) || "";
  const integrationComplexity = (mapCtx.integration_complexity as string) || "";
  const cmdbTool = (mapCtx.cmdb_tool as string) || "";
  const mapNotes = (mapCtx.additional_notes as string) || "";

  const unified: UnifiedContext = {
    industry,
    sub_sector: subSector,
    governance,
    ea_framework: eaFramework,
    ea_tools: eaTools,
    cloud_strategy: cloudStrategy || cloudTarget,
    additional_context: additionalCtx,
    known_integrations: knownIntegrations,
    planned_changes: plannedChanges,
    data_sensitivity: dataSensitivity,
    integration_complexity: integrationComplexity,
    cmdb_tool: cmdbTool,
    mapping_notes: mapNotes,
  };

  // STAGE 1 — TIME
  let timeResult: TimeResult = { applications: [], portfolio_summary: { total_apps: 0, total_annual_cost: 0, action_breakdown: {}, duplications_found: 0, potential_savings: 0 }, duplications: [], assessment: {} };
  try {
    timeResult = await runTime({ ...input, industry, sub_sector: subSector });
    pipeline.TIME = timeResult;
  } catch (e) {
    errors.TIME = e instanceof Error ? e.message : String(e);
  }

  const applications = pipeline.TIME?.applications ?? [];
  const duplications = pipeline.TIME?.duplications ?? [];
  const timeSummary = pipeline.TIME?.portfolio_summary;
  const timeAssessment = pipeline.TIME?.assessment ?? {};

  // ARB (pre-computed by the wizard before this pipeline call)
  const arbResult = input.arb_result ?? null;
  if (arbResult) {
    const arbSummary = `ARB Decision: ${arbResult.decision || "NOT_RUN"}. Compliance score: ${arbResult.compliance_score || 0}. Conditions: ${(arbResult.conditions || []).slice(0, 3).join("; ") || "None"}. Key risks: ${(arbResult.risks || []).slice(0, 3).join("; ") || "None"}.`;
    unified.arb_governance = arbSummary;
    unified.additional_context = additionalCtx ? `${additionalCtx}\n${arbSummary}` : arbSummary;
  }

  // STAGE 2 — MAPPING (flagged apps only)
  const flagged = applications.filter((a) => ["Retire", "Replace", "Refactor", "Rehost", "Replatform"].includes(a.rationalization_action ?? ""));
  if (flagged.length) {
    try {
      pipeline.MAPPING = await runMappingBatch({
        applications: flagged,
        all_apps: applications,
        industry,
        sub_sector: subSector,
        governance,
        ea_framework: eaFramework,
        cloud_target: unified.cloud_strategy,
        known_integrations: knownIntegrations,
        planned_changes: plannedChanges,
        data_sensitivity: dataSensitivity,
        integration_complexity: integrationComplexity,
        cmdb_tool: cmdbTool,
        additional_context: `${additionalCtx}\n${mapNotes}`.trim(),
      });
    } catch (e) {
      errors.MAPPING = e instanceof Error ? e.message : String(e);
      pipeline.MAPPING = { skipped: false, reason: errors.MAPPING } as MappingResult;
    }
  } else {
    pipeline.MAPPING = { skipped: true, reason: "No applications flagged for action (Retire/Replace/Refactor) — no dependency risk to analyse." };
  }

  // STAGE 2.5 — COMPLIANCE
  const regulations = input.regulations ?? [];
  let complianceResult: ComplianceResult = input.compliance_result ?? { skipped: true, reason: "No regulations selected." };
  if (input.compliance_result && !input.compliance_result.skipped) {
    complianceResult = input.compliance_result;
  } else if (regulations.length) {
    try {
      complianceResult = await runCompliance({
        applications,
        regulations,
        industry,
        sub_sector: subSector,
        mapping_output: pipeline.MAPPING,
        governance,
        additional_context: additionalCtx,
      });
    } catch (e) {
      errors.COMPLIANCE = e instanceof Error ? e.message : String(e);
      complianceResult = { skipped: true, reason: `Compliance check failed: ${errors.COMPLIANCE}` };
    }
  }
  pipeline.COMPLIANCE = complianceResult;
  const compScore = !complianceResult.skipped ? complianceResult.overall_compliance_score ?? null : null;
  const compGaps = !complianceResult.skipped ? (complianceResult.critical_gaps?.length ?? 0) : 0;

  // STAGE 3 — MATURITY
  const assessmentResults = input.assessment_results ?? null;
  try {
    const avgScore = applications.length ? applications.reduce((s, a) => s + (a.composite_score ?? 5), 0) / applications.length : 5;
    const categories = Array.from(new Set(applications.map((a) => a.category || "Other")));
    const breakdown = timeSummary?.action_breakdown ?? {};
    const eliminatePct = applications.length
      ? Math.round(((breakdown.Retire ?? 0) + (breakdown.Replace ?? 0)) / applications.length * 100)
      : 0;

    pipeline.MATURITY = await runMaturity({
      industry,
      sub_sector: subSector,
      governance,
      ea_framework: eaFramework,
      ea_tools: eaTools,
      cloud_strategy: unified.cloud_strategy,
      additional_context: additionalCtx,
      known_integrations: knownIntegrations,
      cmdb_tool: cmdbTool,
      portfolio_size: applications.length,
      avg_composite_score: Math.round(avgScore * 100) / 100,
      categories_covered: categories,
      eliminate_percentage: eliminatePct,
      duplications_found: duplications.length,
      total_annual_cost: timeSummary?.total_annual_cost ?? 0,
      action_breakdown: breakdown,
      has_cmdb_data: !!cmdbTool || applications.some((a) => a.integrations !== null && a.integrations !== undefined),
      has_cost_data: applications.some((a) => a.annual_cost !== null && a.annual_cost !== undefined),
      portfolio_health: timeAssessment.portfolio_overview?.portfolio_health ?? "Unknown",
      mapping_complexity: pipeline.MAPPING?.overall_impact_level ?? "UNKNOWN",
      compliance_score: compScore,
      compliance_gaps_count: compGaps,
      assessment_results: assessmentResults,
    });
  } catch (e) {
    errors.MATURITY = e instanceof Error ? e.message : String(e);
  }

  // STAGE 4 — INSIGHTS
  try {
    pipeline.INSIGHTS = await runInsights({
      pipeline: "full_ea_intelligence",
      industry,
      sub_sector: subSector,
      governance,
      ea_framework: eaFramework,
      additional_context: additionalCtx,
      cloud_strategy: unified.cloud_strategy,
      time_output: {
        portfolio_summary: timeSummary,
        assessment: timeAssessment,
        duplications_count: duplications.length,
        top_recommendations: (timeAssessment.top_recommendations ?? []).slice(0, 5),
        expected_outcomes: timeAssessment.expected_outcomes ?? {},
      },
      mapping_output: pipeline.MAPPING,
      compliance_output: !complianceResult.skipped
        ? {
            overall_compliance_score: compScore,
            regulations_checked: complianceResult.regulations_checked ?? [],
            critical_gaps: (complianceResult.critical_gaps ?? []).slice(0, 5),
            top_risks: (complianceResult.top_risks ?? []).slice(0, 5),
            regulation_summary: complianceResult.regulation_summary ?? {},
            remediation_roadmap: (complianceResult.remediation_roadmap ?? []).slice(0, 5),
          }
        : {},
      arb_output: arbResult
        ? {
            decision: arbResult.decision,
            compliance_score: arbResult.compliance_score,
            conditions: (arbResult.conditions ?? []).slice(0, 5),
            risks: (arbResult.risks ?? []).slice(0, 5),
            recommendations: (arbResult.recommendations ?? []).slice(0, 5),
            integration_complexity: arbResult.integration_complexity,
          }
        : {},
      maturity_output: {
        overall_score: pipeline.MATURITY?.overall_maturity_score,
        maturity_level: pipeline.MATURITY?.maturity_level,
        top_priorities: pipeline.MATURITY?.top_priorities ?? [],
        dimensions: pipeline.MATURITY?.dimensions ?? {},
      },
    });
  } catch (e) {
    errors.INSIGHTS = e instanceof Error ? e.message : String(e);
  }

  pipeline.pipeline_summary = {
    industry: industry || "General",
    sub_sector: subSector,
    governance,
    ea_framework: eaFramework,
    cloud_strategy: unified.cloud_strategy,
    stages_completed: (["TIME", "MAPPING", "COMPLIANCE", "MATURITY", "INSIGHTS"] as const).filter((s) => !errors[s]),
    stages_failed: Object.keys(errors),
    errors,
    total_apps_assessed: applications.length,
    flagged_for_action: flagged.length,
    compliance_score: compScore,
    maturity_score: pipeline.MATURITY?.overall_maturity_score ?? null,
    overall_risk: pipeline.INSIGHTS?.risk_profile?.overall_risk ?? null,
    potential_savings: timeSummary?.potential_savings ?? 0,
    total_annual_cost: timeSummary?.total_annual_cost ?? 0,
  };

  return pipeline as PipelineResult;
}

export interface RunPipelineFromStep3Input {
  time_result: TimeResult;
  mapping_result?: MappingResult | null;
  assessment_results?: AssessmentResultsPayload | null;
  arb_result?: ArbResult | null;
  compliance_result?: ComplianceResult | null;
  industry?: string;
  sub_sector?: string;
  governance?: string;
  ea_framework?: string;
  ea_tools?: string;
  cloud_strategy?: string;
  additional_context?: string;
}

/** Wizard step-by-step: run MATURITY + INSIGHTS using pre-computed TIME + MAPPING + ARB. */
export async function runPipelineFromStep3(input: RunPipelineFromStep3Input): Promise<PipelineResult> {
  const pipeline: Partial<PipelineResult> = {};
  const errors: Record<string, string> = {};

  const timeResult = input.time_result;
  const mappingResult = input.mapping_result ?? null;
  const assessmentResults = input.assessment_results ?? null;
  const arbResult = input.arb_result ?? null;

  const industry = input.industry || "";
  const subSector = input.sub_sector || "";
  const governance = input.governance || "";
  const eaFramework = input.ea_framework || "";
  const eaTools = input.ea_tools || "";
  const cloudStrategy = input.cloud_strategy || "";
  let additionalCtx = input.additional_context || "";

  if (arbResult) {
    const arbCtx = `ARB Governance Decision: ${arbResult.decision || "NOT_RUN"}. Confidence: ${arbResult.confidence_score || 0}/100. Compliance: ${arbResult.compliance_score || 0}/100. Integration complexity: ${arbResult.integration_complexity || ""}. Key conditions: ${(arbResult.conditions ?? []).slice(0, 3).join("; ")}. Key risks: ${(arbResult.risks ?? []).slice(0, 3).join("; ")}.`;
    additionalCtx = `${additionalCtx}\n${arbCtx}`.trim();
  }

  pipeline.ARB = arbResult ?? undefined;
  pipeline.TIME = timeResult;
  pipeline.MAPPING = mappingResult ?? { skipped: true, reason: "Pre-computed in wizard step 2" };

  const applications = timeResult.applications ?? [];
  const duplications = timeResult.duplications ?? [];
  const timeSummary = timeResult.portfolio_summary;
  const timeAssessment = timeResult.assessment ?? {};

  const complianceResult = input.compliance_result ?? { skipped: true, reason: "Compliance check skipped." };
  pipeline.COMPLIANCE = complianceResult;
  const compScore = !complianceResult.skipped ? complianceResult.overall_compliance_score ?? null : null;
  const compGaps = !complianceResult.skipped ? (complianceResult.critical_gaps?.length ?? 0) : 0;

  // STAGE 3 — MATURITY
  try {
    const avgScore = applications.length ? applications.reduce((s, a) => s + (a.composite_score ?? 5), 0) / applications.length : 5;
    const categories = Array.from(new Set(applications.map((a) => a.category || "Other")));
    const breakdown = timeSummary?.action_breakdown ?? {};
    const eliminatePct = applications.length
      ? Math.round(((breakdown.Retire ?? 0) + (breakdown.Replace ?? 0)) / applications.length * 100)
      : 0;

    pipeline.MATURITY = await runMaturity({
      industry,
      sub_sector: subSector,
      governance,
      ea_framework: eaFramework,
      ea_tools: eaTools,
      cloud_strategy: cloudStrategy,
      additional_context: additionalCtx,
      portfolio_size: applications.length,
      avg_composite_score: Math.round(avgScore * 100) / 100,
      categories_covered: categories,
      eliminate_percentage: eliminatePct,
      duplications_found: duplications.length,
      total_annual_cost: timeSummary?.total_annual_cost ?? 0,
      action_breakdown: breakdown,
      has_cmdb_data: applications.some((a) => a.integrations !== null && a.integrations !== undefined),
      has_cost_data: applications.some((a) => a.annual_cost !== null && a.annual_cost !== undefined),
      portfolio_health: timeAssessment.portfolio_overview?.portfolio_health ?? "Unknown",
      mapping_complexity: (mappingResult && !mappingResult.skipped ? mappingResult.overall_impact_level : "UNKNOWN") ?? "UNKNOWN",
      compliance_score: compScore,
      compliance_gaps_count: compGaps,
      assessment_results: assessmentResults,
    });
  } catch (e) {
    errors.MATURITY = e instanceof Error ? e.message : String(e);
  }

  // STAGE 4 — INSIGHTS
  try {
    pipeline.INSIGHTS = await runInsights({
      pipeline: "full_ea_intelligence",
      industry,
      sub_sector: subSector,
      governance,
      ea_framework: eaFramework,
      additional_context: additionalCtx,
      cloud_strategy: cloudStrategy,
      time_output: {
        portfolio_summary: timeSummary,
        assessment: timeAssessment,
        duplications_count: duplications.length,
        top_recommendations: (timeAssessment.top_recommendations ?? []).slice(0, 5),
        expected_outcomes: timeAssessment.expected_outcomes ?? {},
      },
      mapping_output: pipeline.MAPPING,
      compliance_output: !complianceResult.skipped
        ? {
            overall_compliance_score: compScore,
            regulations_checked: complianceResult.regulations_checked ?? [],
            critical_gaps: (complianceResult.critical_gaps ?? []).slice(0, 5),
            top_risks: (complianceResult.top_risks ?? []).slice(0, 5),
            regulation_summary: complianceResult.regulation_summary ?? {},
            remediation_roadmap: (complianceResult.remediation_roadmap ?? []).slice(0, 5),
          }
        : {},
      arb_output: arbResult
        ? {
            decision: arbResult.decision || "NOT_RUN",
            confidence_score: arbResult.confidence_score || 0,
            compliance_score: arbResult.compliance_score || 0,
            conditions: (arbResult.conditions ?? []).slice(0, 5),
            risks: (arbResult.risks ?? []).slice(0, 5),
            recommendations: (arbResult.recommendations ?? []).slice(0, 5),
            integration_complexity: arbResult.integration_complexity,
          }
        : {},
      maturity_output: {
        overall_score: pipeline.MATURITY?.overall_maturity_score,
        overall_band: pipeline.MATURITY?.overall_band ?? "",
        maturity_level: pipeline.MATURITY?.maturity_level ?? "",
        top_priorities: pipeline.MATURITY?.top_priorities ?? [],
        dimensions: pipeline.MATURITY?.dimensions ?? {},
        pillar_scores: pipeline.MATURITY?.pillar_scores ?? {},
      },
    });
  } catch (e) {
    errors.INSIGHTS = e instanceof Error ? e.message : String(e);
  }

  const flagged = applications.filter((a) => a.time_classification === "Migrate" || a.time_classification === "Eliminate");
  pipeline.pipeline_summary = {
    industry: industry || "General",
    sub_sector: subSector,
    governance,
    ea_framework: eaFramework,
    cloud_strategy: cloudStrategy,
    stages_completed: (["TIME", "MAPPING", "COMPLIANCE", "MATURITY", "INSIGHTS"] as const).filter((s) => !errors[s]),
    stages_failed: Object.keys(errors),
    errors,
    total_apps_assessed: applications.length,
    flagged_for_action: flagged.length,
    compliance_score: compScore,
    maturity_score: pipeline.MATURITY?.overall_maturity_score ?? null,
    overall_risk: pipeline.INSIGHTS?.risk_profile?.overall_risk ?? null,
    potential_savings: timeSummary?.potential_savings ?? 0,
    total_annual_cost: timeSummary?.total_annual_cost ?? 0,
  };

  return pipeline as PipelineResult;
}
