import { useCallback, useSyncExternalStore } from "react";
import { getState, initSync, mutate, subscribe, type SharedState } from "@/lib/store";

initSync(); // kicks off once per session; no-op without Firebase config

function useSharedState(): SharedState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/** Shared boolean set backed by the synced store. */
export function usePersistentSet(key: string): [Set<string>, (id: string) => void] {
  const field: "tasks" | "verify" = key === "c30-verify-items" ? "verify" : "tasks";
  const state = useSharedState();
  const toggle = useCallback((id: string) => {
    mutate((s) => {
      const arr = s[field].includes(id) ? s[field].filter((x) => x !== id) : [...s[field], id];
      return { ...s, [field]: arr };
    });
  }, [field]);
  return [new Set(state[field]), toggle];
}

/** Shared string map backed by the synced store (part price tracking). */
export function usePersistentMap(): [Record<string, string>, (id: string, v: string) => void] {
  const state = useSharedState();
  const setField = useCallback((id: string, v: string) => {
    mutate((s) => ({ ...s, prices: { ...s.prices, [id]: v } }));
  }, []);
  return [state.prices, setField];
}
