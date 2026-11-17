// The offer slot, on the Components register and on a component's record (Josef's decisions of
// 2026-11-15, "Offers · Reviewed in two places, one Accept", and 2026-11-16, "Slot · Role-true").
// What holds for this part alone:
//
// The header ends with the kit's `PageHeader.Slot` in PageHeader.Actions' place. While an offer
// of a program's result waits on a component's owner, a reader who may write (any member but a
// viewer, as `review_component_offer` allows) sees Review offer as the page's primary, why (how
// many offers wait) and whose (the component on the register, then the program that offered it):
// a link to the component's Findings tab at the offer that has waited longest
// (`/library/components/<the offer's component version>?tab=Findings&offer=<offer>`), where it is
// reviewed. A viewer sees whom it waits on, the component's owner, and since when. With no offer
// waiting the slot holds the record's other commands, or nothing. While the offers are read the
// slot draws nothing; a read that fails is the page's alert.

import { Link } from "@tanstack/react-router";
import { PageHeader, useLedgerLocale } from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import {
  componentOfferRead,
  type ComponentOfferRow,
  type ComponentOfferScope,
} from "@/lib/component-offers";
import { useServerRows } from "@/lib/server-table";
import { useMemo } from "react";
import { ReportFailures } from "./work-common";

type More = Parameters<typeof PageHeader.Slot>[0]["more"];

/** The question that finds the offers still waiting, the one that has waited longest first. */
const WAITING = {
  filters: [{ id: "state", value: ["offered"] }],
  sorting: [{ id: "offered_at", desc: false }],
  pageIndex: 0,
  pageSize: 1,
};

/**
 * The slot for the offers waiting on a component's owner: every component's on the register
 * (`scope` unsaid), or one component's across its versions on its record. `named` says the
 * component in the slot's detail, for the register, where the header names no component.
 */
export function ComponentOfferSlot({
  scope,
  named = false,
  more,
}: {
  scope?: ComponentOfferScope | undefined;
  named?: boolean | undefined;
  more?: More | undefined;
}) {
  const workspace = useWorkspace();
  const { formatPlural } = useLedgerLocale();
  const read = useMemo(() => componentOfferRead(scope ?? {}), [scope]);
  const offers = useServerRows<ComponentOfferRow>(read, WAITING);
  const page = offers.data;
  const offer = page?.rows[0];
  if (!page) return <ReportFailures queries={[offers]} />;
  if (!offer) return more ? <PageHeader.Slot more={more} /> : null;
  const from = offer.program_name || offer.program_code;
  if (workspace.role === "viewer")
    return (
      <PageHeader.Slot
        {...(offer.waiting_on_name
          ? {
              waitingOn: {
                name: offer.waiting_on_name,
                role: "component owner, to review an offer",
                since: offer.offered_at,
              },
            }
          : {})}
        more={more}
      />
    );
  return (
    <PageHeader.Slot
      advance={{
        label: "Review offer",
        reason: formatPlural(page.count, {
          one: "{count} offer waiting",
          other: "{count} offers waiting",
        }),
        detail: named ? `${offer.component_name} · from ${from}` : `from ${from}`,
        link: (
          <Link
            to="/library/components/$componentId"
            params={{ componentId: offer.defined_component_id }}
            search={{ tab: "Findings", offer: offer.id }}
          />
        ),
      }}
      more={more}
    />
  );
}
