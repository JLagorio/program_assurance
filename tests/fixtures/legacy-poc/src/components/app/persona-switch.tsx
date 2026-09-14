import {
  avatarHue,
  AvatarFallback,
  avatarInitials,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Avatar,
  Box,
  Button,
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
  const roleItems = roles.map((r) => ({ value: r, label: r }));
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
              <Avatar
                size="small"
                role="img"
                aria-label={session.name}
                hue={avatarHue(session.name)}
                title={session.name}
              >
                <AvatarFallback>{avatarInitials(session.name, 2)}</AvatarFallback>
              </Avatar>
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
            <Select<string>
              items={roleItems}
              value={session.role}
              onValueChange={(value) => {
                if (value === null) return;
                return setSession({ role: value as Role });
              }}
            >
              <SelectTrigger className="w-full" aria-label="Role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>
        </PopoverContent>
      </Popover>
    </div>
  );
}
