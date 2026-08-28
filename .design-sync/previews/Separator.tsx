import { Mono, Separator } from "program-assurance";

export function Horizontal() {
  return (
    <div style={{ maxWidth: 420 }}>
      <div className="text-[13px]">
        <div className="font-medium">Assessment scope</div>
        <p className="mt-0.5 text-muted-foreground">
          12 controls sampled from the Moderate baseline.
        </p>
      </div>
      <Separator className="my-3" />
      <div className="text-[13px]">
        <div className="font-medium">Evidence window</div>
        <p className="mt-0.5 text-muted-foreground">Artifacts accepted through Mar 31, 2026.</p>
      </div>
    </div>
  );
}

export function Vertical() {
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted-foreground" style={{ height: 20 }}>
      <span>GovCloud Payroll</span>
      <Separator orientation="vertical" />
      <span>Moderate baseline</span>
      <Separator orientation="vertical" />
      <span>Agency ATO</span>
      <Separator orientation="vertical" />
      <Mono>PKG-2026-114</Mono>
    </div>
  );
}
