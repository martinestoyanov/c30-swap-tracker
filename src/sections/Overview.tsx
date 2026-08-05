import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MILESTONES, REV2_DECISIONS } from "@/data/plan";
import { CheckCircle2, CircleDot, Circle, ArrowRightCircle } from "lucide-react";

const stateIcon = (s: string) => {
  if (s === "done") return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
  if (s === "current") return <ArrowRightCircle className="h-5 w-5 text-orange-500 shrink-0" />;
  if (s === "next") return <CircleDot className="h-5 w-5 text-sky-600 shrink-0" />;
  return <Circle className="h-5 w-5 text-muted-foreground shrink-0" />;
};

export default function Overview() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Project Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-semibold">Vehicle:</span> 2011 Volvo C30 T5 M66 — Hilton Stage 2+ tune, decat 3" downpipe, stock catback w/ cutout, pod filter. Est. ~270–285 crank HP / ~290–315 lb-ft. <span className="font-semibold">Original lower-mileage engine stays in the car.</span></p>
          <p><span className="font-semibold">Donor:</span> 2005 Volvo S40 T5 AWD M66 (complete, running) — stripped. Donor engine will be mothballed after the AWD M66 + angle gear are separated.</p>
          <p><span className="font-semibold">Sourcing:</span> FCP Euro + IPD USA only (DEM excepted: eBay/salvage).</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary">VDash + cable owned</Badge>
            <Badge variant="secondary">IPD 141522 kit owned</Badge>
            <Badge variant="secondary">All mounts owned</Badge>
            <Badge variant="secondary">C30 FWD driver's axle transfers</Badge>
            <Badge variant="secondary">Both OEM trans mounts on hand</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Build Status <span className="text-sm font-normal text-muted-foreground">(as of 2026-08-04)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2.5">
            {MILESTONES.map((m, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                {stateIcon(m.state)}
                <span className={m.state === "current" ? "font-semibold" : m.state === "done" ? "text-muted-foreground" : ""}>
                  {m.label}
                  {m.state === "current" && <Badge className="ml-2 bg-orange-500 hover:bg-orange-500">You are here</Badge>}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Rev 2 Decisions <span className="text-sm font-normal text-muted-foreground">(Aug 4)</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {REV2_DECISIONS.map((d) => (
            <div key={d.topic} className="text-sm">
              <span className="font-semibold">{d.topic}: </span>
              <span className="text-muted-foreground">{d.decision}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
