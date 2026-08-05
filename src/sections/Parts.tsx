import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PARTS, type Part } from "@/data/plan";
import { usePersistentMap } from "@/hooks/usePersistentState";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (n: number) => `$${n.toFixed(2)}`;

function statusBadge(s: Part["status"]) {
  if (s === "Order now") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Order now</Badge>;
  if (s === "Conditional") return <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">Conditional</Badge>;
  return <Badge variant="outline">Alternative</Badge>;
}

function PartRow({ p, current, setCurrent, canEdit }: {
  p: Part;
  current: string;
  setCurrent: (v: string) => void;
  canEdit: boolean;
}) {
  const cur = parseFloat(current);
  const hasCur = current.trim() !== "" && !isNaN(cur);
  const delta = hasCur ? cur - p.price : null;
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{p.part}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-mono">{p.pn}</span> · {p.brand} · {p.vendor}{p.qty > 1 ? ` · qty ${p.qty}` : ""}
          </p>
        </div>
        {statusBadge(p.status)}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span>Verified <span className="font-semibold">{fmt(p.price)}</span> <span className="text-xs text-muted-foreground">({p.priceDate})</span></span>
        {p.qty > 0 && <span className="text-muted-foreground">Line: {fmt(p.price * p.qty)}</span>}
        {delta !== null && delta !== 0 && (
          <span className={cn("flex items-center gap-1 text-xs font-medium", delta > 0 ? "text-red-600" : "text-emerald-600")}>
            {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {delta > 0 ? "+" : ""}{fmt(delta)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          inputMode="decimal"
          placeholder={canEdit ? "Current price…" : "Sign in to track"}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          disabled={!canEdit}
          className="h-8 w-36 text-sm"
        />
        <a href={p.link} target="_blank" rel="noreferrer"
           className="inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-400 hover:underline">
          Open listing <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {p.notes && <p className="text-xs text-muted-foreground leading-snug">{p.notes}</p>}
    </div>
  );
}

export default function Parts() {
  const [query, setQuery] = useState("");
  const [currentMap, setCurrentField] = usePersistentMap();
  const { canEdit } = useAuth();

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? PARTS.filter((p) => `${p.part} ${p.pn} ${p.brand} ${p.vendor} ${p.notes}`.toLowerCase().includes(q))
      : PARTS;
    const map = new Map<string, Part[]>();
    for (const p of filtered) {
      const arr = map.get(p.group) ?? [];
      arr.push(p);
      map.set(p.group, arr);
    }
    return [...map.entries()];
  }, [query]);

  const orderNowTotal = PARTS.filter((p) => p.status === "Order now").reduce((s, p) => s + p.price * p.qty, 0);
  const conditionalTotal = PARTS.filter((p) => p.status === "Conditional").reduce((s, p) => s + p.price * p.qty, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span>Baseline (order now): <span className="font-semibold">{fmt(orderNowTotal)}</span></span>
          <span>Conditional: <span className="font-semibold">{fmt(conditionalTotal)}</span></span>
          <span className="text-muted-foreground text-xs self-center">
            {canEdit ? "verified prices — enter live prices below to track changes" : "verified prices — read-only, sign in to track"}
          </span>
        </CardContent>
      </Card>
      <Input placeholder="Search parts, part numbers, vendors…" value={query} onChange={(e) => setQuery(e.target.value)} />
      {groups.map(([group, parts]) => (
        <Card key={group}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{group} <span className="text-sm font-normal text-muted-foreground">({parts.length})</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parts.map((p) => (
              <PartRow key={p.id} p={p} current={currentMap[p.id] ?? ""} setCurrent={(v) => setCurrentField(p.id, v)} canEdit={canEdit} />
            ))}
          </CardContent>
        </Card>
      ))}
      {groups.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No parts match "{query}".</p>}
    </div>
  );
}
