/**
 * Prototype-only: act as another role. This is the floating devtools toggle
 * pattern (React Query and TanStack Router devtools sit in the same corner),
 * chosen so it never reads as application chrome and can be deleted in one
 * line. Every gated action reads `currentSession()`, so switching here is
 * enough to see separation of duty from each side.
 */

import { Avatar, NativeSelect, Popover } from "@ledger/design-system";

import { currentSession, roles, setSession, useWorkVersion, type Role } from "@/lib/control-work";

export function PersonaSwitch() {
  useWorkVersion();
  const session = currentSession();
  return (
    <div className="fixed bottom-4 right-4 z-40 print:hidden">
      <Popover
        side="top"
        align="end"
        width={300}
        trigger={
          <button
            type="button"
            aria-label="Switch user"
            title={`Acting as ${session.name} · ${session.role}`}
            className="flex h-10 items-center gap-2 rounded-full border border-default bg-surface pl-1 pr-3 font-body-small text-subtle hover:bg-surface-hovered"
            style={{ boxShadow: "0 6px 20px rgba(9, 30, 66, 0.18)" }}
          >
            <Avatar name={session.name} size="small" />
            <span className="max-w-[180px] truncate">{session.role}</span>
          </button>
        }
      >
        <div className="space-y-2 p-1">
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
