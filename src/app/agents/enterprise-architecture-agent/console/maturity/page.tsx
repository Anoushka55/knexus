"use client";

import { useMemo, useState } from "react";
import { Gauge, Sparkles, UserPlus, CheckCircle2 } from "lucide-react";
import { useSession } from "@/lib/enterprise-architecture/session";
import {
  SECTIONS,
  QUESTIONS,
  buildResultsPayload,
  computeDims,
  computeOverall,
  createAssessmentSession,
  getMaturityBand,
} from "@/lib/enterprise-architecture/questionnaire";
import { eaPipelineStep, mappingAnalyse } from "@/lib/enterprise-architecture/client";
import { Card, Pill, StatTile, BandPill, Spinner, EmptyState } from "@/components/enterprise-architecture/primitives";
import type { QuestionOptionKey } from "@/lib/enterprise-architecture/types";

type Mode = "home" | "name" | "questionnaire" | "results";

export default function MaturityPage() {
  const {
    assessmentSession,
    setAssessmentSession,
    assessmentResults,
    setAssessmentResults,
    timeResult,
    mappingResult,
    complianceResult,
    arbResult,
    eaContext,
    maturityResult,
    setMaturityResult,
    setInsightsResult,
  } = useSession();

  const [mode, setMode] = useState<Mode>("home");
  const [currentUser, setCurrentUser] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [answers, setAnswers] = useState<Record<string, QuestionOptionKey>>({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = assessmentSession ?? createAssessmentSession();
  const userCount = session.users.length;

  const section = SECTIONS[sectionIdx];
  const sectionQuestions = QUESTIONS.filter((q) => q.sectionId === section?.id);
  const answeredCount = Object.keys(answers).length;
  const allAnsweredInSection = (idx: number) => SECTIONS[idx].questionIds.every((qid) => answers[qid]);

  function startRespondent() {
    setAnswers({});
    setSectionIdx(0);
    setNameInput("");
    setNameError("");
    setMode("name");
  }

  function submitName() {
    const n = nameInput.trim();
    if (!n) {
      setNameError("Please enter your name.");
      return;
    }
    if (session.users.some((u) => u.name.toLowerCase() === n.toLowerCase())) {
      setNameError("This name already exists in this session.");
      return;
    }
    setCurrentUser(n);
    setMode("questionnaire");
  }

  function selectAnswer(qid: string, opt: QuestionOptionKey) {
    setAnswers((prev) => ({ ...prev, [qid]: opt }));
  }

  function submitAnswers() {
    const entry = { name: currentUser, answers: { ...answers }, completedAt: new Date().toISOString() };
    const updated = { ...session, users: [...session.users, entry] };
    setAssessmentSession(updated);
    setAssessmentResults(buildResultsPayload(updated));
    setMode("home");
  }

  const dims = useMemo(() => {
    if (!assessmentResults) return [];
    return computeDims(assessmentResults.majority_answers);
  }, [assessmentResults]);
  const overall = useMemo(() => computeOverall(dims), [dims]);
  const overallBand = getMaturityBand(overall);

  async function runAiAssessment() {
    if (!timeResult || !assessmentResults) return;
    setBusy(true);
    setError(null);
    try {
      let mapping = mappingResult;
      if (!mapping) {
        mapping = await mappingAnalyse({
          applications: timeResult.applications,
          arb_result: arbResult,
          ea_context: eaContext as unknown as Record<string, unknown>,
        }).catch(() => null);
      }
      const pipeline = await eaPipelineStep({
        time_result: timeResult,
        mapping_result: mapping,
        compliance_result: complianceResult,
        assessment_results: assessmentResults,
        arb_result: arbResult,
        industry: eaContext.industry,
        sub_sector: eaContext.sub_sector,
        governance: eaContext.governance,
        ea_framework: eaContext.ea_framework,
        ea_tools: eaContext.ea_tools,
        cloud_strategy: eaContext.cloud_strategy,
        additional_context: eaContext.additional_context,
      });
      if (pipeline.MATURITY) setMaturityResult(pipeline.MATURITY);
      if (pipeline.INSIGHTS) setInsightsResult(pipeline.INSIGHTS);
      setMode("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Step 4 — EA Maturity Assessment</h1>
          <p className="text-sm text-muted-foreground">
            30 questions · 8 dimensions · 4 pillars (KPMG framework) · up to 15 respondents per session.
          </p>
        </div>
        {mode !== "questionnaire" && mode !== "name" && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode("home")}
              className={`h-8 px-3 rounded-ea-sm text-xs border ${mode === "home" ? "bg-navy text-white border-navy" : "border-border"}`}
            >
              Home
            </button>
            <button
              onClick={() => setMode("results")}
              disabled={!assessmentResults}
              className={`h-8 px-3 rounded-ea-sm text-xs border disabled:opacity-40 ${mode === "results" ? "bg-navy text-white border-navy" : "border-border"}`}
            >
              Results
            </button>
          </div>
        )}
      </div>

      {mode === "home" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Respondents" value={`${userCount}/15`} />
            <StatTile label="Questions" value={30} />
            <StatTile label="Dimensions" value={8} />
            <StatTile label="Pillars" value={4} />
          </div>

          {userCount > 0 && (
            <Card title="Completed Respondents">
              <div className="space-y-2">
                {session.users.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-navy/10 text-navy flex items-center justify-center text-xs font-semibold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(u.completedAt).toLocaleTimeString()}</span>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={startRespondent}
              disabled={userCount >= 15}
              className="inline-flex items-center gap-2 h-9 px-3.5 bg-navy text-white rounded-ea-sm text-sm disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" /> {userCount >= 15 ? "Maximum 15 respondents reached" : "Add Respondent"}
            </button>
            {userCount > 0 && (
              <button
                onClick={() => setMode("results")}
                className="inline-flex items-center gap-2 h-9 px-3.5 border border-border rounded-ea-sm text-sm hover:border-navy"
              >
                View Results →
              </button>
            )}
          </div>

          {!timeResult && (
            <Card>
              <EmptyState icon={<Gauge className="w-10 h-10" />} title="Tip: run EA Analysis first" body="The AI Maturity agent uses your portfolio from Step 1 as supporting signal alongside questionnaire evidence." />
            </Card>
          )}
        </>
      )}

      {mode === "name" && (
        <Card className="max-w-md mx-auto">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">Welcome</h2>
            <p className="text-sm text-muted-foreground mb-4">Enter your name to begin the EA Maturity Assessment</p>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitName()}
              placeholder="e.g. John Smith"
              className="w-full h-10 border border-border rounded-ea-sm px-3 text-sm bg-background mb-1"
            />
            {nameError && <div className="text-xs text-crimson mb-2 text-left">{nameError}</div>}
            <button onClick={submitName} className="w-full h-10 bg-navy text-white rounded-ea-sm text-sm font-medium mt-2">
              Start Assessment →
            </button>
          </div>
        </Card>
      )}

      {mode === "questionnaire" && section && (
        <div className="flex gap-5">
          <div className="w-56 shrink-0 hidden md:block">
            <div className="bg-surface border border-border rounded-ea-md p-3 sticky top-20">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase mb-2">Sections</div>
              <div className="space-y-1">
                {SECTIONS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setSectionIdx(i)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-ea-sm text-xs text-left ${
                      i === sectionIdx ? "bg-navy text-white" : "text-muted-foreground hover:bg-background"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${allAnsweredInSection(i) ? "bg-success" : "bg-border"}`} />
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-[11px] text-muted-foreground mb-1">Progress</div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue" style={{ width: `${(answeredCount / 30) * 100}%` }} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{answeredCount}/30 answered</div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{section.label}</h2>
              <p className="text-xs text-muted-foreground">
                Responding as: <span className="text-blue font-medium">{currentUser}</span>
              </p>
            </div>
            <div className="space-y-4">
              {sectionQuestions.map((q) => {
                const globalIdx = QUESTIONS.findIndex((x) => x.id === q.id);
                return (
                  <div
                    key={q.id}
                    className={`bg-surface border rounded-ea-md p-4 ${answers[q.id] ? "border-blue" : "border-border"}`}
                  >
                    <p className="text-sm mb-3">
                      <span className="text-blue font-semibold mr-1.5">Q{globalIdx + 1}.</span>
                      {q.text}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {(Object.entries(q.options) as Array<[QuestionOptionKey, string]>).map(([opt, label]) => (
                        <button
                          key={opt}
                          onClick={() => selectAnswer(q.id, opt)}
                          className={`flex items-start gap-2.5 px-3 py-2 rounded-ea-sm border text-left text-xs transition-colors ${
                            answers[q.id] === opt ? "border-blue bg-blue/5" : "border-border hover:border-blue/50"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              answers[q.id] === opt ? "bg-blue text-white" : "bg-background border border-border text-muted-foreground"
                            }`}
                          >
                            {opt}
                          </span>
                          <span className={answers[q.id] === opt ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => setSectionIdx((i) => Math.max(0, i - 1))}
                disabled={sectionIdx === 0}
                className="h-9 px-4 rounded-ea-sm border border-border text-sm disabled:opacity-40"
              >
                ← Previous
              </button>
              {sectionIdx < SECTIONS.length - 1 ? (
                <button
                  onClick={() => setSectionIdx((i) => Math.min(SECTIONS.length - 1, i + 1))}
                  className="h-9 px-4 rounded-ea-sm bg-blue text-white text-sm"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={submitAnswers}
                  disabled={answeredCount < 30}
                  className="h-9 px-4 rounded-ea-sm bg-success text-white text-sm font-semibold disabled:opacity-40"
                >
                  {answeredCount < 30 ? `Complete all (${answeredCount}/30)` : "Submit All Answers ✓"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === "results" && (
        <>
          {!assessmentResults && (
            <Card>
              <EmptyState icon={<Gauge className="w-10 h-10" />} title="No completed respondents yet" />
            </Card>
          )}

          {assessmentResults && (
            <>
              <Card
                title="Questionnaire Results (majority vote)"
                action={
                  timeResult && (
                    <button
                      onClick={runAiAssessment}
                      disabled={busy}
                      className="inline-flex items-center gap-2 h-8 px-3 bg-navy text-white rounded-ea-sm text-xs disabled:opacity-50"
                    >
                      {busy ? <Spinner /> : <Sparkles className="w-3.5 h-3.5" />} Run AI Maturity Assessment
                    </button>
                  )
                }
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center bg-background border border-border rounded-ea-md px-5 py-3">
                    <div className="text-2xl font-bold">{overall ?? "—"}/5</div>
                    <BandPill band={overallBand.band} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {assessmentResults.respondent_count} respondent(s): {assessmentResults.respondent_names.join(", ")}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dims.map((d) => (
                    <div key={d.id} className="border border-border rounded-ea-sm p-3">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">{d.label}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{d.score ?? "—"}</span>
                        <BandPill band={d.band} />
                      </div>
                    </div>
                  ))}
                </div>
                {error && <div className="mt-3 text-xs text-crimson">{error}</div>}
              </Card>

              {maturityResult && (
                <Card title="AI Maturity Findings" subtitle={`Overall: ${maturityResult.overall_maturity_score}/5 (${maturityResult.overall_band})`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {maturityResult.dimensions &&
                      Object.entries(maturityResult.dimensions).map(([key, d]) => (
                        <div key={key} className="border border-border rounded-ea-sm p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold capitalize">{key.replace(/_/g, " ")}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs tabular-nums">{d.score}</span>
                              <BandPill band={d.band} />
                            </div>
                          </div>
                          {d.positive_findings?.length > 0 && (
                            <ul className="text-[11px] text-success space-y-0.5 mb-1">
                              {d.positive_findings.map((f, i) => (
                                <li key={i}>+ {f}</li>
                              ))}
                            </ul>
                          )}
                          {d.improvement_areas?.length > 0 && (
                            <ul className="text-[11px] text-amber space-y-0.5">
                              {d.improvement_areas.map((f, i) => (
                                <li key={i}>! {f}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                  </div>
                  {maturityResult.top_priorities && maturityResult.top_priorities.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Top Priorities</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {maturityResult.top_priorities.map((p, i) => (
                          <Pill key={i} tone="blue">
                            {p}
                          </Pill>
                        ))}
                      </div>
                    </div>
                  )}
                  {maturityResult.roadmap && maturityResult.roadmap.length > 0 && (
                    <div className="space-y-2">
                      {maturityResult.roadmap.map((phase, i) => (
                        <div key={i} className="border border-border rounded-ea-sm p-2.5">
                          <div className="text-xs font-semibold mb-1">{phase.phase}</div>
                          <ul className="text-[11px] text-muted-foreground space-y-0.5">
                            {phase.actions.map((a, j) => (
                              <li key={j}>• {a}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
