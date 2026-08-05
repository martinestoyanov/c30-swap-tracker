import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BUDGET, RESALE, TORQUE_SPECS, VERIFY_ITEMS, DO_NOT_ORDER } from "@/data/plan";
import { usePersistentSet } from "@/hooks/usePersistentState";
import { useAuth } from "@/hooks/useAuth";
import { Ban } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function Budget() {
  const [verified, toggleVerified] = usePersistentSet("c30-verify-items");
  const { canEdit } = useAuth();
  const totalMin = BUDGET.reduce((s, b) => s + b.min, 0);
  const totalMax = BUDGET.reduce((s, b) => s + b.max, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Budget Roll-Up</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {BUDGET.map((b) => (
            <div key={b.label} className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground leading-snug">{b.label}</span>
              <span className="font-medium whitespace-nowrap">{b.min === b.max ? fmt(b.min) : `${fmt(b.min)}–${fmt(b.max)}`}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex items-baseline justify-between font-semibold">
            <span>Project total</span><span>{fmt(totalMin)}–{fmt(totalMax)}</span>
          </div>
          <div className="flex items-baseline justify-between text-emerald-700 dark:text-emerald-400">
            <span>Less resale ({RESALE.note})</span><span className="whitespace-nowrap">−{fmt(RESALE.min)}–{fmt(RESALE.max)}</span>
          </div>
          <div className="flex items-baseline justify-between font-semibold border-t pt-2">
            <span>Net out-of-pocket</span><span>{fmt(totalMin - RESALE.max)}–{fmt(totalMax - RESALE.min)}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">Realistic midpoint ~$1,700–1,900 net. Stage 2 brakes (~$445–610) deferred, not included.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Critical Torque Specs</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          {TORQUE_SPECS.map((t) => (
            <div key={t.fastener} className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">{t.fastener}</span>
              <span className="font-medium text-right">{t.spec}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Open Verification Items</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {VERIFY_ITEMS.map((v) => {
            const checked = verified.has(v.id);
            return (
              <label key={v.id} className={cn("flex items-start gap-3 rounded-md px-2 py-2", canEdit ? "hover:bg-muted/60 cursor-pointer" : "opacity-80")}>
                <Checkbox checked={checked} onCheckedChange={() => toggleVerified(v.id)} disabled={!canEdit} className="mt-0.5 shrink-0" />
                <span className={cn("text-sm leading-snug", checked && "line-through text-muted-foreground")}>{v.text}</span>
              </label>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Do NOT Order <span className="text-sm font-normal text-muted-foreground">(already covered)</span></CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {DO_NOT_ORDER.map((d) => (
            <p key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Ban className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{d}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
