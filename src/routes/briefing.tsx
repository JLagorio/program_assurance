import { createFileRoute } from "@tanstack/react-router";

import { BriefingRoom } from "@/components/app/authorization";
import { Badge, Button, Id, Inline, Stack } from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { authorization } from "@/lib/authorization";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "ATO briefing room — Equinox GRC" },
      {
        name: "description",
        content:
          "Authorizing Official briefing room: residual risk posture, risk acceptance sign-off and issuance of the authorization memo.",
      },
      { property: "og:title", content: "ATO briefing room — Equinox GRC" },
      {
        property: "og:description",
        content:
          "Residual risk posture and authorization decision workspace for the Authorizing Official.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BriefingPage,
});

function BriefingPage() {
  return (
    <Shell>
      <Stack className="animate-rise" space="space.250">
        <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
          <div className="min-w-0">
            <Inline className="min-w-0" space="space.100" alignBlock="center" shouldWrap>
              <h1 className="truncate font-heading-small font-semibold">ATO briefing room</h1>
              <Badge tone="warning">{authorization.decision}</Badge>
              <Inline
                className="min-w-0 font-body-small text-subtle"
                as="span"
                space="space.100"
                alignBlock="center"
              >
                <Id>PRG-1041</Id>
                <span className="text-subtlest">·</span>
                <span className="truncate">Trident UUV C2</span>
                <span className="text-subtlest">·</span>
                <span>Briefing {authorization.briefing}</span>
              </Inline>
            </Inline>
          </div>
          <Inline space="space.100" alignBlock="center">
            <Button variant="secondary">Export briefing deck</Button>
          </Inline>
        </Inline>

        <BriefingRoom />
      </Stack>
    </Shell>
  );
}
