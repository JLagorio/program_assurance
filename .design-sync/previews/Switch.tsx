import { Switch } from "program-assurance";

export function Settings() {
  return (
    <div className="space-y-3" style={{ maxWidth: 380 }}>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="sw-evidence" className="text-[13px]">
          Require evidence on closure
        </label>
        <Switch id="sw-evidence" defaultChecked />
      </div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="sw-autoassign" className="text-[13px]">
          Auto-assign findings to control owners
        </label>
        <Switch id="sw-autoassign" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="sw-notify" className="text-[13px]">
          Notify AO on POA&M due-date changes
        </label>
        <Switch id="sw-notify" defaultChecked />
      </div>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="space-y-3" style={{ maxWidth: 380 }}>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="sw-conmon" className="text-[13px] text-muted-foreground">
          Continuous monitoring feed (managed by platform)
        </label>
        <Switch id="sw-conmon" defaultChecked disabled />
      </div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="sw-legacy" className="text-[13px] text-muted-foreground">
          Legacy scanner import
        </label>
        <Switch id="sw-legacy" disabled />
      </div>
    </div>
  );
}
