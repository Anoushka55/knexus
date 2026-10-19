import { agents } from "@/data/agents";
import { simpleConsoleConfig } from "./data";
import { KpiTile, SectionCard, Badge, DataTable } from "./ui";

export function OverviewPage({ agentId }: { agentId: string }) {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{agent.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{agent.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile label="Accuracy" value={typeof agent.accuracy === "number" ? `${agent.accuracy}%` : "—"} />
        <KpiTile label="Scope" value={agent.scope?.type ?? "—"} hint={agent.scope?.summary} />
        <KpiTile label="Autonomy" value={agent.autonomy?.type ?? "—"} hint={agent.autonomy?.summary} />
        <KpiTile label="Categories" value={agent.categories.join(", ")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Scope" description={agent.scope?.detail}>
          <Badge tone="blue">Level {agent.scope?.level} · {agent.scope?.type}</Badge>
        </SectionCard>
        <SectionCard title="Autonomy" description={agent.autonomy?.detail}>
          <Badge tone="amber">Level {agent.autonomy?.level} · {agent.autonomy?.type}</Badge>
        </SectionCard>
      </div>

      <SectionCard title="Capabilities">
        <ul className="space-y-2 text-sm text-slate-700">
          {agent.capabilities?.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              {c}
            </li>
          ))}
        </ul>
      </SectionCard>

      {agent.subAgents && agent.subAgents.length > 0 && (
        <SectionCard title="Sub-agents">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agent.subAgents.map((sa) => (
              <div key={sa.name} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="text-sm font-medium text-slate-900">{sa.name}</div>
                <div className="mt-1 text-xs text-slate-500">{sa.description}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export function OperationsPage({ agentId }: { agentId: string }) {
  const config = simpleConsoleConfig[agentId];
  if (!config) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{config.opsLabel}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{config.opsDescription}</p>
      </div>
      <DataTable columns={config.columns} rows={config.rows} />
    </div>
  );
}

export function ReportsPage({ agentId }: { agentId: string }) {
  const agent = agents.find((a) => a.id === agentId);
  const config = simpleConsoleConfig[agentId];
  if (!agent || !config) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{config.reportLabel}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Auto-compiled from the latest {config.opsLabel.toLowerCase()} run.
        </p>
      </div>

      <SectionCard title="Executive summary">
        <p className="text-sm leading-relaxed text-slate-700">
          {agent.scope?.detail} {agent.autonomy?.detail}
        </p>
      </SectionCard>

      <SectionCard title={config.opsLabel} description={config.opsDescription}>
        <DataTable columns={config.columns} rows={config.rows} />
      </SectionCard>
    </div>
  );
}
