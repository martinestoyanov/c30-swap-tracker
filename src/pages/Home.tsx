import { useState } from "react";
import Overview from "@/sections/Overview";
import AuthButton from "@/components/AuthButton";
import Phases from "@/sections/Phases";
import Parts from "@/sections/Parts";
import Budget from "@/sections/Budget";
import Docs from "@/sections/Docs";
import { LayoutDashboard, ListChecks, ShoppingCart, Wallet, BookOpen, Wrench, Cloud, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { SYNC_ENABLED } from "@/lib/store";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, el: <Overview /> },
  { id: "phases", label: "Phases", icon: ListChecks, el: <Phases /> },
  { id: "parts", label: "Parts", icon: ShoppingCart, el: <Parts /> },
  { id: "budget", label: "Budget", icon: Wallet, el: <Budget /> },
  { id: "docs", label: "Docs", icon: BookOpen, el: <Docs /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("overview");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-2.5">
          <Wrench className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-semibold leading-tight truncate">C30 AWD Swap — Build Tracker</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">2011 Volvo C30 · donor 2005 S40 AWD M66 · Rev 2, Aug 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
            {SYNC_ENABLED ? (
              <span className="hidden xs:flex items-center gap-1"><Cloud className="h-3.5 w-3.5 text-emerald-600" /> Synced</span>
            ) : (
              <span className="flex items-center gap-1"><HardDrive className="h-3.5 w-3.5" /> Local only</span>
            )}
            <AuthButton />
          </div>
        </div>
        {/* Desktop tab bar */}
        <nav className="hidden sm:block border-t">
          <div className="mx-auto max-w-3xl px-4 flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors",
                  tab === t.id
                    ? "border-orange-500 font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-4 pb-24 sm:pb-10">{active.el}</main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="grid grid-cols-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); window.scrollTo({ top: 0 }); }}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                tab === t.id ? "text-orange-500 font-medium" : "text-muted-foreground"
              )}
            >
              <t.icon className="h-5 w-5" />{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
