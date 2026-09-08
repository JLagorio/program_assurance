/**
 * Prototype-only: act as another role. The floating devtools toggle pattern
 * (React Query and TanStack Router devtools), placed bottom-left above the
 * sidebar's user chip: bottom-right is where wizard and sheet footers put
 * their primary action, and a switch there steals the click. Deleted in one
 * line before anything ships, so it stays out of the kit on purpose; what it
 * is made of (Button, Avatar, Popover, NativeSelect, Text) is all kit. Every
 * gated action reads `currentSession()`, so switching here is enough to see
 * separation of duty from each side.
 */

import {
  Box,
  Avatar,
  Button,
  NativeSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
} from "@ledger/design-system";

import { currentSession, roles, setSession, useWorkVersion, type Role } from "@/lib/control-work";

export function PersonaSwitch() {
  useWorkVersion();
  const session = currentSession();
  return (
    <div className="fixed left-200 z-40" style={{ bottom: 76 }}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="secondary"
              aria-label="Switch user"
              title={`Acting as ${session.name} · ${session.role}`}
              className="rounded-full ps-050 shadow-overlay"
            >
              <Avatar name={session.name} size="small" />
              <Box as="span" style={{ maxWidth: 180 }}>
                <Text size="small" color="color.text.subtle" maxLines={1} className="block">
                  {session.role}
                </Text>
              </Box>
            </Button>
          }
        />
        <PopoverContent aria-label="Switch user" side="top" align="start" style={{ width: 300 }}>
          <Stack space="space.100">
            <Text as="p" size="small" color="color.text.subtle">
              Prototype only. Changes the role every gated action checks. The name stays{" "}
              {session.name}.
            </Text>
            <NativeSelect
              aria-label="Role"
              value={session.role}
              onChange={(e) => setSession({ role: e.target.value as Role })}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Stack>
        </PopoverContent>
      </Popover>
    </div>
  );
}
