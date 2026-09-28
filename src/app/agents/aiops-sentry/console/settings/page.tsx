"use client";

import { Card, Pill } from "@/components/aiops/primitives";
import { customers, domains, metrics, services, sites } from "@/lib/aiops";
import { rawSignalVolume24h } from "@/lib/aiops/events";
import { useSession } from "@/lib/aiops/session";

export default function SettingsPage() {
  const { live, setLive, demoMode, setDemoMode, shift, reset } = useSession();

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-navy">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Environment, data sources and demonstration controls.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card title="Environment" className="col-span-12 lg:col-span-6">
          <dl className="space-y-2.5 text-sm">
            {[
              ["Deployment", "Client Deployment"],
              ["Data", "Anonymized, representative operational data"],
              ["Region", "ap-south-1"],
              ["Time zone", "Asia/Kolkata (IST)"],
              ["Reporting window", "Rolling 24 hours"],
              ["Execution mode", "Simulated — no live infrastructure control"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground shrink-0">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Demonstration controls" className="col-span-12 lg:col-span-6">
          <div className="space-y-3">
            <Toggle
              label="Demo Mode"
              hint="Keeps the curated scenarios in focus and prevents empty states."
              value={demoMode}
              onChange={setDemoMode}
            />
            <Toggle
              label="Live Operations Simulation"
              hint="Advances the deterministic event timeline so telemetry, alerts and problem counts move."
              value={live}
              onChange={setLive}
            />
            <div className="flex items-center justify-between border border-border rounded-aiops-sm p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">Simulation position</div>
                <div className="text-[11px] text-muted-foreground">
                  {shift} simulated minutes elapsed since load
                </div>
              </div>
              <button
                onClick={reset}
                className="h-8 px-3 text-xs border border-border rounded-aiops-sm hover:border-navy"
              >
                Reset to start
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Operational data sources" subtitle="Signal volume over the last 24 hours">
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {domains.map((d) => (
            <li key={d.id} className="border border-border rounded-aiops-sm p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{d.short}</span>
                <span className="w-2.5 h-2.5 rounded-aiops-sm" style={{ background: d.colorVar }} />
              </div>
              <div className="text-xl font-semibold text-navy tabular-nums mt-1">
                {(rawSignalVolume24h[d.id] ?? 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground">signals ingested</div>
              <div className="text-[10px] text-muted-foreground mt-1.5">
                {services.filter((s) => s.domainId === d.id).length} services monitored
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <Card title="Estate scope" className="col-span-12 lg:col-span-4">
          <dl className="space-y-2 text-sm">
            {[
              ["Customers", customers.length],
              ["Sites", sites.length],
              ["Services", services.length],
              ["Technology domains", domains.length],
              ["Telemetry metrics", metrics.length],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-border pb-1.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Monitored metrics" className="col-span-12 lg:col-span-8">
          <div className="overflow-x-auto -m-4">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-background border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Metric", "Unit", "Warning", "Critical"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id} className="border-b border-border">
                    <td className="px-3 py-1.5 text-xs">{m.label}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{m.unit}</td>
                    <td className="px-3 py-1.5 text-xs tabular-nums text-amber">{m.warn}</td>
                    <td className="px-3 py-1.5 text-xs tabular-nums text-crimson">{m.critical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Integrations">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[
            "Network telemetry collectors",
            "Cloud platform metrics",
            "Session border controllers",
            "Wireless controllers",
            "Firewall and SOC feeds",
            "Endpoint agents",
            "ITSM ticketing",
            "Notification channels",
          ].map((i) => (
            <li
              key={i}
              className="border border-border rounded-aiops-sm p-3 flex items-center justify-between gap-2"
            >
              <span className="font-medium min-w-0 truncate">{i}</span>
              <Pill tone="success">Connected</Pill>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-border rounded-aiops-sm p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full shrink-0 transition-colors relative ${
          value ? "bg-teal" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
