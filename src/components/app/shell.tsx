import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Archive,
  Boxes,
  Bug,
  Library,
  ClipboardList,
  ChevronDown,
  CircleHelp,
  FileCheck2,
  FlaskConical,
  Gauge,
  Gavel,
  Command as CommandIcon,
  Package as PackageIcon,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkle,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The sidebar holds objects and queues. It never holds phases — a phase is a
 * state of a program, reached by opening that program.
 */
const navGroups: {
  label: string;
  items: { label: string; to: string; icon: typeof Gauge; badge?: string }[];
}[] = [
  {
    label: "Work",
    items: [
      { label: "My queue", to: "/scope", icon: ShieldCheck, badge: "1" },
      { label: "Programs", to: "/programs", icon: ClipboardList },
      { label: "Test campaigns", to: "/campaigns", icon: FlaskConical },
      { label: "Portfolio", to: "/", icon: Gauge },
    ],
  },
  {
    label: "Risk",
    items: [
      { label: "Findings & assets", to: "/findings", icon: Bug, badge: "7" },
      { label: "POA&M & risk", to: "/register", icon: ShieldAlert, badge: "4" },
      { label: "Packages", to: "/packages", icon: PackageIcon },
      { label: "Authorization decisions", to: "/briefing", icon: Gavel },
    ],
  },
  {
    label: "Libraries",
    items: [
      { label: "Control catalog", to: "/controls", icon: FileCheck2 },
      { label: "STIG & SRG library", to: "/stigs", icon: Boxes },
      { label: "Components", to: "/library/components", icon: Library },
      { label: "Evidence", to: "/evidence", icon: Archive },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Supply chain", to: "/vendors", icon: Users },
      { label: "Design system", to: "/components", icon: Sparkle },
    ],
  },
];


function Logo() {
  return (
    <span className="flex size-6 items-center justify-center rounded-[6px] bg-primary shadow-button-primary">
      <span className="block size-2 rounded-[2px] bg-primary-foreground/95" />
    </span>
  );
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Logo />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-semibold tracking-[-0.01em]">Equinox</div>
          <div className="truncate text-[12px] text-muted-foreground">Northwind Corp</div>
        </div>
        <ChevronDown className="ml-auto size-3.5 text-muted-foreground" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
              {group.label}
            </div>
            <div className="space-y-px">
              {group.items.map((item) => {
                const active =
                  item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={cn(
                      "group flex h-7 items-center gap-2 rounded-[6px] px-2.5 text-[13px] transition-colors",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-3.5 shrink-0",
                        active ? "text-primary" : "text-muted-foreground/80",
                      )}
                      strokeWidth={2}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="tnum ml-auto rounded bg-danger-soft px-1 text-[11px] font-medium text-danger">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-2.5">
        <button className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left transition-colors hover:bg-muted">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
            SC
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium">Sarah Chen</span>
            <span className="block truncate text-[12px] text-muted-foreground">
              Compliance lead
            </span>
          </span>
          <ChevronDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/70 lg:px-6">
      <div className="relative w-full max-w-[420px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search risks, controls, evidence…"
          aria-label="Search"
          className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-14 text-[13px] placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-muted px-1 text-[11px] text-muted-foreground">
          <CommandIcon className="size-2.5" />K
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <span className="mr-2 hidden items-center gap-1.5 rounded-md bg-warning-soft px-2 py-1 text-[12px] font-medium text-warning ring-1 ring-inset ring-warning/25 sm:inline-flex">
          Audit window open
        </span>
        {[CircleHelp, Bell, Settings].map((Icon, i) => (
          <button
            key={i}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4" strokeWidth={1.9} />
          </button>
        ))}
      </div>
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
