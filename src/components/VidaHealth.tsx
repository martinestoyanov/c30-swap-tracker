import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getVidaConfig, VIDA_FALLBACK_ORIGIN } from "@/lib/store";

export interface VidaPing {
  ok: boolean;
  ms: number;
  err?: string;
}

/** Unauthenticated health probe of the vida-auth service (/healthz is open). */
export async function pingVidaHealth(origin: string): Promise<VidaPing> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${origin}/healthz`, { cache: "no-store" });
    const ms = Math.round(performance.now() - t0);
    return res.ok ? { ok: true, ms } : { ok: false, ms, err: `HTTP ${res.status}` };
  } catch (e) {
    return {
      ok: false,
      ms: Math.round(performance.now() - t0),
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Compact live status pill for the Overview tab. Polls every 60s. */
export default function VidaHealth() {
  const { user, syncEnabled } = useAuth();
  const [state, setState] = useState<"checking" | "online" | "offline">("checking");
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    if (!syncEnabled) return;
    let live = true;
    const run = async () => {
      let origin = VIDA_FALLBACK_ORIGIN;
      if (user) {
        const cfg = await getVidaConfig();
        if (cfg?.origin) origin = cfg.origin;
      }
      const r = await pingVidaHealth(origin);
      if (live) {
        setState(r.ok ? "online" : "offline");
        setMs(r.ms);
      }
    };
    void run();
    const t = setInterval(run, 60000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [user, syncEnabled]);

  if (!syncEnabled) return null;

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
      <span
        className={
          state === "online"
            ? "h-2 w-2 rounded-full bg-emerald-500"
            : state === "offline"
              ? "h-2 w-2 rounded-full bg-red-500"
              : "h-2 w-2 rounded-full bg-muted-foreground animate-pulse"
        }
      />
      VIDA server:{" "}
      {state === "checking"
        ? "checking…"
        : state === "online"
          ? `online${ms !== null ? ` · ${ms} ms` : ""}`
          : "offline — library unavailable"}
    </p>
  );
}
