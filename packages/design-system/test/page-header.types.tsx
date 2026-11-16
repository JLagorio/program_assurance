import { Button, PageHeader, type PageHeaderStandingBeat } from "../src/index";

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

// The standing is one beat or two, never three.
const beat: PageHeaderStandingBeat = { value: 42, total: 61, label: "satisfied" };
export const standing = (
  <>
    <PageHeader.Standing beats={[beat]} />
    <PageHeader.Standing beats={[beat, { value: 2, label: "to review", tone: "warning" }]} />
    {/* @ts-expect-error Three beats is not a headline. */}
    <PageHeader.Standing beats={[beat, beat, beat]} />
    {/* @ts-expect-error A standing has a beat. */}
    <PageHeader.Standing beats={[]} />
  </>
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
