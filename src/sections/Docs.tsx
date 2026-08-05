import { useState } from "react";
import { BookOpen, ChevronRight, FileText, Wrench, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const SECTIONS: DocSection[] = [
  {
    id: "welcome",
    title: "Welcome",
    icon: BookOpen,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          This documentation hub is designed to pair with project guides, workshop manuals, and build notes.
        </p>
        <p>
          Use the sections below to organize procedures, safety notes, part references, and troubleshooting tips. Content can be synced from another project repository or edited in-place.
        </p>
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-orange-300">
          <strong className="text-orange-200">Tip:</strong> Click any section heading to expand it. This layout is ready to accept Markdown-rendered content from a paired documentation source.
        </div>
      </div>
    ),
  },
  {
    id: "procedures",
    title: "Procedures",
    icon: FileText,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Step-by-step instructions for common tasks will appear here.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Pre-build checklist</li>
          <li>Phase transition procedures</li>
          <li>Part verification workflow</li>
          <li>Budget reconciliation</li>
        </ul>
      </div>
    ),
  },
  {
    id: "safety",
    title: "Safety Notes",
    icon: AlertTriangle,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Important safety reminders and hazard warnings for the build.</p>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-300">
          <strong className="text-red-200">Always</strong> support the vehicle on rated jack stands before working underneath. Never rely on a jack alone.
        </div>
      </div>
    ),
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: HelpCircle,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Common issues and their resolutions.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fitment conflicts — check part numbers against donor VIN</li>
          <li>Budget overruns — review contingency allocation</li>
          <li>Timeline slips — reassess phase dependencies</li>
        </ul>
      </div>
    ),
  },
  {
    id: "completion",
    title: "Completion Checklist",
    icon: CheckCircle,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Final checks before signing off a phase or the entire build.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>All parts installed and torqued to spec</li>
          <li>Fluids filled and checked</li>
          <li>Test drive completed</li>
          <li>Documentation updated</li>
        </ul>
      </div>
    ),
  },
];

export default function Docs() {
  const [open, setOpen] = useState<Set<string>>(new Set(["welcome"]));

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
        <h2 className="text-sm font-semibold">Documentation</h2>
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
                <div className="px-4 pb-4 pt-1 border-t">
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
