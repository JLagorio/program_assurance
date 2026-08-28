import { createFileRoute } from "@tanstack/react-router";

import { BriefingRoom } from "@/components/app/authorization";
import { Shell } from "@/components/app/shell";
import { Badge, Button, Mono } from "@/components/app/ui";
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
      <div className="animate-slide-up space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <h1 className="truncate text-[19px] font-semibold tracking-[-0.02em]">
                ATO briefing room
              </h1>
              <Badge tone="warning">{authorization.decision}</Badge>
              <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-muted-foreground">
                <Mono>PRG-1041</Mono>
                <span className="text-border">·</span>
                <span className="truncate">Trident UUV C2</span>
                <span className="text-border">·</span>
                <span>Briefing {authorization.briefing}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary">Export briefing deck</Button>
          </div>
        </div>

        <BriefingRoom />
      </div>
    </Shell>
  );
}
