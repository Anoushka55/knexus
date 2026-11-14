import type { Metadata } from "next";

import { AppShell } from "@/lib/legacy-modernization/AppShell";
import { LtmToaster } from "@/lib/legacy-modernization/toast";
import "./ltm-theme.css";

export const metadata: Metadata = {
  title: "Legacy Tech Modernization AI",
  description:
    "Enterprise platform for discovering, planning, refactoring, validating and governing legacy technology modernization.",
};

export default function LegacyTechModernizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ltm-theme min-h-screen">
      <AppShell>{children}</AppShell>
      <LtmToaster />
    </div>
  );
}
