"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/portfolio-rationalization/session";
import { RATIONALIZATION_ACTIONS } from "@/lib/portfolio-rationalization/types";
import { ActionBadge, EmptyState, PriorityBadge, SectionCard, ScoreValue } from "../_components";

export default function InventoryPage() {
  const { tools, duplications } = useSession();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [action, setAction] = useState("");

  const categories = useMemo(() => [...new Set(tools.map((t) => t.category))].sort(), [tools]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tools.filter((t) => {
      if (category && t.category !== category) return false;
      if (action && t.rationalization_action !== action) return false;
      if (q && !`${t.name} ${t.vendor ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tools, search, category, action]);

  if (!tools.length) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <SectionCard title="Tool Inventory">
          <EmptyState message="No tools ingested yet — go to Data Ingest." />
          <div className="text-center mt-2">
            <Link href="/agents/portfolio-rationalization/console/ingest" className="text-sm text-[var(--ptr-blue)] font-medium hover:underline">
              Go to Data Ingest →
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or vendor…"
            className="flex-1 max-w-xs text-sm border border-[var(--ptr-border)] rounded-md px-3 py-2"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-sm border border-[var(--ptr-border)] rounded-md px-2 py-2">
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="text-sm border border-[var(--ptr-border)] rounded-md px-2 py-2">
            <option value="">All Actions</option>
            {RATIONALIZATION_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span className="text-xs text-[var(--ptr-muted)] ml-auto">{filtered.length} of {tools.length} tools</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--ptr-muted)] border-b border-[var(--ptr-border)]">
                <th className="py-2 pr-3">Tool</th>
                <th className="py-2 pr-3">Vendor</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Annual Cost</th>
                <th className="py-2 pr-3">Users</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Risk</th>
                <th className="py-2 pr-3">Confidence</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[var(--ptr-muted)]">
                    No tools match this filter.
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-[var(--ptr-border)] hover:bg-[var(--ptr-background)]">
                  <td className="py-2 pr-3 font-semibold">{t.name}</td>
                  <td className="py-2 pr-3 text-[var(--ptr-muted)]">{t.vendor || "—"}</td>
                  <td className="py-2 pr-3">{t.category}</td>
                  <td className="py-2 pr-3">{t.annual_cost ? `$${t.annual_cost.toLocaleString()}` : "—"}</td>
                  <td className="py-2 pr-3">{t.user_count ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <ScoreValue score={t.composite_score} />
                  </td>
                  <td className="py-2 pr-3">{t.scores?.risk_score ?? "—"}/10</td>
                  <td className="py-2 pr-3 text-[var(--ptr-muted)]">{t.confidence_level ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <ActionBadge action={t.rationalization_action} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Duplication &amp; Overlap Detection">
        {duplications.length === 0 ? (
          <EmptyState message="No duplications detected." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--ptr-muted)] border-b border-[var(--ptr-border)]">
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Tool A</th>
                  <th className="py-2 pr-3">Tool B</th>
                  <th className="py-2 pr-3">Overlap</th>
                  <th className="py-2 pr-3">Retain</th>
                  <th className="py-2 pr-3">Est. Savings</th>
                  <th className="py-2 pr-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {duplications.map((d) => (
                  <tr key={d.id} className="border-b border-[var(--ptr-border)]">
                    <td className="py-2 pr-3">{d.category}</td>
                    <td className="py-2 pr-3 font-semibold">{d.tool_a}</td>
                    <td className="py-2 pr-3 font-semibold">{d.tool_b}</td>
                    <td className="py-2 pr-3">{d.overlap_percentage}%</td>
                    <td className="py-2 pr-3">{d.retain_candidate}</td>
                    <td className="py-2 pr-3">${d.potential_annual_savings.toLocaleString()}</td>
                    <td className="py-2 pr-3">
                      <PriorityBadge level={d.priority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
