/**
 * The source app (ontos-insight) was a standalone TanStack Start app mounted
 * at "/", so its links and data use root-relative routes such as "/incidents".
 * Inside K-Nexus the console lives under the agent's /console folder, so every
 * internal link goes through obsHref() to map the original route onto it.
 */
export const OBS_BASE = "/agents/engineering-observability-command-center/console";

const ROUTE_MAP: Record<string, string> = {
  "/": "/overview",
  "/portfolio": "/engineering-portfolio",
};

export function obsHref(route: string): string {
  if (route.startsWith(OBS_BASE)) return route;
  return OBS_BASE + (ROUTE_MAP[route] ?? route);
}
