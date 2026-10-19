"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./client";
import { subscribe } from "./store";

/**
 * Same shape as the original app's `useApi` (hooks/useApi.ts): `{ data, loading,
 * error, refresh, setData }`, backed by `api()` in ./client. Also subscribes to
 * the workspace store so a mutation made anywhere (this page or another) is
 * reflected here automatically, on top of the explicit `refresh()` calls the
 * original pages already make after a POST action.
 */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const refresh = useCallback(async () => {
    const current = pathRef.current;
    if (!current) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await api<T>(current);
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [path, refresh]);

  useEffect(() => subscribe(() => void refresh()), [refresh]);

  return { data, loading, error, refresh, setData };
}
