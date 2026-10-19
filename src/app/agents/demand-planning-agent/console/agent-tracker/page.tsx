"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/lib/demand-planning/ui/Card";
import { Badge } from "@/lib/demand-planning/ui/Badge";
import {
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import {
  getWeeklyTasks,
  getWeekSummary,
  getCycleSummary,
  currentWeekNumber,
  AgentTask,
  TaskStatus,
} from "@/lib/demand-planning/data/agentTasks";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";

const BASE = "/agents/demand-planning-agent/console";

// ─── constants ────────────────────────────────────────────────────────────────

const WEEKS: { num: 1 | 2 | 3 | 4; label: string; days: string }[] = [
  { num: 1, label: "Week 1", days: "Days 1 – 7" },
  { num: 2, label: "Week 2", days: "Days 8 – 14" },
  { num: 3, label: "Week 3", days: "Days 15 – 21" },
  { num: 4, label: "Week 4", days: "Days 22 – 31" },
];

// ─── status display helpers ───────────────────────────────────────────────────

const STATUS_META: Record<
  TaskStatus,
  { Icon: React.ElementType; iconClass: string; badgeVariant: "success" | "warning" | "neutral" | "critical" }
> = {
  Done: { Icon: CheckCircle2, iconClass: "text-success", badgeVariant: "success" },
  "In Progress": { Icon: Clock, iconClass: "text-warning", badgeVariant: "warning" },
  Pending: { Icon: Circle, iconClass: "text-muted", badgeVariant: "neutral" },
  Blocked: { Icon: AlertCircle, iconClass: "text-critical", badgeVariant: "critical" },
};

// ─── sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-navy/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "#2E8B57" : "#E0355C",
          }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold text-muted whitespace-nowrap">
        {done}/{total}
      </span>
    </div>
  );
}

function TaskRow({ task }: { task: AgentTask }) {
  const { Icon, iconClass } = STATUS_META[task.status];
  return (
    <div className="py-2.5 border-t border-[#F2E9D8] first:border-0">
      <div className="flex items-start gap-2.5">
        {/* status icon */}
        <Icon
          size={15}
          strokeWidth={task.status === "Done" ? 2.5 : 2}
          className={`${iconClass} flex-shrink-0 mt-0.5`}
        />

        <div className="flex-1 min-w-0">
          {/* title row */}
          <div className="flex items-start justify-between gap-2">
            <span
              className={`text-[12px] font-semibold leading-tight ${
                task.status === "Done" ? "text-navy/55 line-through decoration-navy/25" : "text-navy"
              }`}
            >
              {task.title}
            </span>
            {task.status !== "Done" && (
              <Badge variant={STATUS_META[task.status].badgeVariant} className="flex-shrink-0 text-[9px]">
                {task.status}
              </Badge>
            )}
          </div>

          {/* description */}
          <p className="text-[10.5px] text-muted leading-snug mt-0.5">{task.description}</p>

          {/* blocker reason */}
          {task.blockerReason && (
            <p className="text-[10px] text-critical font-medium mt-1 flex items-center gap-1">
              <AlertCircle size={10} className="flex-shrink-0" />
              {task.blockerReason}
            </p>
          )}

          {/* view link */}
          {task.relatedPage && task.status !== "Done" && (
            <Link
              href={`${BASE}${task.relatedPage}`}
              className="inline-flex items-center gap-0.5 text-[10px] text-coral font-semibold hover:underline mt-1"
            >
              View <ArrowRight size={10} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function WeekCard({
  week,
  tasks,
  isCurrent,
}: {
  week: (typeof WEEKS)[number];
  tasks: AgentTask[];
  isCurrent: boolean;
}) {
  const summary = getWeekSummary(week.num);

  return (
    <div
      className={`rounded-xl bg-white flex flex-col overflow-hidden ${
        isCurrent
          ? "border-2 border-coral shadow-[0_4px_20px_rgba(224,53,92,0.13)]"
          : "border border-[#E7DDCB] shadow-[0_1px_3px_rgba(42,39,85,0.04)]"
      }`}
    >
      {/* card header */}
      <div
        className={`px-4 pt-4 pb-3 ${
          isCurrent ? "bg-coral/5 border-b border-coral/15" : "border-b border-[#F2E9D8]"
        }`}
      >
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-navy">
              {week.label}
            </span>
            {isCurrent && (
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-coral text-white">
                Current
              </span>
            )}
          </div>
          {summary.blocked > 0 && (
            <span className="text-[9px] font-bold text-critical flex items-center gap-0.5">
              <AlertCircle size={10} /> {summary.blocked} blocked
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted mb-2">{week.days}</div>
        <ProgressBar done={summary.done} total={summary.total} />
      </div>

      {/* task list */}
      <div className="flex-1 px-4 pb-4">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AgentTrackerPage() {
  const allTasks = useMemo(() => getWeeklyTasks(), []);
  const cycle = useMemo(() => getCycleSummary(), []);
  const currentWeek = useMemo(() => currentWeekNumber(), []);

  const tasksByWeek = useMemo(
    () =>
      WEEKS.reduce(
        (acc, w) => {
          acc[w.num] = allTasks.filter((t) => t.week === w.num);
          return acc;
        },
        {} as Record<1 | 2 | 3 | 4, AgentTask[]>
      ),
    [allTasks]
  );

  const remainingTasks = cycle.total - cycle.done;

  const insightText =
    cycle.blocked > 0
      ? `${cycle.done} of ${cycle.total} tasks completed this cycle. ${cycle.blocked} task${
          cycle.blocked !== 1 ? "s are" : " is"
        } blocked — check Week 3 for details. ${cycle.inProgress} task${
          cycle.inProgress !== 1 ? "s are" : " is"
        } actively in progress.`
      : remainingTasks === 0
      ? `All ${cycle.total} tasks completed for this cycle. The agent is ready for governance distribution.`
      : `${cycle.done} of ${cycle.total} tasks completed. ${cycle.inProgress} in progress, ${
          cycle.total - cycle.done - cycle.inProgress
        } pending. Currently in Week ${currentWeek} of the monthly planning cycle.`;

  return (
    <div className="space-y-6">
      {/* ── header ── */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">
          Autonomous Agent
        </div>
        <h1 className="text-3xl font-extrabold text-navy mt-1">Agent Tracker</h1>
        <p className="text-sm text-muted mt-1">
          What the DemandIQ Agent is working on across the 4-week monthly planning cycle.
        </p>
      </div>

      {/* ── agent insight ── */}
      <AgentInsightCard
        sentiment={cycle.blocked > 0 ? "negative" : cycle.done === cycle.total ? "positive" : "neutral"}
        text={insightText}
      />

      {/* ── overall stat pills ── */}
      <div className="flex flex-wrap gap-3">
        {(
          [
            { label: "Total Tasks", value: cycle.total, color: "text-navy" },
            { label: "Done", value: cycle.done, color: "text-success" },
            { label: "In Progress", value: cycle.inProgress, color: "text-warning" },
            { label: "Pending", value: cycle.total - cycle.done - cycle.inProgress - cycle.blocked, color: "text-muted" },
            { label: "Blocked", value: cycle.blocked, color: "text-critical" },
          ] as const
        ).map(({ label, value, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 bg-white border border-[#E7DDCB] rounded-lg px-3 py-2 shadow-sm"
          >
            <span className={`text-lg font-extrabold ${color}`}>{value}</span>
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── 4-week grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {WEEKS.map((week) => (
          <WeekCard
            key={week.num}
            week={week}
            tasks={tasksByWeek[week.num]}
            isCurrent={week.num === currentWeek}
          />
        ))}
      </div>

      {/* ── legend ── */}
      <div className="flex flex-wrap items-center gap-5 text-[11px] text-muted pt-1">
        <span className="font-semibold text-navy/50 uppercase tracking-wider text-[9px]">Legend</span>
        {(
          [
            { status: "Done", label: "Done" },
            { status: "In Progress", label: "In Progress" },
            { status: "Pending", label: "Pending" },
            { status: "Blocked", label: "Blocked" },
          ] as { status: TaskStatus; label: string }[]
        ).map(({ status, label }) => {
          const { Icon, iconClass } = STATUS_META[status];
          return (
            <span key={status} className="flex items-center gap-1.5">
              <Icon size={13} className={iconClass} />
              {label}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5 ml-2">
          <ListChecks size={13} className="text-coral" />
          <span className="text-coral font-semibold">Highlighted card = current week</span>
        </span>
      </div>
    </div>
  );
}
