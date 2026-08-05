import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getVidaConfig,
  getFreshIdToken,
  syncVidaAuth,
  pokeVidaAuth,
  type VidaConfig,
} from "@/lib/store";
import { pingVidaHealth, type VidaPing } from "@/components/VidaHealth";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookMarked,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  RefreshCw,
  Search,
} from "lucide-react";

interface VidaDoc {
  t: string;
  c: string;
  s: string;
  m: number[];
  u: string; // relative path under /vida/
  g?: string[]; // VIDA function group path, e.g. ["2","21"] or ["?"]
}
interface VidaDiagram {
  dia: string;
  name: string;
  group: string;
  m: number[];
  u: string;
}
interface VidaIndex {
  generated: string;
  models: Record<string, string>;
  groups?: Record<string, string>; // group code -> title ("2" -> "Engine with mountings…")
  docs: VidaDoc[];
  diagrams: VidaDiagram[];
}

// [pos, part number, name, qty]
type PartRow = [string, string, string, number];

const SECTION_ORDER = ["repair", "specs", "service", "accessories", "bulletins", "general"];
const SECTION_LABELS: Record<string, string> = {
  repair: "Repair instructions",
  specs: "Specifications",
  service: "Service",
  accessories: "Accessories",
  bulletins: "Bulletins",
  general: "General",
};

const MODEL_FILTERS = [
  { id: "all", label: "Both cars" },
  { id: "1033", label: "C30" },
  { id: "1014", label: "S40" },
] as const;
type ModelFilter = (typeof MODEL_FILTERS)[number]["id"];

const pretty = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

type Selection =
  | { kind: "doc"; title: string; html: string }
  | { kind: "diagram"; title: string; url: string; dia: string };

/** Fetch with an explicit Firebase token (independent of SW state). */
async function authedFetch(url: string, retry = true): Promise<Response> {
  pokeVidaAuth(); // keep the SW's token fresh for subresource requests
  const token = await getFreshIdToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (res.status === 401 && retry) return authedFetch(url, false);
  return res;
}

const errText = (e: unknown) =>
  e instanceof TypeError
    ? `${e.message} — network, DNS, or CORS block`
    : e instanceof Error
      ? e.message
      : String(e);

export default function Vida() {
  const { user, ready, syncEnabled } = useAuth();
  const [config, setConfig] = useState<VidaConfig | null>(null);
  const [configTried, setConfigTried] = useState(false);
  const [index, setIndex] = useState<VidaIndex | null>(null);
  const [indexFail, setIndexFail] = useState<string | null>(null);
  const [health, setHealth] = useState<VidaPing | null>(null);
  const [probeNonce, setProbeNonce] = useState(0);

  const [mode, setMode] = useState<"docs" | "diagrams">("docs");
  const [model, setModel] = useState<ModelFilter>("all");
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("repair");
  const [groupSel, setGroupSel] = useState<string | null>(null); // top-level group code
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Selection | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setConfig(null);
      setIndex(null);
      setConfigTried(false);
      setSelected(null);
      setHealth(null);
      setIndexFail(null);
      return;
    }
    let live = true;
    void getVidaConfig().then((cfg) => {
      if (!live) return;
      setConfig(cfg);
      setConfigTried(true);
      if (cfg) void syncVidaAuth(cfg.origin);
    });
    return () => {
      live = false;
    };
  }, [user]);

  // Health probe of the content server (no auth needed for /healthz).
  useEffect(() => {
    if (!config?.origin) return;
    let live = true;
    setHealth(null);
    void pingVidaHealth(config.origin).then((p) => live && setHealth(p));
    return () => {
      live = false;
    };
  }, [config, probeNonce]);

  // Library index download (authed).
  useEffect(() => {
    if (!config?.origin || index) return;
    let live = true;
    authedFetch(`${config.origin}/vida/index.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<VidaIndex>;
      })
      .then((idx) => {
        if (!live) return;
        if (!idx.groups) {
          // A pre-grouping index can only come from an outdated service
          // worker's cache. Reload once so the updated SW (network-first
          // index) takes control and fetches the current catalog.
          if (!sessionStorage.getItem("vidaStaleReload")) {
            sessionStorage.setItem("vidaStaleReload", "1");
            location.reload();
            return;
          }
          throw new Error("stale index (missing group data)");
        }
        sessionStorage.removeItem("vidaStaleReload");
        setIndex(idx);
      })
      .catch((e) => live && setIndexFail(errText(e)));
    return () => {
      live = false;
    };
  }, [config, index, probeNonce]);

  // Android/browser back button closes the viewer instead of leaving the app.
  useEffect(() => {
    const onPop = () => setSelected(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const recheck = () => {
    setIndexFail(null);
    setHealth(null);
    setProbeNonce((n) => n + 1);
  };

  const modelId = model === "all" ? null : Number(model);
  const q = query.trim().toLowerCase();
  const searching = q.length >= 2;

  const docs = useMemo(() => {
    if (!index) return [];
    return index.docs.filter(
      (d) =>
        (modelId === null || d.m.includes(modelId)) &&
        (!searching || d.t.toLowerCase().includes(q))
    );
  }, [index, modelId, q, searching]);

  const diagrams = useMemo(() => {
    if (!index) return [];
    return index.diagrams.filter(
      (d) =>
        (modelId === null || d.m.includes(modelId)) &&
        (!searching ||
          d.name.toLowerCase().includes(q) ||
          d.dia.toLowerCase().includes(q))
    );
  }, [index, modelId, q, searching]);

  // Search mode: flat section::category grouping across all sections.
  const docsByGroup = useMemo(() => {
    const out = new Map<string, VidaDoc[]>();
    for (const d of docs) {
      const key = `${d.s}::${d.c}`;
      if (!out.has(key)) out.set(key, []);
      out.get(key)!.push(d);
    }
    return [...out.entries()].sort(([a], [b]) => {
      const sa = SECTION_ORDER.indexOf(a.split("::")[0]);
      const sb = SECTION_ORDER.indexOf(b.split("::")[0]);
      if (sa !== sb) return sa - sb;
      return a.localeCompare(b);
    });
  }, [docs]);

  // Browse mode: sections present in the model-filtered corpus.
  const sectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of docs) counts.set(d.s, (counts.get(d.s) ?? 0) + 1);
    return SECTION_ORDER.filter((s) => counts.has(s)).map((s) => ({
      id: s,
      label: SECTION_LABELS[s] ?? s,
      count: counts.get(s)!,
    }));
  }, [docs]);

  // Browse mode: top-level groups within the active section.
  const groupCards = useMemo(() => {
    const out = new Map<string, number>();
    for (const d of docs) {
      if (d.s !== section) continue;
      const g0 = d.g?.[0] ?? "?";
      out.set(g0, (out.get(g0) ?? 0) + 1);
    }
    return [...out.entries()].sort(([a], [b]) => {
      if (a === "?") return 1;
      if (b === "?") return -1;
      return Number(a) - Number(b);
    });
  }, [docs, section]);

  // Browse mode: docs of the selected group, bucketed hierarchically:
  // subgroup (2-digit) -> { direct docs, sub-subgroup (3-digit) -> docs }.
  interface SubBucket {
    direct: VidaDoc[];
    subs: Map<string, VidaDoc[]>;
  }
  const subGroups = useMemo(() => {
    const out = new Map<string, SubBucket>();
    if (groupSel === null) return out;
    for (const d of docs) {
      if (d.s !== section || (d.g?.[0] ?? "?") !== groupSel) continue;
      const s1 = d.g?.[1] ?? "";
      if (!out.has(s1)) out.set(s1, { direct: [], subs: new Map() });
      const bucket = out.get(s1)!;
      const s2 = d.g?.[2];
      if (s2) {
        if (!bucket.subs.has(s2)) bucket.subs.set(s2, []);
        bucket.subs.get(s2)!.push(d);
      } else {
        bucket.direct.push(d);
      }
    }
    const byCode = ([a]: [string, unknown], [b]: [string, unknown]) =>
      a === "" ? -1 : b === "" ? 1 : a.localeCompare(b);
    return new Map(
      [...out.entries()]
        .sort(byCode)
        .map(([k, v]): [string, SubBucket] => [
          k,
          { direct: v.direct, subs: new Map([...v.subs.entries()].sort(byCode)) },
        ])
    );
  }, [docs, section, groupSel]);

  const groupTitle = (code: string) =>
    index?.groups?.[code] || (code === "?" ? "Other" : `Group ${code}`);

  const diasByGroup = useMemo(() => {
    const out = new Map<string, VidaDiagram[]>();
    for (const d of diagrams) {
      if (!out.has(d.group)) out.set(d.group, []);
      out.get(d.group)!.push(d);
    }
    return [...out.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [diagrams]);

  const toggle = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const openSelection = (sel: Selection) => {
    // Push a history entry so Android back returns to the library.
    window.history.pushState({ vidaViewer: true }, "");
    setSelected(sel);
  };

  const closeSelection = () => {
    if (window.history.state?.vidaViewer) window.history.back();
    else setSelected(null);
  };

  const openDoc = async (d: VidaDoc) => {
    if (!config) return;
    setLoadingDoc(d.u);
    setDocError(null);
    try {
      const url = `${config.origin}/vida/${d.u}`;
      const res = await authedFetch(url);
      if (!res.ok) throw new Error(String(res.status));
      let html = await res.text();
      // srcdoc iframes inherit the app origin; point relative refs at the
      // vida origin so images/css resolve (SW attaches auth to those).
      const base = `${config.origin}/vida/${d.u.slice(0, d.u.lastIndexOf("/") + 1)}`;
      const tag = `<base href="${base}">`;
      html = html.includes("<head>")
        ? html.replace("<head>", `<head>${tag}`)
        : tag + html;
      openSelection({ kind: "doc", title: d.t, html });
    } catch {
      setDocError(d.u);
    } finally {
      setLoadingDoc(null);
    }
  };

  const openDiagram = (d: VidaDiagram) => {
    if (!config) return;
    openSelection({
      kind: "diagram",
      title: `${d.dia} — ${d.name}`,
      url: `${config.origin}/vida/${d.u}`,
      dia: d.dia,
    });
  };

  // ---- gates ---------------------------------------------------------------

  if (!syncEnabled) {
    return (
      <Card>
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          The VIDA library is only available on the cloud-synced build of this
          tracker.
        </p>
      </Card>
    );
  }

  if (ready && !user) {
    return (
      <Card>
        <Lock className="h-5 w-5 text-orange-500" />
        <div>
          <p className="text-sm font-medium">VIDA workshop manual — restricted</p>
          <p className="text-sm text-muted-foreground mt-1">
            Volvo's licensed workshop documentation for the 2011 C30 T5 M66 and
            the 2006 S40 AWD donor lives here: repair instructions,
            specifications, bulletins and parts diagrams. Sign in (top right)
            with a project account to view it.
          </p>
        </div>
      </Card>
    );
  }

  if (!ready || (!configTried && user)) {
    return (
      <Card>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading VIDA library…</p>
      </Card>
    );
  }

  if (configTried && !config) {
    return (
      <Card>
        <BookMarked className="h-5 w-5 text-orange-500" />
        <div>
          <p className="text-sm font-medium">VIDA import pending</p>
          <p className="text-sm text-muted-foreground mt-1">
            The workshop manual subset (2,528 documents, 981 parts diagrams) is
            being staged onto the home content server. Check back after the
            next sync.
          </p>
        </div>
      </Card>
    );
  }

  const somethingWrong = indexFail !== null || (health !== null && !health.ok);

  if (somethingWrong) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-orange-500" />
            <p className="text-sm font-medium">VIDA connection diagnostics</p>
            <button
              onClick={recheck}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-check
            </button>
          </div>
          <DiagRow
            label="Content server (healthz)"
            state={health === null ? "checking" : health.ok ? "ok" : "fail"}
            detail={
              health === null
                ? config!.origin
                : health.ok
                  ? `${config!.origin} · ${health.ms} ms`
                  : `${config!.origin} · ${health.err ?? "unreachable"}`
            }
          />
          <DiagRow
            label="Library index (signed-in fetch)"
            state={
              index ? "ok" : indexFail === null ? "checking" : "fail"
            }
            detail={
              index
                ? `${index.docs.length.toLocaleString()} docs, ${index.diagrams.length.toLocaleString()} diagrams`
                : indexFail === null
                  ? "downloading…"
                  : indexFail
            }
          />
          {health !== null && !health.ok && (
            <p className="text-xs text-muted-foreground pt-1">
              The server itself is unreachable from this device. Try opening{" "}
              <span className="font-mono">{config!.origin}/healthz</span>{" "}
              directly in this browser — if that also fails, the problem is
              network-level (cell carrier port filtering, DNS, or the home
              connection), not the app.
            </p>
          )}
          {health?.ok && indexFail && (
            <p className="text-xs text-muted-foreground pt-1">
              The server answers but the signed-in fetch failed — this points
              at the auth handshake on this browser. Signing out and back in
              usually clears it.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!index) {
    return (
      <Card>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Downloading VIDA index…</p>
      </Card>
    );
  }

  // ---- viewer ---------------------------------------------------------------

  if (selected) {
    return (
      <div className="space-y-2">
        <button
          onClick={closeSelection}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to library
        </button>
        <div className="rounded-lg border overflow-hidden">
          <div className="px-3 py-2 border-b bg-muted/40 text-sm font-medium truncate">
            {selected.title}
          </div>
          {selected.kind === "doc" ? (
            <iframe
              srcDoc={selected.html}
              title={selected.title}
              className="w-full h-[75vh] bg-white"
            />
          ) : (
            <div className="w-full max-h-[70vh] overflow-auto bg-white p-2">
              <img
                src={selected.url}
                alt={selected.title}
                className="min-w-full h-auto"
              />
            </div>
          )}
        </div>
        {selected.kind === "diagram" && (
          <DiagramParts origin={config!.origin} dia={selected.dia} />
        )}
      </div>
    );
  }

  // ---- browser ---------------------------------------------------------------

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-orange-500 shrink-0" />
          <p className="text-sm font-medium">VIDA 2014D workshop library</p>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {index.docs.length.toLocaleString()} docs ·{" "}
            {index.diagrams.length.toLocaleString()} diagrams
          </span>
        </div>

        {health?.ok && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Content server online · {health.ms} ms
          </p>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles… (min 2 chars)"
            className="w-full rounded-md border bg-background pl-8 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <div className="flex rounded-md border overflow-hidden text-xs">
            {(["docs", "diagrams"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 capitalize",
                  mode === m
                    ? "bg-orange-500 text-white"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {m === "docs" ? "Documents" : "Parts diagrams"}
              </button>
            ))}
          </div>
          <div className="flex rounded-md border overflow-hidden text-xs">
            {MODEL_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setModel(f.id)}
                className={cn(
                  "px-3 py-1.5",
                  model === f.id
                    ? "bg-orange-500 text-white"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "docs" && !searching && (
          <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1">
            {sectionCounts.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSection(s.id);
                  setGroupSel(null);
                }}
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap",
                  section === s.id
                    ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {s.label}
                <span className="ml-1 opacity-70">{s.count}</span>
              </button>
            ))}
          </div>
        )}

        {docError && (
          <p className="text-xs text-red-600">
            Could not open that document — the content server may be offline.
          </p>
        )}
      </div>

      {mode === "docs" ? (
        searching ? (
          docsByGroup.length === 0 ? (
            <Empty />
          ) : (
            docsByGroup.map(([key, list]) => {
              const [sec, category] = key.split("::");
              const open = openGroups.has(key) || searching;
              return (
                <div key={key} className="rounded-lg border overflow-hidden">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50"
                  >
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        open && "rotate-90"
                      )}
                    />
                    <span className="text-sm font-medium truncate">{category}</span>
                    <span className="ml-auto flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {SECTION_LABELS[sec] ?? sec}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {list.length}
                      </span>
                    </span>
                  </button>
                  {open && (
                    <div className="border-t divide-y">
                      {list.slice(0, 100).map((d) => (
                        <DocRow
                          key={d.u}
                          d={d}
                          loading={loadingDoc === d.u}
                          disabled={loadingDoc !== null}
                          onOpen={() => void openDoc(d)}
                        />
                      ))}
                      {list.length > 100 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          …and {list.length - 100} more, refine the search
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : groupSel === null ? (
          // Group picker: VIDA function-group numbers within the section.
          groupCards.length === 0 ? (
            <Empty />
          ) : (
            <div className="rounded-lg border divide-y overflow-hidden">
              {groupCards.map(([code, count]) => (
                <button
                  key={code}
                  onClick={() => setGroupSel(code)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-mono font-semibold",
                      code === "?"
                        ? "bg-muted text-muted-foreground"
                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    )}
                  >
                    {code === "?" ? "—" : code}
                  </span>
                  <span className="text-sm truncate">{groupTitle(code)}</span>
                  <span className="ml-auto flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground">
                    {count}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          )
        ) : (
          // Subgroup accordions inside the chosen group.
          <div className="space-y-3">
            <button
              onClick={() => setGroupSel(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {SECTION_LABELS[section] ?? section} — all groups
            </button>
            <p className="text-sm font-medium">
              <span className="font-mono text-orange-600 dark:text-orange-400 mr-1.5">
                {groupSel === "?" ? "—" : groupSel}
              </span>
              {groupTitle(groupSel)}
            </p>
            {[...subGroups.entries()].map(([sub, bucket]) => {
              const key = `${section}::${groupSel}::${sub}`;
              const open = openGroups.has(key);
              const count =
                bucket.direct.length +
                [...bucket.subs.values()].reduce((n, l) => n + l.length, 0);
              return (
                <div key={key} className="rounded-lg border overflow-hidden">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50"
                  >
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        open && "rotate-90"
                      )}
                    />
                    {sub && (
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {sub}
                      </span>
                    )}
                    <span className="text-sm font-medium truncate capitalize">
                      {sub ? groupTitle(sub) : "General"}
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                      {count}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t">
                      {bucket.direct.length > 0 && (
                        <div className="divide-y">
                          {bucket.direct.map((d) => (
                            <DocRow
                              key={d.u}
                              d={d}
                              loading={loadingDoc === d.u}
                              disabled={loadingDoc !== null}
                              onOpen={() => void openDoc(d)}
                            />
                          ))}
                        </div>
                      )}
                      {[...bucket.subs.entries()].map(([sub2, list]) => {
                        const key2 = `${key}::${sub2}`;
                        const open2 = openGroups.has(key2);
                        return (
                          <div key={key2} className="border-t">
                            <button
                              onClick={() => toggle(key2)}
                              className="w-full flex items-center gap-2 pl-7 pr-3 py-2 text-left hover:bg-muted/50"
                            >
                              <ChevronRight
                                className={cn(
                                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                                  open2 && "rotate-90"
                                )}
                              />
                              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                {sub2}
                              </span>
                              <span className="text-sm truncate capitalize">
                                {groupTitle(sub2)}
                              </span>
                              <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                                {list.length}
                              </span>
                            </button>
                            {open2 && (
                              <div className="border-t divide-y bg-muted/20">
                                {list.map((d) => (
                                  <DocRow
                                    key={d.u}
                                    d={d}
                                    loading={loadingDoc === d.u}
                                    disabled={loadingDoc !== null}
                                    onOpen={() => void openDoc(d)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : diasByGroup.length === 0 ? (
        <Empty />
      ) : (
        diasByGroup.map(([group, list]) => {
          const open = searching || openGroups.has(group);
          return (
            <div key={group} className="rounded-lg border overflow-hidden">
              <button
                onClick={() => toggle(group)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    open && "rotate-90"
                  )}
                />
                <span className="text-sm font-medium truncate">
                  {pretty(group)}
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                  {list.length}
                </span>
              </button>
              {open && (
                <div className="border-t divide-y">
                  {(searching ? list.slice(0, 100) : list).map((d) => (
                    <button
                      key={d.dia}
                      onClick={() => openDiagram(d)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate capitalize">
                        {d.name}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                        {d.dia}
                      </span>
                    </button>
                  ))}
                  {searching && list.length > 100 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      …and {list.length - 100} more, refine the search
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function DocRow({
  d,
  loading,
  disabled,
  onOpen,
}: {
  d: VidaDoc;
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500 shrink-0" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className="text-sm truncate">{d.t}</span>
      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
        {d.m.length === 2 ? "C30+S40" : d.m[0] === 1033 ? "C30" : "S40"}
      </span>
    </button>
  );
}

/** Lazily-loaded parts callout list for a parts diagram. */
function DiagramParts({ origin, dia }: { origin: string; dia: string }) {
  const [rows, setRows] = useState<PartRow[] | null>(null);
  const [state, setState] = useState<"loading" | "empty" | "error" | "ok">(
    "loading"
  );

  useEffect(() => {
    let live = true;
    setState("loading");
    authedFetch(`${origin}/vida/parts/${dia}.json`)
      .then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<PartRow[]>;
      })
      .then((data) => {
        if (!live) return;
        if (!data || data.length === 0) setState("empty");
        else {
          setRows(data);
          setState("ok");
        }
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [origin, dia]);

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="px-3 py-2 border-b bg-muted/40 text-sm font-medium">
        Parts in this diagram
      </div>
      {state === "loading" && (
        <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading parts list…
        </p>
      )}
      {state === "empty" && (
        <p className="px-3 py-3 text-sm text-muted-foreground">
          No parts list is linked to this diagram.
        </p>
      )}
      {state === "error" && (
        <p className="px-3 py-3 text-sm text-red-600">
          Could not load the parts list.
        </p>
      )}
      {state === "ok" && rows && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-1.5 w-10">Pos</th>
              <th className="px-3 py-1.5">Part no.</th>
              <th className="px-3 py-1.5">Description</th>
              <th className="px-3 py-1.5 w-10 text-right">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(([pos, pn, name, qty], i) => (
              <tr key={`${pos}-${pn}-${i}`}>
                <td className="px-3 py-1.5 font-mono text-xs">{pos}</td>
                <td className="px-3 py-1.5 font-mono text-xs whitespace-nowrap">
                  {pn}
                </td>
                <td className="px-3 py-1.5">{name}</td>
                <td className="px-3 py-1.5 text-right text-xs">{qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DiagRow({
  label,
  state,
  detail,
}: {
  label: string;
  state: "ok" | "fail" | "checking";
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span
        className={cn(
          "mt-1.5 h-2 w-2 rounded-full shrink-0",
          state === "ok"
            ? "bg-emerald-500"
            : state === "fail"
              ? "bg-red-500"
              : "bg-muted-foreground animate-pulse"
        )}
      />
      <div className="min-w-0">
        <p className="font-medium leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground break-all">{detail}</p>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 flex items-start gap-3">{children}</div>
  );
}

function Empty() {
  return (
    <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
      Nothing matches that filter.
    </div>
  );
}
