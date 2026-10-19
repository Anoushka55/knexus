"use client";

import { useState } from "react";
import { ShieldCheck, Sparkles, FileText } from "lucide-react";
import { useSession } from "@/lib/enterprise-architecture/session";
import { arbEvaluate, arbIngest, arbSignoff } from "@/lib/enterprise-architecture/client";
import { Card, Pill, StatTile, Spinner, EmptyState } from "@/components/enterprise-architecture/primitives";

const FLAGGED_ACTIONS = new Set(["Retire", "Replace", "Refactor", "Rehost", "Replatform"]);

export default function ArbPage() {
  const { timeResult, eaContext, arbResult, setArbResult, arbSignoff: signoffState, setArbSignoff } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractText, setExtractText] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Signoff form
  const [architectName, setArchitectName] = useState("");
  const [architectDecision, setArchitectDecision] = useState("accept");
  const [architectNotes, setArchitectNotes] = useState("");
  const [cioName, setCioName] = useState("");
  const [cioDecision, setCioDecision] = useState("");
  const [cioNotes, setCioNotes] = useState("");
  const [signoffBusy, setSignoffBusy] = useState(false);

  const flagged = timeResult?.applications.filter((a) => FLAGGED_ACTIONS.has(a.rationalization_action ?? "")) ?? [];

  async function runEvaluation() {
    if (!timeResult) return;
    setBusy(true);
    setError(null);
    try {
      const result = await arbEvaluate({
        applications: timeResult.applications,
        ea_context: eaContext as unknown as Record<string, unknown>,
        rationalization_summary: timeResult.portfolio_summary as unknown as Record<string, unknown>,
      });
      setArbResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function extractFromText() {
    if (!extractText.trim()) return;
    setExtracting(true);
    setError(null);
    try {
      const proposal = await arbIngest({ free_text: extractText });
      // Run ARB directly against the extracted free-form proposal.
      setBusy(true);
      const result = await arbEvaluate({
        applications: timeResult?.applications ?? [],
        proposal_title: proposal.proposal_title ?? undefined,
        business_case: proposal.business_case ?? undefined,
      });
      setArbResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExtracting(false);
      setBusy(false);
    }
  }

  async function submitSignoff() {
    if (!arbResult) return;
    setSignoffBusy(true);
    setError(null);
    try {
      const result = await arbSignoff({
        arb_decision: arbResult,
        architect_name: architectName,
        architect_decision: architectDecision,
        architect_notes: architectNotes,
        cio_name: cioName,
        cio_decision: cioDecision,
        cio_notes: cioNotes,
      });
      setArbSignoff(result.signoff);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSignoffBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Step 2 — ARB Governance</h1>
        <p className="text-sm text-muted-foreground">
          Architecture Review Board — evaluates the rationalization proposal against enterprise standards,
          detects anti-patterns, and returns an explainable decision.
        </p>
      </div>

      {!timeResult && (
        <Card>
          <EmptyState
            icon={<ShieldCheck className="w-10 h-10" />}
            title="Run EA Analysis first"
            body="ARB auto-builds its proposal from the applications flagged for action in Step 1."
          />
        </Card>
      )}

      {timeResult && (
        <Card
          title="Rationalization Proposal"
          subtitle={`${flagged.length} of ${timeResult.applications.length} applications flagged for action`}
          action={
            <button
              onClick={runEvaluation}
              disabled={busy}
              className="inline-flex items-center gap-2 h-8 px-3 bg-navy text-white rounded-ea-sm text-xs disabled:opacity-50"
            >
              {busy ? <Spinner /> : <Sparkles className="w-3.5 h-3.5" />} Run ARB Evaluation
            </button>
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {flagged.slice(0, 12).map((a) => (
              <Pill key={a.id} tone="amber">
                {a.name}
              </Pill>
            ))}
            {flagged.length > 12 && <Pill tone="muted">+{flagged.length - 12} more</Pill>}
            {!flagged.length && <span className="text-xs text-muted-foreground">No applications flagged — ARB will evaluate a status-quo proposal.</span>}
          </div>

          <div className="mt-4">
            <span className="block mb-1 text-xs text-muted-foreground">
              Or extract a proposal from pasted text (e.g. an RFC / architecture memo)
            </span>
            <textarea
              value={extractText}
              onChange={(e) => setExtractText(e.target.value)}
              rows={3}
              placeholder="Paste an architecture proposal description…"
              className="w-full border border-border rounded-ea-sm p-2.5 text-sm bg-background"
            />
            <button
              onClick={extractFromText}
              disabled={extracting || busy || !extractText.trim()}
              className="mt-2 inline-flex items-center gap-2 h-8 px-3 border border-border rounded-ea-sm text-xs hover:border-navy disabled:opacity-50"
            >
              {extracting ? <Spinner /> : <FileText className="w-3.5 h-3.5" />} Extract &amp; Evaluate
            </button>
          </div>
          {error && <div className="mt-3 text-xs text-crimson">{error}</div>}
        </Card>
      )}

      {arbResult && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              label="Decision"
              value={arbResult.decision}
              tone={arbResult.decision === "APPROVED" ? "success" : arbResult.decision === "REJECTED" ? "crimson" : "amber"}
            />
            <StatTile label="Confidence" value={`${arbResult.confidence_score}/100`} />
            <StatTile label="Compliance" value={`${arbResult.compliance_score}/100`} />
            <StatTile label="Integration complexity" value={arbResult.integration_complexity} />
          </div>

          <Card title="Reasoning">
            <p className="text-sm leading-relaxed">{arbResult.reasoning}</p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Risks &amp; Anti-Patterns">
              <ListBlock items={arbResult.risks} empty="No material risks identified." tone="crimson" />
              {arbResult.anti_patterns_detected?.length > 0 && (
                <>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-3 mb-1">Anti-patterns</h4>
                  <ListBlock items={arbResult.anti_patterns_detected} tone="amber" />
                </>
              )}
              {arbResult.redundancy_flags?.length > 0 && (
                <>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-3 mb-1">Redundancy flags</h4>
                  <ListBlock items={arbResult.redundancy_flags} tone="amber" />
                </>
              )}
            </Card>
            <Card title="Recommendations &amp; Conditions">
              <ListBlock items={arbResult.recommendations} empty="No recommendations." tone="blue" />
              {arbResult.conditions?.length > 0 && (
                <>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-3 mb-1">Conditions</h4>
                  <ListBlock items={arbResult.conditions} tone="amber" />
                </>
              )}
            </Card>
          </div>

          <Card title="Human Sign-off" subtitle="Architect + CIO review (audit trail)">
            {signoffState ? (
              <div className="text-sm">
                <Pill tone={signoffState.effective_decision === "APPROVED" ? "success" : signoffState.effective_decision === "REJECTED" ? "crimson" : "amber"}>
                  Effective decision: {signoffState.effective_decision}
                </Pill>
                <p className="text-xs text-muted-foreground mt-2">
                  Architect: {signoffState.architect.name || "—"} ({signoffState.architect.decision}).{" "}
                  {signoffState.cio && `CIO: ${signoffState.cio.name} (${signoffState.cio.decision}).`} Signed{" "}
                  {new Date(signoffState.signed_at).toLocaleString()}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Architect Review</h4>
                  <input
                    value={architectName}
                    onChange={(e) => setArchitectName(e.target.value)}
                    placeholder="Architect name"
                    className="w-full h-9 border border-border rounded-ea-sm px-2 text-sm bg-background"
                  />
                  <select
                    value={architectDecision}
                    onChange={(e) => setArchitectDecision(e.target.value)}
                    className="w-full h-9 border border-border rounded-ea-sm px-2 text-sm bg-background"
                  >
                    <option value="accept">Accept AI decision</option>
                    <option value="override_approved">Override — Approve</option>
                    <option value="override_conditional">Override — Conditional</option>
                    <option value="override_rejected">Override — Reject</option>
                  </select>
                  <textarea
                    value={architectNotes}
                    onChange={(e) => setArchitectNotes(e.target.value)}
                    rows={2}
                    placeholder="Review notes…"
                    className="w-full border border-border rounded-ea-sm p-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">CIO Sign-off (optional)</h4>
                  <input
                    value={cioName}
                    onChange={(e) => setCioName(e.target.value)}
                    placeholder="CIO name"
                    className="w-full h-9 border border-border rounded-ea-sm px-2 text-sm bg-background"
                  />
                  <select
                    value={cioDecision}
                    onChange={(e) => setCioDecision(e.target.value)}
                    className="w-full h-9 border border-border rounded-ea-sm px-2 text-sm bg-background"
                  >
                    <option value="">No CIO decision</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="more_info">Needs more info</option>
                  </select>
                  <textarea
                    value={cioNotes}
                    onChange={(e) => setCioNotes(e.target.value)}
                    rows={2}
                    placeholder="Sign-off notes…"
                    className="w-full border border-border rounded-ea-sm p-2 text-sm bg-background"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={submitSignoff}
                    disabled={signoffBusy}
                    className="inline-flex items-center gap-2 h-9 px-3.5 bg-navy text-white rounded-ea-sm text-sm disabled:opacity-50"
                  >
                    {signoffBusy ? <Spinner /> : <ShieldCheck className="w-4 h-4" />} Submit Sign-off
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function ListBlock({ items, empty, tone }: { items?: string[]; empty?: string; tone: "crimson" | "amber" | "blue" }) {
  if (!items || !items.length) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs">
          <Pill tone={tone}>{i + 1}</Pill>
          <span className="text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}
