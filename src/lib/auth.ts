export const COOKIE_NAME = "knx_session";

export type Role = "admin" | "restricted";

export interface SessionUser {
  email: string;
  name: string;
  role: Role;
}

export function encodeUser(user: unknown) {
  try {
    return Buffer.from(JSON.stringify(user)).toString("base64");
  } catch {
    return "";
  }
}

export function decodeUser(token?: string): SessionUser | null {
  if (!token) return null;
  try {
    const json = Buffer.from(token, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Server-component helper (Node runtime only — do not import this from middleware.ts,
// which runs on the Edge runtime and decodes the cookie manually instead).
export async function getSessionUser(): Promise<SessionUser | null> {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return decodeUser(token);
}
