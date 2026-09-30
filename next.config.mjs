import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pins the workspace root to this project. Without it, Next.js walks up
  // looking for lockfiles and can latch onto an unrelated one elsewhere on
  // the machine (e.g. a stray package-lock.json in the user's home
  // directory), which breaks page resolution during the build.
  outputFileTracingRoot: __dirname,
  images: {
    domains: ["upload.wikimedia.org"],
  },

  /**
   * The two original assessments moved under /assessments so the hub has one
   * home. These run before filesystem routing, which is why the old page files
   * could be deleted outright rather than kept alive as redirect stubs.
   *
   * `permanent: true` emits a 308, which preserves the request method — unlike
   * a 301. Specific rules come before the wildcards that follow them.
   */
  async redirects() {
    return [
      { source: "/test", destination: "/assessments/procure-to-pay-automation", permanent: true },
      { source: "/test/baseline", destination: "/assessments/procure-to-pay-automation/assessment", permanent: true },
      { source: "/test/scorecard", destination: "/assessments/procure-to-pay-automation/results", permanent: true },
      { source: "/test/roadmap", destination: "/assessments/procure-to-pay-automation/results/roadmap", permanent: true },
      { source: "/capability-map/smb-assessment", destination: "/assessments/smb-managed-services", permanent: true },
      { source: "/capability-map/smb-assessment/baseline", destination: "/assessments/smb-managed-services/assessment", permanent: true },
      { source: "/capability-map/smb-assessment/scorecard", destination: "/assessments/smb-managed-services/results", permanent: true },
      { source: "/capability-map/smb-assessment/roadmap", destination: "/assessments/smb-managed-services/results/roadmap", permanent: true },
      { source: "/test/:path*", destination: "/assessments/procure-to-pay-automation", permanent: true },
      { source: "/capability-map/smb-assessment/:path*", destination: "/assessments/smb-managed-services", permanent: true },
    ];
  },
};

export default nextConfig;
