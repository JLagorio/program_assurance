import { UnavailableAction } from "@/components/app/unavailable-action";
import { createFileRoute } from "@tanstack/react-router";

import { BriefingRoom } from "@/components/app/authorization";
import { authorization } from "@/lib/authorization";
import { Badge, Id, Inline, PageHeader, Stack } from "@ledger/design-system";

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
    <Stack className="animate-rise" space="space.250">
      <PageHeader>
        <PageHeader.Title>ATO briefing room</PageHeader.Title>
        <PageHeader.Actions>
          <UnavailableAction
            reason="Presentation export is not available. Review the briefing on this page."
            variant="secondary"
          >
            Export briefing deck
          </UnavailableAction>
        </PageHeader.Actions>
        <Inline
          className="col-span-full font-body-small text-subtle"
          space="space.150"
          alignBlock="center"
          shouldWrap
        >
          <Badge variant="secondary" tone="warning">
            {authorization.decision}
          </Badge>
          <Id>PRG-1041</Id>
          <span>Trident UUV C2</span>
          <span>Briefing {authorization.briefing}</span>
        </Inline>
      </PageHeader>

      <BriefingRoom />
    </Stack>
  );
}
