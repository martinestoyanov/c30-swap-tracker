import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PHASES } from "@/data/plan";
import { usePersistentSet } from "@/hooks/usePersistentState";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDown, FlagTriangleRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function PhaseCard({ phase, done, toggle, defaultOpen, canEdit }: {
  phase: (typeof PHASES)[number];
  done: Set<string>;
  toggle: (id: string) => void;
  defaultOpen: boolean;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const total = phase.tasks.length;
  const complete = phase.tasks.filter((t) => done.has(t.id)).length;
  const pct = Math.round((complete / total) * 100);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg">
                <span className="text-muted-foreground font-normal">{phase.num}</span> — {phase.name}
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={pct === 100 ? "default" : "secondary"} className={pct === 100 ? "bg-emerald-600 hover:bg-emerald-600" : ""}>
                  {complete}/{total}
                </Badge>
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-normal">{phase.tagline}</p>
            <Progress value={pct} className="h-1.5 mt-1" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-1">
            {phase.tasks.map((t) => {
              const checked = done.has(t.id);
              return (
                <label key={t.id} className={cn("flex items-start gap-3 rounded-md px-2 py-2", canEdit ? "hover:bg-muted/60 cursor-pointer" : "opacity-80")}>
                  <Checkbox checked={checked} onCheckedChange={() => toggle(t.id)} disabled={!canEdit} className="mt-0.5 shrink-0" />
                  <span className={cn("text-sm leading-snug", checked && "line-through text-muted-foreground")}>{t.text}</span>
                </label>
              );
            })}
            {phase.gate && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900 px-3 py-2">
                <FlagTriangleRight className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <p className="text-xs"><span className="font-semibold">Gate to next phase:</span> {phase.gate}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function Phases() {
  const [done, toggle] = usePersistentSet("c30-phase-tasks");
  const { canEdit } = useAuth();
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {canEdit ? "Checklist state saves and syncs automatically." : "Read-only — sign in (top right) to check off tasks."}
      </p>
      {PHASES.map((p, i) => (
        <PhaseCard key={p.id} phase={p} done={done} toggle={toggle} defaultOpen={i === 0} canEdit={canEdit} />
      ))}
    </div>
  );
}
