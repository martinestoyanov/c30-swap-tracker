// C30 AWD Swap — project data (Rev 2, Aug 4 2026)
// Single source of truth for the web tracker.

export interface Milestone { label: string; state: "done" | "current" | "next" | "pending" }

export const MILESTONES: Milestone[] = [
  { label: "C30 M66 FWD transmission removed (engine stays in car)", state: "done" },
  { label: "Donor S40 engine + M66 AWD removed as a unit", state: "done" },
  { label: "Bench service: angle gear reseal, M66 seals, separate donor engine", state: "current" },
  { label: "Order P1 CSC 31258380 (kit CSC confirmed P2)", state: "next" },
  { label: "Clutch / SMF / CSC / rear main seal onto C30 engine", state: "next" },
  { label: "AWD M66 + angle gear into C30 (square mount); drive as FWD", state: "pending" },
  { label: "Rear subframe, AWD fuel tank, driveshaft, exhaust", state: "pending" },
  { label: "DEM wiring + VDash/VIDA programming", state: "pending" },
];

export interface Decision { topic: string; decision: string }

export const REV2_DECISIONS: Decision[] = [
  { topic: "Engine", decision: "Donor engine is mothballed (fog cylinders, drain fluids, seal, tag known-running). The C30's lower-mileage engine stays — clutch work happens on the C30 engine." },
  { topic: "CSC", decision: "Kit CSC confirmed as the P2 unit (31259889). Firm order: P1 CSC 31258380 (FCP Metelli $89.99). Sell/shelve the P2 CSC." },
  { topic: "Trans mount", decision: "Use the SQUARE early-style rubber mount (31359779): solid rubber, stiffer, poly-insert compatible, matches donor's early bracket. Round hydraulic 31316498 stays as spare." },
  { topic: "Elevate torque mount", decision: "Inspect insert for wear/deformation while drivetrain is out; order replacement insert (~$40–70) only if worn." },
];

export interface PhaseTask { id: string; text: string }
export interface Phase {
  id: string; num: string; name: string; tagline: string;
  gate?: string; tasks: PhaseTask[];
}

export const PHASES: Phase[] = [
  {
    id: "p0", num: "Phase 0", name: "Bench Service", tagline: "CURRENT — everything is out; do it all before anything goes back in",
    gate: "Angle gear resealed with drain plug · trans seals in · AWD M66 separated & donor engine mothballed · P1 CSC ordered · mount inspections done",
    tasks: [
      { id: "p0-t1", text: "Separate AWD M66 + angle gear from donor engine; mothball donor engine (fog cylinders, drain fluids, seal openings, bag & tag known-running B5254T3)" },
      { id: "p0-t2", text: "Angle gear case split, clean & reseal — collar sleeve kit 31437983, pinion seal 9183891, crush sleeve 8689678 (never reuse), RTV case halves. Mark pinion nut/flange; reset preload gradually. Inspect M66 diff output splines — must be square-edged. Large seal 8636194 presses just BELOW flush" },
      { id: "p0-t3", text: "Angle gear drain plug mod — drill/tap M18×1.5 while case is open; Elring 986833 plug; verify plug clears ring gear path; 11998 copper washers" },
      { id: "p0-t4", text: "M66 seals on the bench — left axle seal 6843481 (SKF 15844), input shaft seal 8675580 (right-side seals are in collar kit)" },
      { id: "p0-t5", text: "Driveshaft service (not replacement) — inspect CV joints / carrier bearing / boots; front CV kit 31216175 only if play or dry grease; new 8mm-hex flange bolts; mark flange orientation" },
      { id: "p0-t6", text: "Front axle boots — passenger side rebooted donor AWD axle: outer kit 31256014 + inner kit 31256015. Driver's side keeps newer C30 FWD axle" },
      { id: "p0-t7", text: "Mount inspections — donor square trans mount: check rubber for cracks/collapse (buy 31359779 + Powerflex insert if failed). Elevate torque mount: check insert (replacement if worn)" },
      { id: "p0-t8", text: "Count studs in IPD kit 141522 against the head" },
    ],
  },
  {
    id: "p1", num: "Phase 1", name: "Front Drivetrain", tagline: "Car drives as FWD after this phase",
    gate: "Car drives cleanly as FWD with AWD transmission — no leaks, no clutch issues",
    tasks: [
      { id: "p1-t1", text: "Clutch job on C30 engine (in car): SPEC SO60S-O SMF + pre-2006 P2R clutch + new P1 CSC 31258380 + RMS 9458178. Flywheel bolts 9454743 ×10: 45 Nm + Loctite 271, then +65°. Pressure plate 25 Nm cross-pattern. CSC 10 Nm. Never actuate CSC by hand pre-install" },
      { id: "p1-t2", text: "Mate AWD M66 to C30 engine (bellhousing 50 Nm cross-pattern), then install angle gear" },
      { id: "p1-t3", text: "15-minute test point BEFORE reassembly: minimum fluid, start on stands, shift all gears — grinding = CSC bleed/centering problem, fix now" },
      { id: "p1-t4", text: "Engine mount spacers (~3/8\" hardened washers, upper engine + trans mounts) for angle gear / rack clearance" },
      { id: "p1-t5", text: "Install SQUARE rubber trans mount (donor, early style) with donor support bracket. Round hydraulic mount stays on the shelf" },
      { id: "p1-t6", text: "Drivetrain alignment: string-line centerline → plumb bob from transfer case output → equal rail-to-case distances → 10–15mm rack clearance → torque dogbone 60 ft-lb FIRST, then upper mounts, then trans mounts → re-check → paint-mark. Idle engine a minute before final torque" },
      { id: "p1-t7", text: "Exhaust manifold gasket (IPD 141522) while access is maximum — PB Blaster daily ×7 prior; new nuts 24 Nm star pattern; retorque after one heat cycle" },
      { id: "p1-t8", text: "Downpipe: verify flange face (flat → 8642449; ridged → 30677190). Spacer path: 304 SS 3.2mm blanks, 2 MLS gaskets per stack, M8×1.25×35–40 — verify ~76mm bolt circle on the actual turbo first. Fallback: cut/weld FWD downpipe" },
      { id: "p1-t9", text: "Axles in (new bolts 30670602), bleed clutch (bleeder 5 Nm), fill trans (2.0L Redline MTL), test drive as FWD" },
    ],
  },
  {
    id: "p2", num: "Phase 2", name: "Rear Subframe, Tank & Driveshaft", tagline: "AWD mechanical, no DEM control yet",
    gate: "Full AWD drivetrain mechanically connected; car rolls and drives front-biased",
    tasks: [
      { id: "p2-t1", text: "Remove C30 rear subframe; install donor AWD subframe complete (diff, Haldex, brakes, axles, wiring attached) — 4 bolts, cross-pattern" },
      { id: "p2-t2", text: "Service while accessible: Haldex filter + fluid (K21627), rear diff 75W-90 GL-5 (~1.0L)" },
      { id: "p2-t3", text: "AWD saddle tank — plastic connectors extremely brittle; dual-sender wiring in series (6-pin passenger + 2-pin driver); recommended: cut fuel pump access panel first" },
      { id: "p2-t4", text: "Center driveshaft with heat shields + carrier bracket; flanges in marked orientation; new bolts ~40–50 Nm cross-pattern; hand-spin full rotation to verify zero contact" },
      { id: "p2-t5", text: "AWD cat-back from donor (FWD won't clear tank/subframe)" },
      { id: "p2-t6", text: "Fill angle gear via new drain/fill plugs: 75W-90 GL-5 (31259380), ~0.7–1.0L" },
    ],
  },
  {
    id: "p3", num: "Phase 3", name: "DEM Wiring & Programming", tagline: "Fully functional AWD",
    tasks: [
      { id: "p3-t1", text: "Gen 3 DEM 5WP33504-01 / 36001160 (XC90 V8, white-solenoid) — 2011 C30 runs GGD v2/v3 CAN; donor Gen 2 can't communicate. Sell donor Gen 2 ($50–150)" },
      { id: "p3-t2", text: "Wire 4-pin DEM connector: fused 12V, ground, CAN H/L to high-speed CAN at CEM (passenger kick panel); follow ABS harness routing. Use P1 4-pin config even on a 5-pin DEM" },
      { id: "p3-t3", text: "AWD yaw sensor under driver's seat (Ford Kuga 4WD unit confirmed working if donor plug mismatches)" },
      { id: "p3-t4", text: "VDash: CEM PIN decode (24 hrs, Position 2, battery tender — start any time) → Gearbox 'M66 AWD', Driveline '4 Wheel Drive', fuel tank 58L" },
      { id: "p3-t5", text: "VIDA/D5T5: reconfigure BCM for AWD; clear all DTCs" },
      { id: "p3-t6", text: "If DEM throws configuration errors: virgining service (HaldexRepairs.co.uk, ~$100–200)" },
      { id: "p3-t7", text: "Validate: gravel launch (rear pulls), VIDA live DEM data varies with throttle, fuel gauge accuracy" },
      { id: "p3-t8", text: "Mandatory 4-wheel alignment; re-torque critical fasteners at 100 miles" },
    ],
  },
  {
    id: "s2", num: "Stage 2", name: "Deferred Upgrades", tagline: "After the swap is complete",
    tasks: [
      { id: "s2-t1", text: "Front 320mm refresh: IPD K21062 (rotors + Bosch pads, $163.85) + TTY caliper bolts 30640503 (~$175–185)" },
      { id: "s2-t2", text: "Stainless lines: Techna-Fit VOL-1158 (AWD-specific, $138) — NOT the FWD 1155 kit; time with full fluid flush" },
      { id: "s2-t3", text: "Rear 302mm Frankenbrake: Mazda 5 brackets C2Y6-26-28XA + Focus RS Mk3 rotors PowerStop AR85181EVC (~$115–260)" },
      { id: "s2-t4", text: "do88 / Elevate cold-air intake (~$300–400) — pod filter is costing 10–15 WHP" },
      { id: "s2-t5", text: "Adjustable rear camber arms (~$150–300) if post-alignment camber excessive" },
      { id: "s2-t6", text: "FMIC (do88 BigPack etc., ~$400–700) — future power step; clutch headroom already covers it" },
    ],
  },
];

export type PartStatus = "Order now" | "Conditional" | "Alternative";
export interface Part {
  id: string; group: string; part: string; pn: string; brand: string; qty: number;
  vendor: string; link: string; price: number; priceDate: string; status: PartStatus; notes: string;
}

export const PARTS: Part[] = [
  { id: "a1", group: "Clutch", part: "Clutch upgrade kit (P2R plate/disc + SPEC SMF)", pn: "SO60S0KT", brand: "Spec", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-clutch-upgrade-kit-spec-so60s0kt", price: 1055.09, priceDate: "2026-07-20", status: "Order now", notes: "Core of the swap. Confirm live price on page." },
  { id: "a2", group: "Clutch", part: "Clutch slave cylinder / CSC (P1)", pn: "31258380", brand: "Metelli", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-clutch-release-bearing-and-slave-cylinder-metelli-31258380", price: 89.99, priceDate: "2026-08-04", status: "Order now", notes: "Kit CSC is P2 — this P1 CSC is a firm separate order." },
  { id: "a3", group: "Clutch", part: "Flywheel bolts (set of 10)", pn: "9454743", brand: "Genuine Volvo", qty: 1, vendor: "IPD", link: "https://www.ipdusa.com/products/search?query=9454743", price: 52.90, priceDate: "2026-07-20", status: "Order now", notes: "One-time-use TTY bolts." },
  { id: "b1", group: "Bench service", part: "Rear main seal", pn: "9458178", brand: "Corteco", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-crankshaft-seal-corteco-9458178", price: 16.13, priceDate: "2026-08-04", status: "Order now", notes: "Do while flywheel is off." },
  { id: "b2", group: "Bench service", part: "M66 input shaft seal (44mm OD)", pn: "8675580", brand: "Genuine Volvo", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-manual-trans-input-shaft-seal-s40-v50-c30-8675580", price: 11.69, priceDate: "2026-08-04", status: "Order now", notes: "44mm OD for M66; 41mm = 1381798. Measure if unsure." },
  { id: "b3", group: "Bench service", part: "Angle gear crush sleeve", pn: "8689678", brand: "Genuine Volvo", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-differential-crush-sleeve-xc90-8689678", price: 22.00, priceDate: "2026-07-20", status: "Order now", notes: "Estimate ($15–30 range); never reuse." },
  { id: "b4", group: "Bench service", part: "Oil drain plug (M18×1.5)", pn: "986833", brand: "Pro Parts (Elring alt.)", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-oil-pan-drain-plug-850-986833", price: 3.09, priceDate: "2026-08-04", status: "Order now", notes: "For drain plug mod. Elring and Genuine ($7.29) also listed." },
  { id: "b5", group: "Bench service", part: "Crush washers (drain/fill plugs)", pn: "11998", brand: "Genuine Volvo", qty: 2, vendor: "FCP Euro", link: "https://www.fcpeuro.com/Parts/?keywords=11998", price: 3.00, priceDate: "2026-07-20", status: "Order now", notes: "Estimate $2–4 each." },
  { id: "b6", group: "Bench service", part: "RTV sealant, Ultra Grey (angle gear reseal)", pn: "N/A", brand: "Permatex", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/Parts/?keywords=ultra+grey", price: 12.00, priceDate: "2026-07-20", status: "Order now", notes: "Estimate $10–15. Case halves: RTV, no gasket." },
  { id: "b7", group: "Bench service", part: "CV boot kit, outer (AWD front axle)", pn: "31256014", brand: "Genuine Volvo", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-cv-joint-boot-kit-s40-v50-31256014", price: 130.46, priceDate: "2026-08-04", status: "Order now", notes: "ON CLEARANCE (was $182.99) — buy soon." },
  { id: "b8", group: "Bench service", part: "CV boot kit, inner (AWD front axle)", pn: "31256015", brand: "Genuine Volvo", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-cv-joint-boot-kit-s40-v50-31256015", price: 65.99, priceDate: "2026-08-04", status: "Order now", notes: "Ships in 4 business days." },
  { id: "b9", group: "Bench service", part: "Downpipe gasket (flat 3-bolt)", pn: "8642449", brand: "Genuine Volvo", qty: 1, vendor: "IPD", link: "https://www.ipdusa.com/products/search?query=8642449", price: 13.95, priceDate: "2026-07-20", status: "Order now", notes: "If flange face ridged → 30677190 instead." },
  { id: "b10", group: "Bench service", part: "Axle bolts, front (pair)", pn: "30670602", brand: "Genuine Volvo", qty: 2, vendor: "IPD", link: "https://www.ipdusa.com/products/search?query=30670602", price: 4.99, priceDate: "2026-07-20", status: "Order now", notes: "TTY — new bolts." },
  { id: "b11", group: "Bench service", part: "Angle gear collar sleeve kit", pn: "31437983", brand: "Genuine Volvo", qty: 1, vendor: "IPD", link: "https://www.ipdusa.com/products/search?query=31437983", price: 200.00, priceDate: "2026-07-20", status: "Conditional", notes: "Only if collar worn at inspection ($150–250 range). THE known P1 AWD failure point." },
  { id: "b12", group: "Bench service", part: "Angle gear pinion seal", pn: "9183891", brand: "Genuine Volvo", qty: 1, vendor: "IPD", link: "https://www.ipdusa.com/products/search?query=9183891", price: 22.95, priceDate: "2026-07-20", status: "Conditional", notes: "Only if angle gear is resealed." },
  { id: "b13", group: "Bench service", part: "M66 left axle seal", pn: "6843481", brand: "SKF 15844", qty: 1, vendor: "IPD", link: "https://www.ipdusa.com/products/search?query=6843481", price: 15.00, priceDate: "2026-07-20", status: "Order now", notes: "Estimate $10–20." },
  { id: "b14", group: "Bench service", part: "Collar sleeve grease", pn: "1161748", brand: "Genuine Volvo", qty: 1, vendor: "IPD", link: "https://www.ipdusa.com/products/search?query=1161748", price: 15.00, priceDate: "2026-07-20", status: "Order now", notes: "Estimate $10–20." },
  { id: "f1", group: "Fluids", part: "Gear oil 75W-90 GL-5, angle gear + rear diff (1L)", pn: "31259380", brand: "Genuine Volvo", qty: 2, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-gear-oil-31259380", price: 33.79, priceDate: "2026-08-04", status: "Order now", notes: "Spec fluid for angle gear / bevel gear." },
  { id: "f2", group: "Fluids", part: "Manual trans fluid 75W-80 GL-4 (1 qt)", pn: "50204", brand: "Red Line MTL", qty: 3, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/manual-transmission-gear-oil-redline-83522-50204", price: 25.59, priceDate: "2026-08-04", status: "Order now", notes: "M66 fill ~2L; buy 3 qt." },
  { id: "f3", group: "Fluids", part: "Brake fluid DOT 4 (1L)", pn: "Typ 200", brand: "ATE", qty: 2, vendor: "FCP Euro", link: "https://www.fcpeuro.com/Parts/?keywords=ATE+Typ+200", price: 20.00, priceDate: "2026-07-20", status: "Order now", notes: "Clutch + brake bleed." },
  { id: "f4", group: "Fluids", part: "Angle gear + rear diff fluid change kit (alt.)", pn: "LM2048KT", brand: "Liqui Moly", qty: 0, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-differential-fluid-change-kit-liqui-moly-lm2048kt", price: 0, priceDate: "2026-08-04", status: "Alternative", notes: "Alternative to Genuine 31259380; one axle per kit. Reference only." },
  { id: "m1", group: "Mounts/conditional", part: "Transmission mount, LEFT — square early style", pn: "31359779", brand: "Hutchinson (OE)", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-engine-mount-left-c70-s40-v50-hutchinson-31359779", price: 104.99, priceDate: "2026-08-04", status: "Order now", notes: "DECISION: square over round hydraulic 31316498. Pro Parts $52.79 / Genuine $184.99." },
  { id: "m2", group: "Mounts/conditional", part: "Elevate torque mount replacement insert", pn: "N/A", brand: "Elevate", qty: 1, vendor: "Elevate", link: "https://elevatecars.com", price: 60.00, priceDate: "2026-07-20", status: "Conditional", notes: "Inspect existing insert first; replace only if worn. Estimate $40–70." },
  { id: "m3", group: "Mounts/conditional", part: "Propshaft front CV joint kit (24 spline)", pn: "31216175", brand: "Pro Parts Sweden", qty: 1, vendor: "FCP Euro", link: "https://www.fcpeuro.com/products/volvo-cv-joint-kit-pro-parts-sweden-31216175", price: 104.99, priceDate: "2026-08-04", status: "Conditional", notes: "Only if propshaft CV worn. Genuine $539.99; IPD aftermarket $92.95." },
  { id: "m4", group: "Mounts/conditional", part: "DEM (Gen 3 Haldex controller)", pn: "5WP33504-01", brand: "Used/OEM", qty: 1, vendor: "eBay", link: "https://www.ebay.com/sch/i.html?_nkw=5WP33504", price: 250.00, priceDate: "2026-07-20", status: "Conditional", notes: "White-solenoid XC90 V8 version. Estimate $100–400 used." },
];

export interface BudgetBucket { label: string; min: number; max: number }
export const BUDGET: BudgetBucket[] = [
  { label: "Clutch package + hardware + P1 CSC + Haldex service", min: 1318.63, max: 1318.63 },
  { label: "Bench service (angle gear, seals, boots, drain mod)", min: 330, max: 850 },
  { label: "Gen 3 DEM", min: 100, max: 400 },
  { label: "Fluids + consumables + spacer/hardware", min: 210, max: 350 },
  { label: "Conditional mounts (square mount, Elevate insert, fogging oil)", min: 0, max: 215 },
];
export const RESALE = { min: 500, max: 1050, note: "C30 FWD trans/parts + donor Gen 2 DEM + P2 CSC + round mount. Mothballed donor engine is additional upside." };

export interface TorqueSpec { fastener: string; spec: string }
export const TORQUE_SPECS: TorqueSpec[] = [
  { fastener: "Flywheel to crank", spec: "45 Nm + Loctite 271, then +65° (new TTY bolts)" },
  { fastener: "Pressure plate to flywheel", spec: "25 Nm (18 ft-lb), cross-pattern" },
  { fastener: "Bellhousing to engine", spec: "50 Nm (37 ft-lb)" },
  { fastener: "CSC mounting bolts", spec: "10 Nm (even tightening)" },
  { fastener: "Clutch bleeder nipple", spec: "5 Nm" },
  { fastener: "Exhaust manifold nuts", spec: "24 Nm (18 ft-lb), star pattern, retorque after heat cycle" },
  { fastener: "Dogbone / torque arm center bolt", spec: "60 ft-lb — FIRST in alignment sequence" },
  { fastener: "Torque arm bracket bolts", spec: "45 ft-lb" },
  { fastener: "Front/rear subframe bolts", spec: "120 Nm (89 ft-lb); AWD front bolts differ — verify in VIDA" },
  { fastener: "Driveshaft flange bolts", spec: "~40–50 Nm cross-pattern (verify in VIDA)" },
  { fastener: "Axle bolts 30670602", spec: "TTY — per VIDA, new bolts" },
  { fastener: "Wheel lugs", spec: "⚠ 110 vs 140 Nm discrepancy — verify in VIDA" },
];

export interface VerifyItem { id: string; text: string }
export const VERIFY_ITEMS: VerifyItem[] = [
  { id: "v1", text: "IPD kit 141522 stud count — photo shows 10; count against the head physically" },
  { id: "v2", text: "Downpipe flange face — flat → 8642449; machined ridge → 30677190" },
  { id: "v3", text: "M66 diff output splines — square-edged required before new collar sleeve" },
  { id: "v4", text: "Propshaft front CV joint — buy 31216175 only if play / dry grease" },
  { id: "v5", text: "Turbo bolt circle — confirm ~76mm (hole spacing ÷ sin 60°) before cutting spacers" },
  { id: "v6", text: "Square trans mount condition — 20-yr-old donor rubber; confirm donor M66 has early-style bracket" },
  { id: "v7", text: "Elevate torque mount insert — inspect for wear/deformation" },
  { id: "v8", text: "DEM hardware P/N in VIDA — confirms 80-bar vs 40-bar sensor expectation" },
  { id: "v9", text: "17\" wheel clearance for 320mm fronts" },
  { id: "v10", text: "Wheel lug torque — resolve 110/140 Nm discrepancy in VIDA" },
];

export const DO_NOT_ORDER: string[] = [
  "Clutch alignment tool — included in SO60S0KT",
  "Exhaust studs / copper crush washers — in IPD kit 141522",
  "Haldex pressure sensor — pulled from donor",
  "Exhaust manifold gaskets/studs/nuts — in IPD kit 141522",
  "Engine/trans mounts, torque arm — owned (square chosen; round is spare)",
  "CSC 31259889 (P2) — came in the kit; P1 31258380 is the order",
];
