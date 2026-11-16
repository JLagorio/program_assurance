import { Button, Fact, PageHeader, type PageHeaderStandingDate } from "../src/index";

// The action slot has four forms and no others: one of advance, sign and waitingOn, or none.
const act = () => {};
const advance = { label: "Add evidence", reason: "REQ-064 cites none", onAction: act };
const sign = { label: "Approve security plan", signer: "R. Calloway", role: "AO", onSign: act };
const waitingOn = { name: "R. Calloway", since: "2026-11-08" };

export const forms = (
  <>
    <PageHeader.Slot advance={advance} />
    <PageHeader.Slot advance={{ ...advance, onAction: undefined, link: <a href="#evidence" /> }} />
    <PageHeader.Slot sign={sign} />
    <PageHeader.Slot waitingOn={{ ...waitingOn, onRemind: act }} />
    <PageHeader.Slot more={{ label: "More control actions", items: null }} />
    <PageHeader.Slot />
    {/* @ts-expect-error Two forms at once is not a form. */}
    <PageHeader.Slot advance={advance} sign={sign} />
    {/* @ts-expect-error Waiting and advancing at once is not a form either. */}
    <PageHeader.Slot advance={advance} waitingOn={waitingOn} />
    {/* @ts-expect-error An advance runs an act or leads to a destination. */}
    <PageHeader.Slot advance={{ label: "Add evidence", reason: "REQ-064 cites none" }} />
    {/* @ts-expect-error A sign names its signer. */}
    <PageHeader.Slot sign={{ label: "Approve", role: "AO", onSign: act }} />
  </>
);

// The standing is one fact of the facts line: status words in a tone, and at most one date.
const late: PageHeaderStandingDate = { value: "2026-10-12", name: "PDR" };
export const standing = (
  <PageHeader.Facts>
    <Fact label="Categorization">High · High · Moderate</Fact>
    <PageHeader.Standing label="Authorization" status="ATO with conditions" tone="warning" />
    <PageHeader.Standing label="Authorization" status="ATO" tone="success" date={late} />
    <PageHeader.Standing
      label="Authorization"
      status="ATO"
      date={{ value: "2029-09-17", kind: "expiry", soonWithin: 90 }}
    />
    <PageHeader.Standing label="Authorization" isLoading />
    {/* @ts-expect-error A standing is named for assistive technology. */}
    <PageHeader.Standing status="ATO" />
    {/* @ts-expect-error A standing is a few words, never a figure out of a total. */}
    <PageHeader.Standing label="Controls" beats={[{ value: 42, total: 61 }]} />
    {/* @ts-expect-error A standing has one date. */}
    <PageHeader.Standing label="Authorization" status="ATO" date={[late, late]} />
  </PageHeader.Facts>
);

// A sign Button takes its signer; the size and the look are its own.
export const signs = (
  <>
    <Button intent="sign" signer="R. Calloway">
      Approve security plan
    </Button>
    <Button size="large" variant="primary">
      Add evidence
    </Button>
  </>
);
