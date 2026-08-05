import { useState } from "react";
import { BookOpen, ChevronRight, Cog, CircleDot, AlignCenter, ArrowDownUp, Zap, Car, Disc3, FolderOpen, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const Warn = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-700 dark:text-red-300 text-sm">{children}</div>
);
const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-orange-700 dark:text-orange-300 text-sm">{children}</div>
);
const Ul = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
    {items.map((i) => <li key={i.slice(0, 40)}>{i}</li>)}
  </ul>
);

const SECTIONS: DocSection[] = [
  {
    id: "plan",
    title: "Unified Plan Overview (Rev 2)",
    icon: BookOpen,
    content: (
      <div className="space-y-3">
        <Ul items={[
          "Vehicle: 2011 Volvo C30 T5 M66 — Hilton Stage 2+ tune, ~270–285 crank HP. Original lower-mileage engine STAYS in the car.",
          "Donor: 2005 S40 T5 AWD M66 (running, stripped). Donor engine will be mothballed — fog cylinders, drain fluids, seal openings, tag as known-running B5254T3 (saleable spare).",
          "Four execution phases + deferred Stage 2. Car stays drivable between Phases 1 and 2.",
          "Budget: ~$1,959–3,134 gross; ~$909–2,634 net after resale (realistic midpoint ~$1,700–1,900).",
        ]} />
        <Tip><strong>Rev 2 decisions (Aug 4):</strong> donor engine mothballed · kit CSC confirmed P2 → P1 CSC 31258380 firm order · SQUARE early-style trans mount (31359779) chosen over round hydraulic · Elevate torque mount insert to be inspected.</Tip>
      </div>
    ),
  },
  {
    id: "bench",
    title: "Phase 0: Angle Gear & Bench Service",
    icon: Cog,
    content: (
      <div className="space-y-3">
        <Ul items={[
          "Separate AWD M66 + angle gear from the donor engine FIRST, then mothball the engine.",
          "Angle gear case split: mark pinion nut/flange positions before disassembly. Reset preload gradually with an inch-lb wrench — over-crushing is irreversible.",
          "Collar sleeve (31437983 — THE known P1 AWD failure point): heat to ~300°F for removal.",
          "INSPECT M66 diff output splines: must be square-edged. Pointed = worn diff; a new collar will strip.",
          "Large trans-side seal 8636194: press just BELOW flush — not fully seated (confirmed leak cause).",
          "Crush sleeve 8689678: never reuse; fits pre-2006 only. Case halves sealed with RTV — no gasket.",
          "Drain plug mod: drill/tap M18×1.5 while the case is open (zero shavings risk). Verify plug clears the ring gear path. Elring 986833 plug + 11998 copper washers.",
          "M66 bench seals: left axle seal 6843481 (SKF 15844), input shaft seal 8675580 (44mm OD). Right-side seals come in the collar kit.",
          "Driveshaft: service, don't replace. Front CV kit 31216175 only if play or dry grease. Mark flange orientation.",
          "Passenger axle: reboot donor AWD axle (31256014 outer + 31256015 inner). Driver's side keeps the newer C30 FWD axle.",
        ]} />
        <Warn><strong>Gate to Phase 1:</strong> angle gear resealed with drain plug · trans seals in · donor engine mothballed · P1 CSC ordered · mount inspections done.</Warn>
      </div>
    ),
  },
  {
    id: "clutch",
    title: "Clutch Install (C30 Engine)",
    icon: CircleDot,
    content: (
      <div className="space-y-3">
        <Ul items={[
          "SPEC SO60S-O single-mass flywheel + pre-2006 P2R clutch + NEW P1 CSC 31258380 + rear main seal 9458178.",
          "Flywheel bolts 9454743 ×10 (TTY): 45 Nm + Loctite 271, then +65°.",
          "Pressure plate: 25 Nm cross-pattern. CSC: 10 Nm, even tightening.",
          "Bellhousing to engine: 50 Nm cross-pattern. Clutch bleeder nipple: 5 Nm.",
          "Engine mount spacers (~3/8\" hardened washers) for angle gear / rack clearance.",
          "Install the SQUARE rubber trans mount with the donor's early-style bracket.",
        ]} />
        <Warn><strong>Never actuate the CSC by hand pre-install.</strong> Alignment tool is included in the SO60S0KT kit — do not order one.</Warn>
        <Tip><strong>15-minute test point BEFORE reassembly:</strong> minimum fluid in trans, start engine on stands with axles out, shift all gears. Grinding = CSC bleed/centering problem — fix it now, not after 4 more hours.</Tip>
      </div>
    ),
  },
  {
    id: "alignment",
    title: "Drivetrain Alignment",
    icon: AlignCenter,
    content: (
      <div className="space-y-3">
        <Ul items={[
          "String-line the chassis centerline; plumb bob from the transfer case output.",
          "Equal rail-to-case distances; 10–15mm rack clearance.",
          "Torque order: dogbone 60 ft-lb FIRST, then upper mounts, then trans mounts.",
          "Let the engine idle a minute before final mount torque — avoids pre-loading the rubber.",
          "Re-check measurements, then paint-mark all mount positions.",
          "Exhaust manifold gasket (IPD 141522) while access is maximum: PB Blaster daily ×7 days prior, new nuts 24 Nm star pattern, retorque after one heat cycle.",
        ]} />
      </div>
    ),
  },
  {
    id: "downpipe",
    title: "Downpipe Solutions",
    icon: ArrowDownUp,
    content: (
      <div className="space-y-3">
        <Ul items={[
          "Verify flange face first: flat → 8642449 gasket; machined ridge → 30677190.",
          "Spacer path: 304 SS 3.2mm blanks (85mm OD / 75mm bore / 3×8.5mm holes on ~76mm BCD), 2 MLS gaskets per stack, M8×1.25×35–40mm bolts.",
          "VERIFY the turbo bolt circle on the actual turbo before cutting: measure hole spacing ÷ sin 60°.",
          "Fallback: cut/weld the FWD downpipe.",
        ]} />
      </div>
    ),
  },
  {
    id: "dem",
    title: "Haldex DEM & Wiring",
    icon: Zap,
    content: (
      <div className="space-y-3">
        <Ul items={[
          "Gen 3 DEM required: 5WP33504-01 / 36001160 (XC90 V8, white-solenoid). The 2011 C30 runs GGD v2/v3 CAN — the donor's Gen 2 (D2 v7) cannot communicate. Sell the Gen 2 ($50–150).",
          "Wire the 4-pin DEM connector: fused 12V, ground, CAN High, CAN Low to high-speed CAN at the CEM (passenger kick panel). Follow ABS harness routing through the firewall grommet. Use the P1 4-pin configuration even if the sourced DEM has a 5-pin connector (5th pin is an extra ground).",
          "AWD yaw sensor under the driver's seat (Ford Kuga 4WD unit confirmed working if the donor plug mismatches).",
          "VDash: CEM PIN decode (24 hrs, Position 2, battery tender — can start any time) → Gearbox 'M66 AWD', Driveline '4 Wheel Drive', fuel tank 58L.",
          "VIDA/D5T5: reconfigure BCM for AWD; clear all DTCs.",
          "DEM configuration errors → virgining service (HaldexRepairs.co.uk, ~$100–200).",
          "Validate: gravel launch (rear pulls), VIDA live DEM data varies with throttle, fuel gauge accuracy. Then mandatory 4-wheel alignment + re-torque at 100 miles.",
        ]} />
      </div>
    ),
  },
  {
    id: "rear",
    title: "Rear Subframe, Tank & Driveshaft",
    icon: Car,
    content: (
      <div className="space-y-3">
        <Ul items={[
          "Install the donor AWD rear subframe COMPLETE (diff, Haldex, brakes, axles, wiring attached) — 4 bolts, cross-pattern.",
          "Service while accessible: Haldex filter + fluid (IPD bundle K21627 — 30787687 filter + 31367941 AOC fluid; NOT 1161640, that's ATF), rear diff 75W-90 GL-5 ~1.0L.",
          "AWD saddle tank: plastic connectors are EXTREMELY brittle. Dual-sender wiring in series (6-pin passenger + 2-pin driver). Recommended: cut the fuel pump access panel first.",
          "Center driveshaft: flanges in marked orientation, new bolts ~40–50 Nm cross-pattern, hand-spin a full rotation to verify zero contact.",
          "AWD cat-back from donor (FWD won't clear tank/subframe).",
          "Angle gear fill via new drain/fill plugs: 75W-90 GL-5 (31259380), ~0.7–1.0L.",
        ]} />
      </div>
    ),
  },
  {
    id: "brakes",
    title: "Stage 2 Brakes (Deferred)",
    icon: Disc3,
    content: (
      <div className="space-y-3">
        <Ul items={[
          "Front 320mm refresh: IPD K21062 (rotors + Bosch pads, $163.85) + TTY caliper bolts 30640503 (~$175–185).",
          "Stainless lines: Techna-Fit VOL-1158 — the AWD-specific kit ($138), NOT the FWD 1155. Time with a full fluid flush.",
          "Rear 302mm Frankenbrake: Mazda 5 brackets C2Y6-26-28XA + Focus RS Mk3 rotors PowerStop AR85181EVC (~$115–260).",
          "Verify 17\" wheel clearance for the 320mm fronts before ordering.",
          "Optional: do88/Elevate cold-air intake (~$300–400), adjustable rear camber arms (~$150–300), FMIC (~$400–700) — clutch headroom already covers future power.",
        ]} />
      </div>
    ),
  },
  {
    id: "sources",
    title: "Source Document Map",
    icon: FolderOpen,
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Deep-dive references live in the workspace (<span className="font-mono text-xs">PrimaryProjectData\</span> and <span className="font-mono text-xs">SecondaryProjectData\</span>); the unified plan supersedes the individual parts lists for ordering.</p>
        <Ul items={[
          "C30_AWD_Swap_Guide.md (Primary) — full step-by-step build manual + progress log",
          "Volvo_C30_AWD_Swap_Angle_Gear_Drivetrain_Service_Parts.md — Phase 0 bench procedures",
          "Volvo_C30_AWD_Swap_Price_Crosscheck_FCP_vs_IPD.md — verified prices & part-number corrections",
          "Volvo_C30_AWD_Swap_Stage2_Brake_Order_List.md — front brake order",
          "Volvo_C30_AWD_Clutch_Install_Recap.md — clutch install + pre-reassembly test",
          "Volvo_Haldex_DEM_Controller_Part_Number_Reference.md — DEM generations & sourcing",
          "Volvo_C30_AWD_Engine_Alignment_Guide.md — alignment procedure",
          "Volvo_C30_AWD_Brake_Upgrades_Front_Rear.md — brake reference incl. Frankenbrake",
          "Volvo_TD04HL_Angled_Flange_Dimensions.md — downpipe spacer dimensions/DXF",
          "Trans mount background: SwedeSpeed threads 690080 + 229447",
        ]} />
      </div>
    ),
  },
];

export default function Docs() {
  const [open, setOpen] = useState<Set<string>>(new Set(["plan"]));

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-orange-500" />
        <h2 className="text-sm font-semibold">Project Documentation</h2>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const isOpen = open.has(section.id);
          return (
            <div
              key={section.id}
              className="rounded-lg border bg-card/40 overflow-hidden"
            >
              <button
                onClick={() => toggle(section.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                  isOpen ? "bg-orange-500/5" : "hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="text-sm font-medium">{section.title}</span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
