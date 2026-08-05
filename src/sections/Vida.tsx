import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getVidaConfig, type VidaConfig } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookMarked,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  Search,
} from "lucide-react";

interface VidaDoc {
  t: string;
  c: string;
  s: string;
  m: number[];
  url: string;
}
interface VidaDiagram {
  dia: string;
  name: string;
  group: string;
  m: number[];
  url: string;
}
interface VidaIndex {
  generated: string;
  models: Record<string, string>;
  docs: VidaDoc[];
  diagrams: VidaDiagram[];
}

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
  | { kind: "doc"; title: string; url: string }
  | { kind: "diagram"; title: string; url: string };

export default function Vida() {
  const { user, ready, syncEnabled } = useAuth();
  const [config, setConfig] = useState<VidaConfig | null>(null);
  const [configTried, setConfigTried] = useState(false);
  const [index, setIndex] = useState<VidaIndex | null>(null);
  const [indexError, setIndexError] = useState(false);

  const [mode, setMode] = useState<"docs" | "diagrams">("docs");
  const [model, setModel] = useState<ModelFilter>("all");
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Selection | null>(null);

  useEffect(() => {
    if (!user) {
      setConfig(null);
      setIndex(null);
      setConfigTried(false);
      setSelected(null);
      return;
    }
    let live = true;
    void getVidaConfig().then((cfg) => {
      if (!live) return;
      setConfig(cfg);
      setConfigTried(true);
    });
    return () => {
      live = false;
    };
  }, [user]);

  useEffect(() => {
    if (!config?.indexUrl || index) return;
    let live = true;
    fetch(config.indexUrl)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<VidaIndex>;
      })
      .then((idx) => live && setIndex(idx))
      .catch(() => live && setIndexError(true));
    return () => {
      live = false;
    };
  }, [config, index]);

  const modelId = model === "all" ? null : Number(model);
  const q = query.trim().toLowerCase();

  const docs = useMemo(() => {
    if (!index) return [];
    return index.docs.filter(
      (d) =>
        (modelId === null || d.m.includes(modelId)) &&
        (q.length < 2 || d.t.toLowerCase().includes(q))
    );
  }, [index, modelId, q]);

  const diagrams = useMemo(() => {
    if (!index) return [];
    return index.diagrams.filter(
      (d) =>
        (modelId === null || d.m.includes(modelId)) &&
        (q.length < 2 ||
          d.name.toLowerCase().includes(q) ||
          d.dia.toLowerCase().includes(q))
    );
  }, [index, modelId, q]);

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
            being staged into cloud storage. Check back after the next deploy.
          </p>
        </div>
      </Card>
    );
  }

  if (indexError) {
    return (
      <Card>
        <p className="text-sm text-red-600">
          Could not load the VIDA index. Check your connection and try again.
        </p>
      </Card>
    );
  }

  if (!index) {
    return (
      <Card>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Downloading VIDA index…
        </p>
      </Card>
    );
  }

  // ---- viewer ---------------------------------------------------------------

  if (selected) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setSelected(null)}
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
              src={selected.url}
              title={selected.title}
              className="w-full h-[75vh] bg-white"
            />
          ) : (
            <div className="w-full h-[75vh] overflow-auto bg-white p-2">
              <img
                src={selected.url}
                alt={selected.title}
                className="min-w-full h-auto"
              />
            </div>
          )}
        </div>
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
      </div>

      {mode === "docs" ? (
        docsByGroup.length === 0 ? (
          <Empty />
        ) : (
          docsByGroup.map(([key, list]) => {
            const [section, category] = key.split("::");
            const open = q.length >= 2 || openGroups.has(key);
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
                      {SECTION_LABELS[section] ?? section}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {list.length}
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="border-t divide-y">
                    {(q.length >= 2 ? list.slice(0, 100) : list).map((d) => (
                      <button
                        key={d.url}
                        onClick={() =>
                          setSelected({ kind: "doc", title: d.t, url: d.url })
                        }
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{d.t}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                          {d.m.length === 2 ? "C30+S40" : d.m[0] === 1033 ? "C30" : "S40"}
                        </span>
                      </button>
                    ))}
                    {q.length >= 2 && list.length > 100 && (
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
      ) : diasByGroup.length === 0 ? (
        <Empty />
      ) : (
        diasByGroup.map(([group, list]) => {
          const open = q.length >= 2 || openGroups.has(group);
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
                  {(q.length >= 2 ? list.slice(0, 100) : list).map((d) => (
                    <button
                      key={d.dia}
                      onClick={() =>
                        setSelected({
                          kind: "diagram",
                          title: `${d.dia} — ${d.name}`,
                          url: d.url,
                        })
                      }
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
                  {q.length >= 2 && list.length > 100 && (
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
