/**
 * Client-side replacement for the original app's single catch-all API route
 * (app/api/[...slug]/route.ts). Every page in this console still calls
 * `api(path)` / `post(path, body)` exactly as the original did — only here
 * `path` is resolved against the in-browser store (lib/anti-piracy/store.ts)
 * instead of `fetch('/api/' + path)`, so no server or network round-trip is
 * involved. The GET/POST branches below are a direct port of that route's
 * logic, kept in the same shape so the mapping stays easy to audit.
 */
import { getState, getUser, run, resetStore } from "./store";
import { can } from "./rbac";
import { CaseWorkflowService, verifyEvidenceHash, accessEvidence } from "./workflow";
import { computeOverview, kpiDrilldown, searchAll, type KpiKey } from "./analytics";
import { filterCases, parseCaseFilter } from "./case-filters";
import {
  generateAdditionalFindings,
  runFullStory,
  seedDemoScenario,
  simulatePlatformResponses,
  startDiscoveryJob,
  uploadDatasetCsv,
} from "./demo";
import { MockAIService } from "./ai";
import { buildNoticeDocument } from "./notice-templates";
import { buildReport } from "./metrics";
import { llmProbeDataset } from "./llm-probe";
import type { AppState, FourGates, SessionUser } from "./types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function notFound(message = "Not found"): never {
  throw new ApiError(message, 404);
}

function handleGet(path: string, searchParams: URLSearchParams): unknown {
  if (path === "health") return { ok: true, env: "prototype" };

  const user = getUser();
  const state = getState();
  const q = searchParams.get("q") ?? "";
  const id = searchParams.get("id");
  const tab = searchParams.get("tab");
  const view = searchParams.get("view");

  if (path === "me") return { user, tenant: state.tenant, demoMode: state.configuration.demoMode };
  if (path === "overview") return computeOverview(state);
  if (path === "search") return searchAll(state, q);

  if (path === "notifications") {
    const items = state.notifications.filter((n) => n.audience === "all" || n.audience.includes(user.role));
    return { items };
  }

  if (path === "findings") {
    let rows = state.findings.filter((f) => f.tenantId === user.tenantId);
    const seen = new Set<string>();
    rows = rows.filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
    if (tab === "new") rows = rows.filter((f) => f.status === "new");
    if (tab === "ai_flagged") rows = rows.filter((f) => f.status === "ai_flagged");
    if (tab === "priority") rows = rows.filter((f) => f.priority === "critical");
    if (tab === "needs_validation") rows = rows.filter((f) => f.status === "needs_validation");
    if (tab === "promoted") rows = rows.filter((f) => f.status === "promoted");
    if (tab === "rejected") rows = rows.filter((f) => f.status === "rejected");
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = 25;
    const start = (page - 1) * pageSize;
    return {
      total: rows.length,
      newCount: state.findings.filter((f) => f.status === "new").length,
      items: rows.slice(start, start + pageSize),
    };
  }

  if (path === "finding" && id) {
    const finding = state.findings.find((f) => f.id === id);
    if (!finding) notFound();
    const asset = state.catalogue.find((a) => a.id === finding.assetId);
    const related = state.findings.filter((f) => f.relatedFindingIds.includes(id) || finding.relatedFindingIds.includes(f.id));
    const ai = state.aiAssessments.find((a) => a.subjectId === id) ?? MockAIService.classifyFinding(finding);
    const similarity = MockAIService.calculateSimilarity({
      title: finding.suspectedTitle,
      isbn: String(finding.metadata.isbnDetected ?? asset?.isbn ?? ""),
      ocr: finding.ocrSimilarity,
      visual: Math.max(70, finding.matchScore - 3),
      metadata: Math.min(99, finding.matchScore + 2),
      watermark: finding.watermarkDetected,
    });
    const evidence = state.evidence.filter((e) => e.findingId === id);
    const entity = state.entities.find((e) => e.id === finding.entityId);
    return { finding, asset, related, ai, similarity, evidence, entity };
  }

  if (path === "investigations") {
    return {
      items: state.investigations.map((inv) => ({
        ...inv,
        finding: state.findings.find((f) => f.id === inv.findingId),
        case: state.cases.find((c) => c.id === inv.caseId),
      })),
    };
  }

  if (path === "cases") {
    const rows = filterCases(state, parseCaseFilter(searchParams), user.tenantId);
    return { items: rows, total: state.cases.filter((c) => c.tenantId === user.tenantId).length, view: view ?? "table" };
  }

  if (path === "kpi-detail") {
    const kpi = searchParams.get("kpi") as KpiKey | null;
    const KPIS: KpiKey[] = ["activeCases", "criticalHigh", "takedownRate", "avgRemovalDays", "slaBreachRate", "reappearanceRate", "closedLoop", "priorityTitleExposure", "estimatedExposureCr"];
    if (!kpi || !KPIS.includes(kpi)) throw new ApiError("Unknown KPI", 400);
    return kpiDrilldown(state, kpi);
  }

  if (path === "case" && id) {
    const rec = state.cases.find((c) => c.id === id);
    if (!rec) notFound();
    return {
      case: rec,
      finding: state.findings.find((f) => f.id === rec.findingId),
      investigation: state.investigations.find((i) => i.id === rec.investigationId),
      asset: state.catalogue.find((a) => a.id === rec.assetId),
      evidence: state.evidence.filter((e) => rec.evidenceIds.includes(e.id) || e.caseId === rec.id),
      custody: state.custodyEvents.filter((e) => rec.evidenceIds.includes(e.evidenceId) || e.evidenceId.startsWith("EV-")),
      rights: state.rightsValidations.filter((r) => r.caseId === rec.id),
      legal: state.legalReviews.find((l) => l.caseId === rec.id),
      notices: state.notices.filter((n) => n.caseId === rec.id),
      submissions: state.submissions.filter((s) => s.caseId === rec.id),
      responses: state.platformResponses.filter((p) => p.caseId === rec.id),
      monitoring: state.monitoringJobs.find((m) => m.caseId === rec.id),
      reappearances: state.reappearances.filter((r) => r.originalCaseId === rec.id),
      transitions: state.transitions.filter((t) => t.caseId === rec.id),
      entity: state.entities.find((e) => e.id === rec.entityId),
      ai: MockAIService.classifyFinding(state.findings.find((f) => f.id === rec.findingId) ?? {}),
      route: MockAIService.recommendNoticeRoute(rec.platform),
      owner: state.users.find((u) => u.id === rec.ownerId),
      escalation: state.escalations.find((e) => e.caseId === rec.id),
      users: state.users.filter((u) => u.tenantId === rec.tenantId).map((u) => ({ id: u.id, name: u.name })),
    };
  }

  if (path === "evidence") {
    return { items: state.evidence.filter((e) => e.tenantId === user.tenantId) };
  }

  if (path === "evidence-item" && id) {
    const ev = state.evidence.find((e) => e.id === id);
    if (!ev) notFound();
    run((s) => accessEvidence(s, id, user));
    const fresh = getState();
    return {
      evidence: fresh.evidence.find((e) => e.id === id) ?? ev,
      custody: fresh.custodyEvents.filter((c) => c.evidenceId === id),
      case: fresh.cases.find((c) => c.id === ev.caseId),
    };
  }

  if (path === "legal") {
    const LEGAL_STAGES = ["rights_validation", "legal_review", "legal_approved", "approved_hold", "notice_ready"];
    const items = state.cases
      .filter((c) => c.tenantId === user.tenantId && LEGAL_STAGES.includes(c.status))
      .map((c) => {
        const rights = state.rightsValidations.find((r) => r.caseId === c.id);
        const gatesPassed = rights ? Object.values(rights.gates).filter((g) => g === "pass").length : 0;
        return {
          id: c.id,
          title: c.title,
          platform: c.platform,
          risk: c.risk,
          status: c.status,
          slaState: c.slaState,
          daysOpen: c.daysOpen,
          gatesPassed,
          gatesHeld: rights ? Object.values(rights.gates).filter((g) => g === "hold").length : 0,
          legalStatus: state.legalReviews.find((l) => l.caseId === c.id)?.status ?? null,
          recommendedRoute: MockAIService.recommendNoticeRoute(c.platform).route,
          noticeId: c.noticeId,
        };
      });
    const count = (s: string) => items.filter((i) => i.status === s).length;
    return {
      counts: {
        rightsValidation: count("rights_validation"),
        legalReview: count("legal_review"),
        onHold: count("approved_hold"),
        readyForNotice: count("legal_approved") + count("notice_ready"),
      },
      items,
    };
  }

  if (path === "notices") {
    const items = state.notices
      .filter((n) => n.tenantId === user.tenantId)
      .map((n) => {
        const c = state.cases.find((x) => x.id === n.caseId);
        return {
          id: n.id,
          caseId: n.caseId,
          title: c?.title ?? n.caseId,
          platform: c?.platform ?? "",
          uploader: c?.uploader ?? "",
          caseStatus: c?.status ?? "",
          route: n.route,
          status: n.status,
          generatedAt: n.generatedAt,
          approvedAt: n.approvedAt,
        };
      })
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    return { items };
  }

  if (path === "notice-document" && id) {
    const notice = state.notices.find((n) => n.id === id && n.tenantId === user.tenantId);
    if (!notice) throw new ApiError("Notice not found", 404);
    return buildNoticeDocument(state, notice);
  }

  if (path === "enforcement") {
    return {
      items: state.cases
        .filter((c) => ["notice_ready", "submitted", "awaiting_response", "removed", "escalated", "monitoring"].includes(c.status))
        .map((c) => ({
          ...c,
          submission: state.submissions.find((s) => s.id === c.submissionId),
          notice: state.notices.find((n) => n.id === c.noticeId),
        })),
    };
  }

  if (path === "radar") {
    return {
      kpis: {
        monitored: state.monitoringJobs.filter((m) => m.status === "active").length,
        totalMonitored: state.monitoringJobs.length,
        reappearances: state.reappearances.length,
        repeatOffenders: state.entities.filter((e) => e.labels.includes("REPEAT OFFENDER")).length,
        avgTime: 4.2,
        rate: computeOverview(state).kpis.reappearanceRate,
        closedLoop: computeOverview(state).kpis.closedLoopRecoveryRate,
      },
      items: state.reappearances,
      monitoring: state.monitoringJobs,
      entities: state.entities,
      cases: state.cases.filter((c) => c.status === "monitoring" || c.reappearance),
    };
  }

  if (path === "catalogue") {
    if (id) {
      const asset = state.catalogue.find((a) => a.id === id);
      if (!asset) notFound();
      return {
        asset,
        relatedCases: state.cases.filter((c) => c.assetId === id),
        findings: state.findings.filter((f) => f.assetId === id).slice(0, 20),
      };
    }
    return { items: state.catalogue };
  }

  if (path === "entities") {
    if (id) {
      const entity = state.entities.find((e) => e.id === id);
      if (!entity) notFound();
      return {
        entity,
        relationships: state.entityRelationships.filter((r) => r.fromEntityId === id || r.toEntityId === id),
        cases: state.cases.filter((c) => c.entityId === id),
        nodes: state.entities,
      };
    }
    return { items: state.entities, relationships: state.entityRelationships };
  }

  if (path === "analytics") {
    return {
      overview: computeOverview(state),
      forecast: MockAIService.forecastExposure(),
      financial: state.financialEstimates,
      ai: state.configuration.ai,
    };
  }

  if (path === "reports") {
    return {
      types: [
        "Executive Anti-Piracy Report",
        "Weekly Enforcement Report",
        "Investigator Productivity Report",
        "Platform Effectiveness Report",
        "Priority Title Exposure Report",
        "Reappearance Report",
        "Legal Action Report",
        "Financial Exposure Report",
        "AI Governance Report",
        "Audit Report",
        "LLM Exposure Report",
      ],
    };
  }

  if (path === "report") {
    const type = searchParams.get("type") ?? "Executive Anti-Piracy Report";
    return { tenant: state.tenant, ...buildReport(type, state) };
  }

  if (path === "llm-probing") {
    const data = llmProbeDataset();
    const findingId = searchParams.get("id");
    if (findingId) {
      const finding = data.findings.find((f) => f.id === findingId);
      if (!finding) notFound();
      return { finding, campaign: data.campaign };
    }
    return data;
  }

  if (path === "configuration") {
    return { configuration: state.configuration, users: state.users.map(({ passwordHash: _p, ...u }) => u) };
  }

  if (path === "admin") {
    if (!can(user.role, "admin.users") && !can(user.role, "demo.controls")) throw new ApiError("Forbidden", 403);
    return {
      connectors: state.connectors,
      jobs: state.jobs.slice(0, 20),
      users: state.users.map(({ passwordHash: _p, ...u }) => u),
      configuration: state.configuration,
      health: {
        queueDepth: state.jobs.filter((j) => j.status === "queued").length,
        failed: state.jobs.filter((j) => j.status === "failed").length,
        avgMs: 612,
        storageGb: 2.4,
        aiCalls: state.aiAssessments.length,
      },
    };
  }

  if (path === "audit") {
    if (!can(user.role, "audit.view") && user.role !== "legal" && user.role !== "lead") {
      return { items: state.auditEvents.filter((a) => a.userId === user.id).slice(0, 100) };
    }
    return { items: state.auditEvents.slice(0, 200) };
  }

  if (path === "jobs") return { items: state.jobs };

  notFound();
}

function dispatchAction(state: AppState, user: SessionUser, path: string, body: Record<string, unknown>): unknown {
  const id = String(body.id ?? body.caseId ?? body.findingId ?? "");
  void id;

  switch (path) {
    case "findings/validate":
      return CaseWorkflowService.validateFinding(state, String(body.findingId), user, body.decision === "rejected" ? "rejected" : "validated");
    case "findings/promote":
      return CaseWorkflowService.createCaseFromFinding(state, String(body.findingId), user);
    case "investigations/note":
      return CaseWorkflowService.addInvestigationNote(state, String(body.investigationId), String(body.note), user);
    case "cases/confirm":
      return CaseWorkflowService.confirmInfringement(state, String(body.caseId), user, (body.outcome as "confirmed" | "insufficient_evidence" | "false_positive") ?? "confirmed");
    case "cases/rights":
      return CaseWorkflowService.approveRights(state, String(body.caseId), user, body.gates as FourGates | undefined);
    case "cases/legal":
      return CaseWorkflowService.approveLegal(state, String(body.caseId), user);
    case "cases/notice":
      return CaseWorkflowService.generateNotice(state, String(body.caseId), user, body.route as never);
    case "notices/update":
      return CaseWorkflowService.updateNotice(state, String(body.noticeId), body.patch as never, user);
    case "notices/approve":
      return CaseWorkflowService.approveNotice(state, String(body.noticeId), user);
    case "enforcement/submit":
      return CaseWorkflowService.submitNotice(state, String(body.caseId), user);
    case "enforcement/response":
      return CaseWorkflowService.recordResponse(state, String(body.caseId), user, (body.outcome as "removed") ?? "removed");
    case "cases/monitor":
      return CaseWorkflowService.startMonitoring(state, String(body.caseId), user);
    case "cases/reopen":
      return CaseWorkflowService.reopenCase(state, String(body.caseId), user, body.findingId ? String(body.findingId) : undefined);
    case "cases/close":
      return CaseWorkflowService.closeCase(state, String(body.caseId), user, String(body.reason ?? "Closed"));
    case "cases/escalate":
      return CaseWorkflowService.escalate(state, String(body.caseId), user, String(body.reason ?? "SLA breached"));
    case "cases/assign":
      return CaseWorkflowService.assignCase(state, String(body.caseId), String(body.ownerId), user);
    case "radar/simulate":
      return CaseWorkflowService.simulateReappearance(state, String(body.caseId ?? "SC-2026-0842"), user);
    case "radar/confirm":
      return CaseWorkflowService.confirmReappearance(state, String(body.reappearanceId), user);
    case "evidence/verify":
      return verifyEvidenceHash(state, String(body.evidenceId), user);
    case "discovery/run":
      return startDiscoveryJob(state, user);
    case "discovery/upload":
      return uploadDatasetCsv(state, user, String(body.filename ?? ""), String(body.content ?? ""));
    case "demo/reset":
      if (!can(user.role, "demo.controls")) throw new ApiError("Forbidden: demo.controls", 403);
      resetStore();
      return { ok: true, reset: true };
    case "demo/seed":
      if (!can(user.role, "demo.controls")) throw new ApiError("Forbidden: demo.controls", 403);
      seedDemoScenario(state);
      return { ok: true };
    case "demo/findings":
      return generateAdditionalFindings(state, user);
    case "demo/responses":
      return simulatePlatformResponses(state, user);
    case "demo/story":
      return runFullStory(state, user);
    case "configuration/update":
      if (!can(user.role, "config.edit")) throw new ApiError("Forbidden: config.edit", 403);
      Object.assign(state.configuration, (body.patch as object) ?? {});
      state.auditEvents.unshift({
        id: `AUD-CFG-${Date.now()}`,
        tenantId: user.tenantId,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: "CONFIG_CHANGED",
        entity: "Configuration",
        entityId: user.tenantId,
        before: null,
        after: body.patch,
        ip: "127.0.0.1",
        sessionId: `sess-${user.id}`,
      });
      return { configuration: state.configuration };
    case "notifications/read":
      state.notifications.forEach((n) => {
        if (!id || n.id === id) n.read = true;
      });
      return { ok: true };
    default:
      throw new ApiError("Unknown action");
  }
}

function parsePath(path: string): { base: string; searchParams: URLSearchParams } {
  const [base, qs] = path.split("?");
  return { base, searchParams: new URLSearchParams(qs ?? "") };
}

export async function api<T>(path: string): Promise<T> {
  try {
    const { base, searchParams } = parsePath(path);
    return handleGet(base, searchParams) as T;
  } catch (e) {
    throw new Error(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Request failed");
  }
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const { base } = parsePath(path);
  try {
    const result = run((state, user) => dispatchAction(state, user, base, (body ?? {}) as Record<string, unknown>));
    return result as T;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Error");
  }
}
