"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CATEGORIES } from "@/data/tmtOntology";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

const OntologyGraph = dynamic(
  () => import("@/components/ontology/OntologyGraph"),
  { ssr: false, loading: () => <GraphSkeleton /> },
);

function GraphSkeleton() {
  return (
    <div className="w-full h-full bg-[#f5f0ea] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-brand-blue rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading ontology graph…</span>
      </div>
    </div>
  );
}

export default function TMTOntologyPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <div className="flex flex-col h-screen bg-[#f5f0ea] overflow-hidden">
      {/* Page header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        {/* Breadcrumb sits inside the title bar so the graph keeps its full height */}
        <div className="max-w-7xl mx-auto [&>nav]:mb-2">
          <Breadcrumb
            crumbs={[
              { label: "Marketplace", href: "/" },
              { label: "TMT Ontology" },
            ]}
          />
        </div>

        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              TMT Sector Ontology
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Technology · Media · Telecom — entity relationships across
              Infrastructure, AI Ops, Cloud, and more
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <a
                href="https://telcobillingagent.ezdatamunch.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-brand-blue text-white hover:bg-brand-blue-dark transition-colors"
              >
                Billing Assistant
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 1h6v6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 1L1 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
              <a
                href="https://kpmgcfoagents.ezdatamunch.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border border-brand-blue text-brand-blue bg-white hover:bg-brand-soft transition-colors"
              >
                CFO Intelligence
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 1h6v6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 1L1 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                Ontology node
              </span>
              <span className="flex items-center gap-1 ml-2">
                <span className="inline-block" style={{ lineHeight: 1 }}>
                  <svg width="12" height="10" viewBox="0 0 10 9">
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="1.5"
                    />
                  </svg>
                </span>
                Metric
              </span>
              <span className="flex items-center gap-1 ml-2">
                <svg width="12" height="10" viewBox="0 0 10 9">
                  <polygon points="5,0 10,9 0,9" fill="#dc2626" />
                </svg>
                Decision
              </span>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              activeCategory === "all"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-500"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${activeCategory === "all" ? "bg-white" : "bg-slate-500"}`}
            />
            All
          </button>

          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(active ? "all" : cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors`}
                style={
                  active
                    ? {
                        backgroundColor: cat.color,
                        color: "#fff",
                        borderColor: cat.color,
                      }
                    : {
                        backgroundColor: "#fff",
                        color: "#475569",
                        borderColor: "#d1d5db",
                      }
                }
              >
                {cat.id === "decisions" ? (
                  <svg
                    width="8"
                    height="7"
                    viewBox="0 0 8 7"
                    className="flex-shrink-0"
                  >
                    <polygon
                      points="4,0 8,7 0,7"
                      fill={active ? "#fff" : cat.color}
                    />
                  </svg>
                ) : cat.id === "metrics" ? (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    className="flex-shrink-0"
                  >
                    <circle
                      cx="4"
                      cy="4"
                      r="3"
                      fill="none"
                      stroke={active ? "#fff" : cat.color}
                      strokeWidth="1.5"
                    />
                  </svg>
                ) : (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: active ? "#fff" : cat.color }}
                  />
                )}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Graph canvas — fills remaining height */}
      <div className="flex-1 relative overflow-hidden">
        <OntologyGraphWrapper activeCategory={activeCategory} />
      </div>
    </div>
  );
}

function OntologyGraphWrapper({ activeCategory }: { activeCategory: string }) {
  return <OntologyGraph activeCategory={activeCategory} />;
}
