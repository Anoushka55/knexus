"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/portfolio-rationalization/session";
import { ingestFiles, ingestText } from "@/lib/portfolio-rationalization/client";
import { SectionCard } from "../_components";

const STEPS = ["Organisation", "Tool Inventory", "Business Context", "Technical Context", "Financial Params", "Assess & Report"];

const COMPLIANCE_OPTIONS = ["GDPR", "TRAI", "PCI-DSS", "HIPAA", "SOC 2", "ISO 27001", "DORA", "SOX"];
const PRIORITY_OPTIONS = ["Cost Reduction", "Risk Mitigation", "Cloud Migration", "Security Hardening", "Vendor Consolidation", "Innovation Enablement"];

export default function IngestPage() {
  const router = useRouter();
  const { phase, setPhase, wizard, updateOrg, updateBusiness, updateTechnical, updateFinancial, tools, painPoints, ingestTools } = useSession();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-1 bg-white rounded-full border border-[var(--ptr-border)] p-1.5 overflow-x-auto">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === phase;
          const done = n < phase;
          return (
            <button
              key={label}
              onClick={() => setPhase(n)}
              className={`flex items-center gap-2 px-3 h-9 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                active ? "bg-[var(--ptr-navy)] text-white" : done ? "text-[var(--ptr-green)] hover:bg-[var(--ptr-background)]" : "text-[var(--ptr-muted)] hover:bg-[var(--ptr-background)]"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  active ? "bg-white text-[var(--ptr-navy)]" : done ? "bg-[var(--ptr-green)] text-white" : "bg-[var(--ptr-border)] text-[var(--ptr-muted)]"
                }`}
              >
                {done ? "✓" : n}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {phase === 1 && <OrgPhase />}
      {phase === 2 && <InventoryPhase />}
      {phase === 3 && <BusinessPhase />}
      {phase === 4 && <TechnicalPhase />}
      {phase === 5 && <FinancialPhase />}
      {phase === 6 && <SummaryPhase />}
    </div>
  );

  function OrgPhase() {
    const o = wizard.org;
    return (
      <SectionCard title="Phase 1 — Organisation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Organisation / Company Name">
            <input value={o.organisation} onChange={(e) => updateOrg({ organisation: e.target.value })} className="ptr-input" placeholder="e.g., Airtel, Tanla Platforms..." />
          </Field>
          <Field label="Industry">
            <select value={o.industry} onChange={(e) => updateOrg({ industry: e.target.value })} className="ptr-input">
              {["telecom", "banking", "insurance", "retail", "healthcare", "manufacturing", "energy", "public sector", "technology", "other"].map((i) => (
                <option key={i} value={i}>
                  {i[0].toUpperCase() + i.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Organisation Size">
            <select value={o.size} onChange={(e) => updateOrg({ size: e.target.value })} className="ptr-input">
              <option value="">Select size...</option>
              <option value="smb">SMB (&lt; 1,000 employees)</option>
              <option value="mid">Mid-Market (1,000 – 10,000)</option>
              <option value="enterprise">Enterprise (10,000 – 50,000)</option>
              <option value="global">Global Enterprise (50,000+)</option>
            </select>
          </Field>
          <Field label="Number of Business Units">
            <input type="number" min={1} max={200} value={o.businessUnits} onChange={(e) => updateOrg({ businessUnits: e.target.value })} className="ptr-input" placeholder="e.g., 8" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Primary Geography / Markets">
              <input value={o.geography} onChange={(e) => updateOrg({ geography: e.target.value })} className="ptr-input" placeholder="e.g., India, SEA, Africa, Europe..." />
            </Field>
          </div>
        </div>
        <WizardNav onNext={() => setPhase(2)} />
      </SectionCard>
    );
  }

  function InventoryPhase() {
    const [dragOver, setDragOver] = useState(false);
    const [pasteText, setPasteText] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [error, setError] = useState("");
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    async function runIngest(files: File[], text: string) {
      setStatus("loading");
      setError("");
      try {
        const result = files.length ? await ingestFiles(files) : await ingestText(text);
        ingestTools(result.tools, result.duplications, result.pain_points, result.detected_budget);
        setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    }

    function loadSample() {
      const sample = `Tool: Splunk Enterprise
Vendor: Splunk
Category: Logging
Annual Cost: 180000
Users: 150
Criticality: High
Deployment: On-Prem
Age Years: 9
Integrations: 12

Tool: Elastic Stack
Vendor: Elastic
Category: Logging
Annual Cost: 60000
Users: 90
Criticality: Medium
Deployment: Cloud
Age Years: 3
Integrations: 8

Tool: ServiceNow ITSM
Vendor: ServiceNow
Category: ITSM
Annual Cost: 420000
Users: 2500
Criticality: Critical
Deployment: Cloud
Age Years: 4
Integrations: 30

Tool: Legacy Billing Mainframe
Vendor: IBM
Category: BSS
Annual Cost: 950000
Users: 400
Criticality: Critical
Deployment: On-Prem
Age Years: 18
End of Life: true
Integrations: 22`;
      setPasteText(sample);
    }

    return (
      <SectionCard title="Phase 2 — Tool Inventory">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const fs = [...e.dataTransfer.files];
                if (fs.length) setPendingFiles(fs);
              }}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 h-36 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                dragOver ? "border-[var(--ptr-blue)] bg-blue-50" : "border-[var(--ptr-border)] bg-[var(--ptr-background)]"
              }`}
            >
              <UploadCloud className="w-7 h-7 text-[var(--ptr-muted)]" />
              <p className="text-xs text-[var(--ptr-muted)]">
                {pendingFiles.length ? `${pendingFiles.length} file(s) selected` : "Drop files here, or click to browse"}
              </p>
              <p className="text-[11px] text-[var(--ptr-muted)]">CSV, Excel, JSON, PDF, PPTX, JPG, PNG supported</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.json,.pdf,.pptx,.ppt,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setPendingFiles([...(e.target.files ?? [])])}
              />
            </div>
            <button
              disabled={!pendingFiles.length || status === "loading"}
              onClick={() => runIngest(pendingFiles, "")}
              className="mt-3 w-full h-10 rounded-md bg-[var(--ptr-green)] text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "⚡"} Ingest &amp; Score Files
            </button>
          </div>

          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={7}
              className="ptr-input resize-none font-mono text-xs"
              placeholder={"Describe tools in plain text. Example:\n\nTool: Splunk Enterprise\nVendor: Splunk\nCategory: Logging\nAnnual Cost: 180000\nUsers: 150\nCriticality: High\nDeployment: On-Prem"}
            />
            <div className="flex gap-2 mt-3">
              <button
                disabled={!pasteText.trim() || status === "loading"}
                onClick={() => runIngest([], pasteText)}
                className="flex-1 h-10 rounded-md bg-[var(--ptr-navy)] text-white text-sm font-semibold disabled:opacity-40"
              >
                Ingest &amp; Score Tools
              </button>
              <button onClick={loadSample} className="h-10 px-3 rounded-md border border-[var(--ptr-border)] text-sm text-[var(--ptr-navy)] hover:bg-[var(--ptr-background)]">
                Load Sample
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-lg border-2 border-dashed border-[var(--ptr-border)] bg-[var(--ptr-background)]/50 p-4">
          {status === "idle" && !tools.length && <p className="text-xs text-[var(--ptr-muted)] text-center">No data ingested yet.</p>}
          {status === "loading" && (
            <p className="text-xs text-[var(--ptr-muted)] text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Parsing and scoring tools…
            </p>
          )}
          {status === "error" && <p className="text-xs text-[var(--ptr-red)] text-center">{error}</p>}
          {(status === "done" || tools.length > 0) && status !== "loading" && (
            <p className="text-xs text-[var(--ptr-green)] text-center flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" /> {tools.length} tools ingested and scored{painPoints.length ? ` · ${painPoints.length} pain points detected` : ""}
            </p>
          )}
        </div>

        <WizardNav onBack={() => setPhase(1)} onNext={() => setPhase(3)} nextLabel="Continue to Business Context" nextDisabled={!tools.length} />
      </SectionCard>
    );
  }

  function BusinessPhase() {
    const bd = wizard.business;
    const toggle = (list: string[], val: string) => (list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
    return (
      <SectionCard title="Phase 3 — Business Context">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Compliance Requirements">
            <div className="flex flex-col gap-2">
              {COMPLIANCE_OPTIONS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={bd.compliance.includes(c)} onChange={() => updateBusiness({ compliance: toggle(bd.compliance, c) })} />
                  {c}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Strategic Priorities">
            <div className="flex flex-col gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={bd.priorities.includes(p)} onChange={() => updateBusiness({ priorities: toggle(bd.priorities, p) })} />
                  {p}
                </label>
              ))}
            </div>
          </Field>
          <div className="md:col-span-2">
            <Field label="Specific Focus Area (Optional)">
              <input
                value={bd.focus}
                onChange={(e) => updateBusiness({ focus: e.target.value })}
                className="ptr-input"
                placeholder="e.g., Observability stack rationalisation, Security tool overlap, BSS/OSS modernisation..."
              />
            </Field>
          </div>
          {painPoints.length > 0 && (
            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-[var(--ptr-navy)] mb-2">Detected Pain Points (from ingested data)</div>
              <div className="flex flex-col gap-1.5">
                {painPoints.map((p, i) => (
                  <div key={i} className="text-xs bg-amber-50 border border-amber-200 rounded px-3 py-2 text-[var(--ptr-text)]">
                    {p}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="md:col-span-2">
            <Field label="Additional Business Challenges">
              <textarea
                value={bd.challenges}
                onChange={(e) => updateBusiness({ challenges: e.target.value })}
                rows={4}
                className="ptr-input resize-none"
                placeholder="Describe any additional business challenges driving this rationalization effort..."
              />
            </Field>
          </div>
        </div>
        <WizardNav onBack={() => setPhase(2)} onNext={() => setPhase(4)} />
      </SectionCard>
    );
  }

  function TechnicalPhase() {
    const td = wizard.technical;
    return (
      <SectionCard title="Phase 4 — Technical Context">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cloud Strategy">
            <select value={td.cloudStrategy} onChange={(e) => updateTechnical({ cloudStrategy: e.target.value })} className="ptr-input">
              <option value="">Select...</option>
              <option value="cloud-first">Cloud-First</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-prem-first">On-Prem First</option>
              <option value="multi-cloud">Multi-Cloud</option>
            </select>
          </Field>
          <Field label="Preferred Cloud Provider">
            <select value={td.provider} onChange={(e) => updateTechnical({ provider: e.target.value })} className="ptr-input">
              <option value="">No preference</option>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">Google Cloud</option>
              <option value="oci">Oracle Cloud</option>
            </select>
          </Field>
          <Field label="Target Migration Timeline">
            <select value={td.timeline} onChange={(e) => updateTechnical({ timeline: e.target.value })} className="ptr-input">
              <option value="">Select...</option>
              <option value="aggressive">Aggressive (6-12 months)</option>
              <option value="standard">Standard (12-24 months)</option>
              <option value="gradual">Gradual (24-36 months)</option>
            </select>
          </Field>
          <Field label="SLA Requirement">
            <select value={td.slaRequirement} onChange={(e) => updateTechnical({ slaRequirement: e.target.value })} className="ptr-input">
              <option value="">Select...</option>
              <option value="24x7-99.99">24x7, 99.99% uptime</option>
              <option value="24x7-99.9">24x7, 99.9% uptime</option>
              <option value="business-hours">Business hours only</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Known Technical Pain Points">
              <textarea
                value={td.painPoints}
                onChange={(e) => updateTechnical({ painPoints: e.target.value })}
                rows={3}
                className="ptr-input resize-none"
                placeholder="e.g., Too many overlapping monitoring tools, legacy on-prem systems with high maintenance cost, security gaps in IAM layer..."
              />
            </Field>
          </div>
        </div>
        <WizardNav onBack={() => setPhase(3)} onNext={() => setPhase(5)} />
      </SectionCard>
    );
  }

  function FinancialPhase() {
    const fd = wizard.financial;
    return (
      <SectionCard title="Phase 5 — Financial Parameters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Annual IT Budget (USD)">
            <input type="number" value={fd.budget} onChange={(e) => updateFinancial({ budget: e.target.value })} className="ptr-input" placeholder="e.g., 5000000" />
          </Field>
          <Field label="Target Savings">
            <select value={fd.savingsTarget} onChange={(e) => updateFinancial({ savingsTarget: e.target.value })} className="ptr-input">
              <option value="">Select...</option>
              <option value="10">~10% reduction</option>
              <option value="20">~20% reduction</option>
              <option value="30">~30% reduction</option>
              <option value="40+">40%+ reduction</option>
            </select>
          </Field>
          <Field label="Cost vs. Risk Priority">
            <select value={fd.priority} onChange={(e) => updateFinancial({ priority: e.target.value })} className="ptr-input">
              <option value="">Select...</option>
              <option value="cost">Cost reduction first</option>
              <option value="risk">Risk mitigation first</option>
              <option value="balanced">Balanced</option>
            </select>
          </Field>
          <Field label="Business Disruption Tolerance">
            <select value={fd.disruptionTolerance} onChange={(e) => updateFinancial({ disruptionTolerance: e.target.value })} className="ptr-input">
              <option value="">Select...</option>
              <option value="low">Low — minimal disruption</option>
              <option value="medium">Medium</option>
              <option value="high">High — comfortable with change</option>
            </select>
          </Field>
        </div>
        <WizardNav onBack={() => setPhase(4)} onNext={() => setPhase(6)} />
      </SectionCard>
    );
  }

  function SummaryPhase() {
    const o = wizard.org;
    const fd = wizard.financial;
    return (
      <SectionCard title="Phase 6 — Assess &amp; Report">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <SummaryStat label="Organisation" value={o.organisation || "—"} />
          <SummaryStat label="Industry" value={o.industry} />
          <SummaryStat label="Tools Loaded" value={String(tools.length)} />
          <SummaryStat label="Budget" value={fd.budget ? `$${Number(fd.budget).toLocaleString()}` : "—"} />
        </div>
        <p className="text-sm text-[var(--ptr-muted)] mb-5">
          Your portfolio data and context are ready. Run the full AI assessment to generate the 6R rationalization roadmap, executive
          summary, risk highlights and per-tool analysis.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setPhase(5)} className="h-11 px-4 rounded-md border border-[var(--ptr-border)] text-sm text-[var(--ptr-navy)]">
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
          </button>
          <button
            disabled={!tools.length}
            onClick={() => router.push("/agents/portfolio-rationalization/console/assessment")}
            className="flex-1 h-11 rounded-md bg-[var(--ptr-green)] text-white text-sm font-semibold disabled:opacity-40"
          >
            🎯 Run Full AI Assessment
          </button>
        </div>
      </SectionCard>
    );
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[var(--ptr-navy)]">{label}</span>
      {children}
    </label>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--ptr-background)] rounded-lg p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-[var(--ptr-muted)]">{label}</div>
      <div className="text-sm font-bold text-[var(--ptr-navy)] mt-1 truncate">{value}</div>
    </div>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--ptr-border)]">
      {onBack && (
        <button onClick={onBack} className="h-10 px-4 rounded-md border border-[var(--ptr-border)] text-sm text-[var(--ptr-navy)] flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <div className="flex-1" />
      {onNext && (
        <button
          disabled={nextDisabled}
          onClick={onNext}
          className="h-10 px-4 rounded-md bg-[var(--ptr-navy)] text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-1.5"
        >
          {nextLabel} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
