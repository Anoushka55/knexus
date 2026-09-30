import { notFound } from "next/navigation";
import { verticals } from "@/data/verticals";
import { agents } from "@/data/agents";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AgentCard } from "@/components/ui/AgentCard";
import { VerticalSearchBar } from "@/components/ui/VerticalSearchBar";
import {
  TrendingUp, Headphones, Users, MonitorCheck, Radio, Clapperboard, LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  TrendingUp, Headphones, Users, MonitorCheck, Radio, Clapperboard,
};

// Map vertical id → agent category filter
const verticalCategoryMap: Record<string, string[]> = {
  sales:      ["Sales", "Marketing", "Customer Experience"],
  support:    ["Customer Experience", "Operations"],
  hr:         ["Marketing"],
  itsm:       ["IT & Cloud", "Operations"],
  telecom:    ["Telecom", "IT & Cloud"],
  media:      ["Strategy", "Finance & Risk"],
  technology: ["IT & Cloud", "Strategy", "Operations"],
};

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return verticals.map((v) => ({ id: v.id }));
}

export default async function VerticalPage({ params }: Props) {
  const { id } = await params;
  const vertical = verticals.find((v) => v.id === id);
  if (!vertical) notFound();

  const Icon = iconMap[vertical.iconName] ?? TrendingUp;

  const categoryFilter = verticalCategoryMap[vertical.id] ?? [];
  const verticalAgents = agents.filter((a) =>
    a.categories.some((c) => categoryFilter.includes(c))
  );

  const agentCount = verticalAgents.length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Breadcrumb
              crumbs={[
                { label: "Marketplace", href: "/" },
                { label: vertical.title },
              ]}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Page header */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-card">
            <div className="flex items-start gap-5">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0", vertical.iconBgClass)}>
                <Icon className={cn("w-7 h-7", vertical.iconColorClass)} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
                  {/* Split "AI for X" — highlight the vertical name */}
                  {vertical.title.startsWith("AI for ") ? (
                    <>
                      AI for{" "}
                      <span className="text-brand-blue">
                        {vertical.title.replace("AI for ", "")}
                      </span>
                    </>
                  ) : (
                    vertical.title
                  )}
                </h1>
                <p className="text-sm text-slate-500 mb-1">
                  {agentCount} Agents present in the domain selected
                </p>
                {vertical.longDescription ? (
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mt-3">
                    {vertical.longDescription}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {vertical.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
            <VerticalSearchBar />
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 outline-none focus:border-brand-blue flex-shrink-0">
              <option>Recommended</option>
              <option>Highest Accuracy</option>
              <option>Newest</option>
            </select>
          </div>

          {/* Agent grid */}
          {verticalAgents.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              No agents available for this vertical yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {verticalAgents.map((agent, i) => (
                <AgentCard key={agent.id} agent={agent} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
