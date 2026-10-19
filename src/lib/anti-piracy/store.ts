/**
 * Client-side workspace store.
 *
 * The original prototype kept an in-memory `AppState` on the server (with
 * optional disk persistence) behind a JWT session cookie and a catch-all API
 * route. This console is fully client-side — there is no server here, and
 * authentication is handled by the surrounding knexus shell — so the same
 * `AppState` shape and the same `CaseWorkflowService` mutation functions
 * (lib/anti-piracy/workflow.ts) now run directly in the browser against a
 * small external store (not React state), so plain functions like `api()`
 * and `post()` (lib/anti-piracy/client.ts) can read and mutate it outside of
 * any component tree, exactly like the original `fetch('/api/...')` calls.
 *
 * "Signing in" here is just picking which seeded demo persona is driving the
 * session (see `setUser`) — every persona shares the same workspace.
 */
import type { AppState, Role, SessionUser } from "./types";
import { buildSeed } from "./seed";

function cloneState(state: AppState): AppState {
  if (typeof structuredClone === "function") return structuredClone(state);
  return JSON.parse(JSON.stringify(state)) as AppState;
}

function toSessionUser(u: AppState["users"][number]): SessionUser {
  return { id: u.id, tenantId: u.tenantId, name: u.name, title: u.title, email: u.email, role: u.role };
}

let state: AppState = buildSeed();
let currentUser: SessionUser = toSessionUser(
  state.users.find((u) => u.role === "lead") ?? state.users[0]
);

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): AppState {
  return state;
}

export function getUser(): SessionUser {
  return currentUser;
}

export function setUser(user: SessionUser) {
  currentUser = user;
  emit();
}

/** Every seeded persona, for the role switcher in the console header. */
export function listPersonas(): SessionUser[] {
  return state.users.filter((u) => u.active).map(toSessionUser);
}

export function setUserById(id: string) {
  const u = state.users.find((x) => x.id === id);
  if (u) setUser(toSessionUser(u));
}

export function setUserByRole(role: Role) {
  const u = state.users.find((x) => x.role === role);
  if (u) setUser(toSessionUser(u));
}

/**
 * Runs a mutation against a draft clone of the workspace, commits it, and
 * notifies subscribers — the client-side analogue of the server's
 * `mutate(fn)` in the original lib/store.ts.
 */
export function run<T>(fn: (state: AppState, user: SessionUser) => T): T {
  const draft = cloneState(state);
  const result = fn(draft, currentUser);
  state = draft;
  emit();
  return result;
}

export function resetStore() {
  state = buildSeed();
  emit();
  return state;
}

export function replaceState(next: AppState) {
  state = next;
  emit();
}
