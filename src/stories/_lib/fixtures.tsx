import type { Decorator } from "@storybook/react-vite";

import { Button } from "@/ds/primitives";
import { Card, PageHeader } from "@/ds/patterns";

/* Shared fixture data for stories. Names and records recur across the kit so
   the sidebar reads as one product, not a pile of lorem. */

export const people = ["D. Reyes", "K. Lund", "M. Okafor", "S. Chen", "A. Whitfield", "J. Park"];

export const evidence = [
  { id: "EV-0412", title: "IdP account lifecycle policy", kind: "Policy", age: "3d" },
  { id: "EV-0418", title: "Weekly account review export", kind: "Export", age: "6d" },
  { id: "EV-0421", title: "Inactive-account job run log", kind: "Log", age: "1d" },
  { id: "EV-0377", title: "Access review sign-off, Q2", kind: "Attestation", age: "71d" },
  { id: "EV-0402", title: "Jump host local-accounts screenshot", kind: "Screenshot", age: "34d" },
];

/** Page content behind an overlay so the scrim and blur have something to sit on. */
export const behindPage: Decorator = (Story) => (
  <>
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="PKG-2026-114"
        title="Northwind payroll · Authorization package"
        description="340 controls, 7 open findings. Ready for the authorizing official."
        actions={<Button variant="primary">Submit package</Button>}
      />
      <Card>
        <Card.Header title="Open findings" description="Across 5 controls" />
        <div className="h-[220px]" />
      </Card>
    </div>
    <Story />
  </>
);
