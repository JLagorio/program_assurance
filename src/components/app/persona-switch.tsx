/**
 * Prototype-only: act as another role. The floating devtools toggle pattern
 * (React Query and TanStack Router devtools), placed bottom-left above the
 * sidebar's user chip: bottom-right is where wizard and sheet footers put their
 * primary action, and a switch there steals the click. Deleted in one line. Every gated action reads `currentSession()`, so switching here is
 * enough to see separation of duty from each side.
 */

import { Avatar, NativeSelect, Popover } from "@ledger/design-system";

import { currentSession, roles, setSession, useWorkVersion, type Role } from "@/lib/control-work";

export function PersonaSwitch() {
  useWorkVersion();
  const session = currentSession();
  return (
    <div className="fixed left-200 z-40" style={{ bottom: 76 }}>
      <Popover
        side="top"
        align="start"
        width={300}
        trigger={
          <button
            type="button"
            aria-label="Switch user"
            title={`Acting as ${session.name} · ${session.role}`}
            className="flex h-500 items-center gap-100 rounded-full border border-default bg-surface pl-050 pr-150 font-body-small text-subtle hover:bg-neutral-subtle-hovered"
            style={{ boxShadow: "0 6px 20px rgba(9, 30, 66, 0.18)" }}
          >
            <Avatar name={session.name} size="small" />
            <span className="truncate" style={{ maxWidth: 180 }}>
              {session.role}
            </span>
          </button>
        }
      >
        <div className="space-y-100 p-050">
          <p className="font-body-small text-subtle">
            Prototype only. Changes the role every gated action checks. The name stays{" "}
            {session.name}.
          </p>
          <NativeSelect
            aria-label="Role"
            value={session.role}
            onChange={(e) => setSession({ role: e.target.value as Role })}
          >
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </NativeSelect>
        </div>
      </Popover>
    </div>
  );
}
