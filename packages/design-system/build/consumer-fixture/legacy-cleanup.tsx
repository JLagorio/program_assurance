import { createRef } from "react";
import * as kit from "@ledger/design-system";

const density: kit.Density = "compact";
<kit.Table density={density} ref={createRef<HTMLTableElement>()} />;
<kit.Stat.Grid>
  <kit.Stat.Tile label="Records" value={3} />
</kit.Stat.Grid>;
<kit.RecordHeader
  title="Record"
  crumbs={<kit.BreadcrumbItem>Parent</kit.BreadcrumbItem>}
  id="REC-1"
/>;
<kit.Related title="Records">
  <kit.Item title="Record" />
</kit.Related>;
<kit.Related.Card
  title="Record"
  link={<a href="/record" ref={createRef<HTMLAnchorElement>()} />}
/>;
<kit.Timeline.Item title="Event" link={<a href="/event" ref={createRef<HTMLAnchorElement>()} />} />;
<kit.PreviewSheet
  open
  onClose={() => {}}
  title="Record"
  id="REC-1"
  openTo={<a href="/record" ref={createRef<HTMLAnchorElement>()} />}
>
  Details
</kit.PreviewSheet>;

// @ts-expect-error Global density is removed; use Table or DataTable view density.
kit.DensityProvider;
// @ts-expect-error Global density is removed.
kit.DensitySwitch;
// @ts-expect-error Global density is removed.
kit.useDensity;
// @ts-expect-error Global density storage is removed.
kit.DENSITY_STORAGE_KEY;
// @ts-expect-error Global density storage is removed.
kit.readDensity;
// @ts-expect-error Global density storage is removed.
kit.writeDensity;
// @ts-expect-error Global density effects are removed.
kit.applyDensity;
// @ts-expect-error Global density scripts are removed.
kit.densityScript;
// @ts-expect-error Global density scripts are removed.
kit.densityScriptFor;
// @ts-expect-error Use Stat.Grid.
kit.Tiles;
// @ts-expect-error Use Item.
kit.Related.Row;
// @ts-expect-error Use ItemProps.
export type RemovedRow = kit.RelatedRowProps;
// @ts-expect-error Put details in the page rail.
<kit.RecordHeader title="Record" facts="Owner" />;
// @ts-expect-error Parent items belong in crumbs.
<kit.RecordHeader title="Record" breadcrumb="Parent" />;
// @ts-expect-error Navigate through the parent crumbs.
<kit.RecordHeader title="Record" back="Back" />;
// @ts-expect-error The list determines each step's position.
<kit.Stepper.Item state="done" label="Start" first />;
// @ts-expect-error The list determines each step's position.
<kit.Stepper.Item state="upcoming" label="Finish" last />;
// @ts-expect-error Parent items belong in crumbs.
<kit.ActionBar id="REC-1" title="Record" states={[]} breadcrumb="Parent" />;

// @ts-expect-error Forms use TanStack directly; the legacy validation hook is removed.
kit.useRequired;
