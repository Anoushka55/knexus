"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Sparkles } from "lucide-react";

const BASE = "/agents/demand-planning-agent/console";

export function FloatingChatButton() {
  const pathname = usePathname();
  if (pathname === `${BASE}/assistant`) return null;

  return (
    <Link
      href={`${BASE}/assistant`}
      className="fixed bottom-6 right-6 z-40 group"
      title="Ask the AI Assistant"
    >
      <div className="bg-coral text-white rounded-full shadow-[0_8px_24px_rgba(224,53,92,0.4)] w-14 h-14 flex items-center justify-center hover:scale-105 transition-transform">
        <MessageCircle size={22} />
        <Sparkles size={12} className="absolute -top-1 -right-1 text-warning animate-pulse" />
      </div>
      <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-navy text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Ask DemandIQ
      </span>
    </Link>
  );
}
