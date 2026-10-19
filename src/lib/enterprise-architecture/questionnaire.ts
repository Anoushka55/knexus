/**
 * The 30-question / 8-dimension EA Maturity questionnaire, ported verbatim
 * from frontend/ea_assessment.html's SECTIONS_DATA / QUESTIONS_DATA, plus
 * the scoring helpers (getMaturityBand, getMajority, computeDims,
 * computeOverall) used to turn multi-respondent answers into dimension
 * scores before they're sent to the MATURITY agent as primary evidence.
 */
import type {
  AssessmentResultsPayload,
  AssessmentSession,
  MaturityBand,
  MaturityQuestion,
  MaturitySection,
  QuestionOptionKey,
  Respondent,
} from "./types";

export const SECTIONS: MaturitySection[] = [
  { id: "vision_strategy", label: "Vision & Strategy", pillar: "Vision & Strategy", questionIds: ["q1", "q2", "q3", "q4"] },
  { id: "organization", label: "Organization", pillar: "People", questionIds: ["q5", "q6"] },
  { id: "leadership_governance", label: "Leadership & Governance", pillar: "People", questionIds: ["q7", "q8"] },
  { id: "behavior_culture", label: "Behavior & Culture", pillar: "People", questionIds: ["q9", "q10"] },
  { id: "metrics_analysis", label: "Metrics & Analysis", pillar: "Processes", questionIds: ["q11", "q12", "q13"] },
  {
    id: "policy_standards",
    label: "Policy & Standards",
    pillar: "Processes",
    questionIds: ["q14", "q15", "q16", "q17", "q18", "q19"],
  },
  {
    id: "enabling_processes",
    label: "Enabling Processes",
    pillar: "Processes",
    questionIds: ["q20", "q21", "q22", "q23", "q24", "q25", "q26", "q27", "q28", "q29"],
  },
  { id: "tools_technology", label: "Tools & Technology", pillar: "Technology", questionIds: ["q30"] },
];

export const QUESTIONS: MaturityQuestion[] = [
  { id: "q1", sectionId: "vision_strategy", text: "What is the vision and ambition around establishing EA capability?", options: { A: "There is no ambition for a defined EA vision", B: "Need for EA has been identified", C: "Organization has begun to identify EA tasks and resource requirements", D: "Clear EA vision is defined / being defined", E: "EA vision is being realized through an EA roadmap" } },
  { id: "q2", sectionId: "vision_strategy", text: "What is the current capability to develop an EA strategy, a roadmap and implement the identified initiatives?", options: { A: "Developing EA strategy and roadmap is not a key consideration", B: "Insufficient capability exists to develop EA strategy and roadmap", C: "EA strategy capability exists in limited capacity; not centralized", D: "Internal teams are leading EA efforts using industry standards", E: "EA capability is mature, strategic, and continuously improved" } },
  { id: "q3", sectionId: "vision_strategy", text: "What is the involvement of EA considerations in business strategy?", options: { A: "EA viewpoints are not considered in business strategy", B: "Insufficient involvement of EA processes in strategic planning and acquisition", C: "EA processes are occasionally referenced in IT strategy and investment planning", D: "Majority of planned IT acquisitions are guided and governed by the Enterprise Architecture", E: "No unplanned IT investment or acquisition activity without considering EA viewpoints" } },
  { id: "q4", sectionId: "vision_strategy", text: "What is the extent of business linkages with EA activities?", options: { A: "Minimal or limited linkage with business strategy drivers", B: "Explicit linkage to business strategies", C: "Enterprise Architecture is integrated with capital planning and investment control", D: "Enterprise Architecture contributes to periodic re-examination of business drivers", E: "Architecture process metrics are used to optimize and drive business linkages" } },
  { id: "q5", sectionId: "organization", text: "What is the current state of business and technical roles needed for an EA program?", options: { A: "Dedicated roles for driving EA initiatives are not a key requirement", B: "The need for specialized roles / committees has been identified", C: "Some roles are defined, but responsibilities are unclear or overlapping", D: "Architecture Governance committees are established, with clearly defined roles and responsibilities", E: "Governance roles and responsibilities are reviewed and updated to incorporate changes to the EA Framework" } },
  { id: "q6", sectionId: "organization", text: "Is there a community of practice to share EA methodology insights and leading practices?", options: { A: "EA insights and leading practices are not being shared at any level", B: "Inadequate practices of community or practices shared at individual level", C: "EA community of practice exists in key domains with limited engagement", D: "EA communities actively share insights, lessons, and refinements", E: "EA community of practice drives continuous improvement, peer mentoring, and methodology evolution" } },
  { id: "q7", sectionId: "leadership_governance", text: "Are EA principles enforced across business functions and initiatives?", options: { A: "Inefficient or minimal adoption of the EA processes across functions and tech initiatives", B: "Limited adoption of EA activities in functions", C: "Most elements of businesses show acceptance or are actively participating in the Enterprise Architecture process", D: "Widespread adoption of EA activities", E: "Feedback on architecture process from all units is used to drive architecture process improvements" } },
  { id: "q8", sectionId: "leadership_governance", text: "How effectively do business and IT stakeholders engage to align architecture with strategic goals?", options: { A: "Minimal interest of business stakeholders in EA. Architecture decisions made in isolation by IT", B: "Business leaders acknowledge the value of EA in principle. Informal discussions, no structured collaboration", C: "Occasional engagement between business and EA teams, often on a need basis. Alignment is inconsistent", D: "Business stakeholders are regularly involved in architecture reviews and planning. EA is a shared responsibility", E: "EA is a fully integrated, strategic function. Business and IT co-own architecture decisions" } },
  { id: "q9", sectionId: "behavior_culture", text: "What is the extent of communication on EA measures?", options: { A: "There is no ambition for creating awareness on EA measures", B: "The need to create greater awareness about EA has been identified", C: "There is ongoing planning to develop educational sessions and materials to increase awareness of EA processes", D: "Regular training and awareness sessions on EA practices are being conducted", E: "Widespread understanding of architecture principles and processes already exists" } },
  { id: "q10", sectionId: "behavior_culture", text: "What is the general perception of the significance of EA and its role in driving transformation?", options: { A: "EA is not recognized as a strategic function", B: "EA practice is gaining traction with some stakeholders", C: "EA practice is widely adopted across the organization", D: "EA is deeply embedded in the organizational fabric", E: "EA practice is recognized as a critical success factor in all processes" } },
  { id: "q11", sectionId: "metrics_analysis", text: "Are KPIs and metrics defined for the EA program, including monitoring of its performance?", options: { A: "Absence of any framework to measure EA programs and performance", B: "Activities are reviewed, but metrics are not identified for formal assessment", C: "Metrics are defined but not measured adequately", D: "Metrics are defined and measured but not integrated with corrective actions", E: "Metrics are defined and measured periodically, with a formal review mechanism for EA activities" } },
  { id: "q12", sectionId: "metrics_analysis", text: "Are EA insights used in strategic planning and performance reviews?", options: { A: "Architectural thinking is ad hoc, with minimal visibility to business leaders", B: "EA insights are occasionally referenced in a reactive or informal manner", C: "Some business units use EA data to inform decisions; usage is inconsistent", D: "Governance structures exist to ensure consistent application across the organization", E: "EA insights are an integral part of enterprise-wide planning" } },
  { id: "q13", sectionId: "metrics_analysis", text: "How well established is the process for collecting, analyzing, and reporting EA-related data?", options: { A: "Data collection and analysis are ad-hoc or sporadic", B: "Some data is collected and analyzed, but processes are inconsistent and not standardized", C: "Data collection and analysis are standardized with defined procedures, but adoption is limited", D: "Data collection and analysis follow defined processes and are practiced", E: "Data is collected and analyzed using automated tools and integrated systems" } },
  { id: "q14", sectionId: "policy_standards", text: "What is the current state of Architectural Development Methods being practiced?", options: { A: "Minimal or inadequate formal architecture development methods; processes are ad hoc and undocumented", B: "Limited documentation of EA processes and standards. Practices are localized or informal", C: "Adequate architecture standards are defined, but detailed guidelines and reference architectures are not established", D: "ADM Policies and standards are enforced across projects", E: "Policies and standards are continuously improved and aligned with strategic goals and EA frameworks" } },
  { id: "q15", sectionId: "policy_standards", text: "How well are technology standards and platforms defined and enforced across the enterprise?", options: { A: "Minimal guidelines on technology standards exist. No ambition to holistically define these standards", B: "Technology standards are defined with limited context and are inconsistently applied", C: "Technology standards are defined but not managed or enforced", D: "Technology standards are documented and enforced across most domains", E: "Standards are enforced enterprise-wide with governance and compliance mechanisms" } },
  { id: "q16", sectionId: "policy_standards", text: "Describe how the organisation has adopted healthcare interoperability standards across different systems and processes.", options: { A: "No formal adoption of interoperability standards; minimal integration", B: "Limited and inconsistent adoption of interoperability standards", C: "Standards are adopted in major systems. Data exchange is standardized, but not fully integrated across the enterprise", D: "Standards consistently implemented across systems. Interoperability is well-governed, with automated data exchange", E: "Interoperability standards are deeply embedded in architecture and operations" } },
  { id: "q17", sectionId: "policy_standards", text: "To what extent does the organisation define, adopt, and enforce standardized architecture principles, patterns, and technologies across all domains?", options: { A: "Inadequate focus on architectural standards", B: "Architectural standards are defined but followed in silos", C: "Adequate documentation of standards exists at a limited scale, but they are not standardized", D: "Clear definition of standards for most of the IT investments", E: "Clear definition of standards for all of the IT investments" } },
  { id: "q18", sectionId: "policy_standards", text: "Are data governance policies enforced across lifecycle stages?", options: { A: "Inadequate focus on governance policies across lifecycle stages", B: "Policies exist but are applied inconsistently", C: "Enforced in key lifecycle stages; traceability limited", D: "Lifecycle-wide enforcement with governance checkpoints", E: "Fully enforced with automation, audit integration, and policy alignment" } },
  { id: "q19", sectionId: "policy_standards", text: "What is the organisation's approach to compliance with data protection regulations (e.g., HIPAA, GDPR)?", options: { A: "No formal approach to data protection compliance. Awareness of regulations is minimal", B: "Inadequate adherence to data protection regulations and compliance requirements", C: "Data protection is implemented at a limited scale, with few policies enforced", D: "Regulations are understood and addressed through documented policies and procedures", E: "Compliance is embedded into architecture and operations. Standards are proactively enforced" } },
  { id: "q20", sectionId: "enabling_processes", text: "What are some tangible benefits and outcomes derived from EA initiatives?", options: { A: "EA initiatives are not expected to contribute business outcomes", B: "EA has delivered limited value in specific areas. Benefits are not consistently tracked", C: "EA initiatives show measurable outcomes. Benefits are documented and tied to business goals", D: "EA contributes to strategic outcomes such as agility, innovation, and improved customer experience", E: "EA is a key enabler of continuous enterprise transformation" } },
  { id: "q21", sectionId: "enabling_processes", text: "What is the current state of Enterprise Architecture Tools and Repository?", options: { A: "No formal EA repository or tooling is required", B: "Basic digital repositories exist; usage and updates are inconsistent", C: "There are digital repositories (architecture web pages) which are updated periodically", D: "Architecture documents are updated regularly on digital repositories", E: "Architecture documents are updated regularly, and frequently reviewed for the latest architecture developments/standards" } },
  { id: "q22", sectionId: "enabling_processes", text: "How mature is the process for evaluating and adopting emerging technologies?", options: { A: "Emerging technologies are adopted sporadically without formal evaluation", B: "Adoption is not strategically planned; driven by immediate needs or criticality", C: "Technologies are evaluated systematically for fit and feasibility", D: "Emerging technologies are assessed and adopted based on strategic alignment and EA principles", E: "Technology scouting and adoption are embedded in EA processes, with continuous innovation tracking" } },
  { id: "q23", sectionId: "enabling_processes", text: "What is the current capability to manage the lifecycle and standardization of apps?", options: { A: "Applications are managed in silos with minimal standardized lifecycle or enhancement planning", B: "Some applications follow basic lifecycle stages. Standardization is limited", C: "Application lifecycle is documented and managed. Standardization guidelines exist", D: "Application lifecycle and standardization are integrated into EA processes", E: "Application lifecycle and standardization are continuously optimized. Enhancements driven by strategic goals" } },
  { id: "q24", sectionId: "enabling_processes", text: "How well is the security aspect highlighted in existing architecture layers, and are specific security-related measures designed?", options: { A: "Inadequate focus on security considerations in any architecture layer. No formal documentation", B: "Insufficient security measures and lack of integration across Data/Tech/Solution layers", C: "Security is incorporated in some architecture layers with basic measures. Lacks a holistic approach", D: "Security is consistently integrated across most architecture layers. Specific measures are designed and mapped to risks", E: "Security is a foundational aspect across all architecture layers. Measures are comprehensive, risk-based" } },
  { id: "q25", sectionId: "enabling_processes", text: "How well is the process for lifecycle management of infrastructure components?", options: { A: "Minimal or inadequate infrastructure lifecycle management; processes are largely manual and reactive", B: "Limited lifecycle management processes but not standardized or automated", C: "Lifecycle processes are adequately documented and followed for most components", D: "Lifecycle management is automated using tools", E: "Lifecycle management is mostly digital, integrated with EA tools" } },
  { id: "q26", sectionId: "enabling_processes", text: "How well do data models reflect business logic, regulatory requirements, and traceability needs?", options: { A: "Minimal/inadequate data models and flows are defined and practiced", B: "Partial alignment in select models; informal documentation", C: "Data models are aligned in key domains; mapped to business rules", D: "Structured mapping to rules and regulations; version-controlled", E: "Embedded with compliance logic, traceable across domains, and continuously reviewed" } },
  { id: "q27", sectionId: "enabling_processes", text: "How mature are current capabilities to ensure continuity of critical business services through architectural resilience?", options: { A: "Minimal/inadequate architectural provisions in place to ensure continuity of critical business services", B: "Basic resilience exists. Some critical services have continuity plans, but coverage is limited", C: "Most critical services are supported by resilient architecture components", D: "All critical services are architected for continuity and recovery", E: "Resilience is continuously optimized and aligned with business continuity strategy" } },
  { id: "q28", sectionId: "enabling_processes", text: "How effectively are Technology / IT services designed to support business capabilities and processes?", options: { A: "Services are designed in an ad hoc manner without alignment to business needs", B: "Services are partially aligned and support business needs, but alignment is inconsistent", C: "Services are aligned and designed to support key business capabilities and workflows", D: "Service design is driven by business capability models and process optimization", E: "Services are a core enabler of business agility, innovation, and transformation" } },
  { id: "q29", sectionId: "enabling_processes", text: "How well established and effective is the Architecture Review Board (ARB)?", options: { A: "No Architecture Review Board exists. No ambition for establishing these boards", B: "Architecture review takes place in silos and not formally through an ARB", C: "ARB exists in a limited or informal capacity", D: "ARB is formally established and conducts regular reviews across the enterprise", E: "The ARB is a strategic body with executive sponsorship and drives architectural governance" } },
  { id: "q30", sectionId: "tools_technology", text: "How effectively are tools (e.g., modeling, repository, visualization) used to support architecture development and governance?", options: { A: "Minimal usage of tools for EA activities. Architectural work is largely manual", B: "Some tools are used, but only for selected tasks. Usage is informal and project-specific", C: "EA tools are consistently used for activities across projects. A centralized repository of tools exists", D: "EA tools are integrated across domains with other enterprise systems", E: "Enterprise-wide EA tools are used. Activities are automated, supporting real-time decision-making" } },
];

export const SCORE_MAP: Record<QuestionOptionKey, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };

/** Dimension key → framework dimension key, used when feeding the MATURITY agent primary evidence. */
export const DIMENSION_TO_FRAMEWORK_KEY: Record<string, string> = {
  vision_strategy: "vision_and_strategy",
  organization: "organization",
  leadership_governance: "leadership_and_governance",
  behavior_culture: "behaviour_and_culture",
  metrics_analysis: "metrics_and_analysis",
  policy_standards: "policy_and_standards",
  enabling_processes: "enabling_processes",
  tools_technology: "tools_and_technology",
};

export function getMaturityBand(score: number | null): { band: MaturityBand; color: string } {
  if (score === null || score === undefined) return { band: "N/A", color: "#64748b" };
  if (score <= 2.0) return { band: "Low", color: "#ef4444" };
  if (score <= 3.5) return { band: "Medium", color: "#f59e0b" };
  return { band: "High", color: "#22c55e" };
}

export function getMajority(users: Respondent[]): Record<string, QuestionOptionKey | null> {
  const res: Record<string, QuestionOptionKey | null> = {};
  for (const q of QUESTIONS) {
    const v: Record<QuestionOptionKey, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const u of users) {
      const ans = u.answers?.[q.id];
      if (ans) v[ans]++;
    }
    const nz = (Object.entries(v) as Array<[QuestionOptionKey, number]>).filter(([, x]) => x > 0);
    if (!nz.length) {
      res[q.id] = null;
      continue;
    }
    nz.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    res[q.id] = nz[0][0];
  }
  return res;
}

export interface ComputedDimension extends MaturitySection {
  score: number | null;
  band: MaturityBand;
  color: string;
}

export function computeDims(majority: Record<string, QuestionOptionKey | null>): ComputedDimension[] {
  return SECTIONS.map((sec) => {
    const qs = sec.questionIds.filter((qid) => majority[qid]);
    if (!qs.length) return { ...sec, score: null, band: "N/A" as MaturityBand, color: "#64748b" };
    const avg = qs.reduce((s, qid) => s + SCORE_MAP[majority[qid] as QuestionOptionKey], 0) / qs.length;
    const score = Math.round(avg * 100) / 100;
    const { band, color } = getMaturityBand(score);
    return { ...sec, score, band, color };
  });
}

export function computeOverall(dims: ComputedDimension[]): number | null {
  const v = dims.filter((d) => d.score !== null) as Array<ComputedDimension & { score: number }>;
  if (!v.length) return null;
  return Math.round((v.reduce((s, d) => s + d.score, 0) / v.length) * 100) / 100;
}

export function buildResultsPayload(session: AssessmentSession | null): AssessmentResultsPayload | null {
  if (!session || !session.users.length) return null;
  const majority = getMajority(session.users);
  const dims = computeDims(majority);
  const overall = computeOverall(dims);
  const band = getMaturityBand(overall);
  return {
    source: "ea_assessment_tool",
    respondent_count: session.users.length,
    respondent_names: session.users.map((u) => u.name),
    overall_score: overall,
    overall_band: band.band,
    dimensions: dims.map((d) => ({ id: d.id, label: d.label, score: d.score, band: d.band })),
    majority_answers: majority,
    session_id: session.id,
    completed_at: new Date().toISOString(),
  };
}

export function createAssessmentSession(): AssessmentSession {
  return { id: `s_${Date.now()}`, createdAt: new Date().toISOString(), users: [] };
}
