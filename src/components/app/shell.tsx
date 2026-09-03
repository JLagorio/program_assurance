import { Link, useRouterState } from "@tanstack/react-router";
import {
  Archive,
  Bell,
  Boxes,
  Bug,
  CircleHelp,
  ClipboardList,
  Command as CommandIcon,
  FileCheck2,
  FlaskConical,
  Gauge,
  Gavel,
  Library,
  Package as PackageIcon,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkle,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  Avatar,
  Badge,
  IconButton,
  Inline,
  Input,
  InputGroup,
  Shell as DsShell,
  Tooltip,
} from "@ledger/design-system";

/**
 * The product's frame, composed from the package's Shell parts. The sidebar holds objects and
 * queues; it never holds phases, because a phase is a state of a program, reached by opening it.
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
      { label: "Providers", to: "/library/components", icon: Library },
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

const topBarActions = [
  [CircleHelp, "Help and shortcuts"],
  [Bell, "Notifications"],
  [Settings, "Settings"],
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <DsShell
      sidebar={
        <DsShell.Sidebar
          brand={
            <DsShell.Brand
              mark={<DsShell.Mark />}
              name="Equinox"
              detail="Northwind Corp"
              onClick={() => undefined}
            />
          }
          footer={
            <DsShell.User
              avatar={<Avatar name="Sarah Chen" size="small" />}
              name="Sarah Chen"
              role="Compliance lead"
              onClick={() => undefined}
            />
          }
        >
          {navGroups.map((group) => (
            <DsShell.NavGroup key={group.label} label={group.label}>
              {group.items.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <DsShell.NavItem
                    key={item.label}
                    asChild
                    icon={item.icon}
                    isActive={active}
                    badge={item.badge}
                  >
                    <Link to={item.to}>{item.label}</Link>
                  </DsShell.NavItem>
                );
              })}
            </DsShell.NavGroup>
          ))}
        </DsShell.Sidebar>
      }
      topBar={
        <DsShell.TopBar
          actions={
            <>
              <Badge tone="warning" className="hidden sm:inline-flex">
                Audit window open
              </Badge>
              {topBarActions.map(([Icon, label]) => (
                <Tooltip key={label} content={label}>
                  <IconButton label={label} variant="subtle">
                    <Icon className="size-icon-medium" />
                  </IconButton>
                </Tooltip>
              ))}
            </>
          }
        >
          <InputGroup
            leading={<Search />}
            trailing={
              <Inline
                className="pointer-events-none"
                as="span"
                space="space.025"
                alignBlock="center"
              >
                <CommandIcon className="size-100" />K
              </Inline>
            }
            width={420}
          >
            <Input
              type="search"
              placeholder="Search risks, controls, evidence…"
              aria-label="Search"
              className="h-control-small"
            />
          </InputGroup>
        </DsShell.TopBar>
      }
    >
      {children}
    </DsShell>
  );
}
