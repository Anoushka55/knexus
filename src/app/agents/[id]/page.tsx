import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Play, ExternalLink } from "lucide-react";
import { agents } from "@/data/agents";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ScopeCard } from "@/components/ui/ScopeCard";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import { AgentCard } from "@/components/ui/AgentCard";
import { getSessionUser } from "@/lib/auth";
import { agentSupportsSso } from "@/lib/sso";

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return agents.map((a) => ({ id: a.id }));
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();

  const user = await getSessionUser();
  const isRestricted = user?.role === "restricted";

  const isComingSoon = agent.accessLink === null;
  const isExternal = !isComingSoon && agent.accessLink!.startsWith("http");
  const isSso = agentSupportsSso(agent.accessLink);

  const related = agents
    .filter(
      (a) =>
        a.id !== agent.id &&
        a.categories.some((c) => agent.categories.includes(c))
    )
    .slice(0, 4);

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
                { label: agent.title },
              ]}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT — hero info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title card */}
              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-card">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand-blue border border-blue-200 mb-3">
                      Agent
                    </span>
                    <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
                      {agent.title}
                    </h1>
                  </div>
                  {isComingSoon && (
                    <span className="text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 bg-slate-100 text-slate-400">
                      Coming Soon
                    </span>
                  )}
                </div>

                <p className="text-slate-600 leading-relaxed mb-6">{agent.description}</p>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs font-semibold text-slate-500 mr-1 self-center">
                    Categories:
                  </span>
                  {agent.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  {isComingSoon ? (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  ) : isRestricted ? (
                    <button
                      disabled
                      title="Not available for this account"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed"
                    >
                      Access Agent
                    </button>
                  ) : (
                    <a
                      href={isSso ? `/api/sso/launch?agent=${agent.id}` : agent.accessLink!}
                      target={isSso || isExternal ? "_blank" : "_self"}
                      rel={isSso || isExternal ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
                    >
                      Access Agent
                      {isExternal ? (
                        <ExternalLink className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </a>
                  )}
                  <a
                    href="mailto:knexus@example.com"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Contact Us
                  </a>
                </div>
              </div>

              {/* Key capabilities */}
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
                  <h2 className="text-base font-bold text-slate-800 mb-4">Key Capabilities</h2>
                  <ul className="space-y-2.5">
                    {agent.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-brand-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* RIGHT — video + scope + autonomy */}
            <div className="space-y-4">
              {agent.videoUrl && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
                  <div className="flex items-center gap-2 mb-4">
                    <Play className="w-4 h-4 text-brand-blue" />
                    <h2 className="text-base font-bold text-slate-800">Watch Demo</h2>
                  </div>
                  <VideoEmbed url={agent.videoUrl} title={`${agent.title} demo`} />
                </div>
              )}
              {agent.scope && (
                <ScopeCard
                  label="AGENT SCOPE"
                  level={agent.scope.level}
                  type={agent.scope.type}
                  summary={agent.scope.summary}
                  detail={agent.scope.detail}
                  accent="blue"
                />
              )}
              {agent.autonomy && (
                <ScopeCard
                  label="AUTONOMY LEVEL"
                  level={agent.autonomy.level}
                  type={agent.autonomy.type}
                  summary={agent.autonomy.summary}
                  detail={agent.autonomy.detail}
                  accent="orange"
                />
              )}
            </div>
          </div>

          {/* Sub-agents section */}
          {agent.subAgents && agent.subAgents.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Agents ({agent.subAgents.length})
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                The following agents are included with this app.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agent.subAgents.map((sub, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-card"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center mb-3">
                      <span className="w-4 h-4 rounded-full bg-brand-blue" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">{sub.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{sub.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related agents */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Related Agents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((a, i) => (
                  <AgentCard key={a.id} agent={a} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
