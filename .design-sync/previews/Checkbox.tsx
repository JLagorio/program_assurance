import { Checkbox } from "program-assurance";

export function ControlFamilyFilter() {
  return (
    <div className="space-y-2" style={{ maxWidth: 320 }}>
      <div className="flex items-center gap-2">
        <Checkbox id="fam-ac" defaultChecked />
        <label htmlFor="fam-ac" className="text-[13px]">
          AC — Access Control
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="fam-au" defaultChecked />
        <label htmlFor="fam-au" className="text-[13px]">
          AU — Audit and Accountability
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="fam-cm" />
        <label htmlFor="fam-cm" className="text-[13px]">
          CM — Configuration Management
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="fam-ir" />
        <label htmlFor="fam-ir" className="text-[13px]">
          IR — Incident Response
        </label>
      </div>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="space-y-2" style={{ maxWidth: 320 }}>
      <div className="flex items-center gap-2">
        <Checkbox id="dis-on" defaultChecked disabled />
        <label htmlFor="dis-on" className="text-[13px] text-muted-foreground">
          Inherited from platform baseline
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="dis-off" disabled />
        <label htmlFor="dis-off" className="text-[13px] text-muted-foreground">
          Not applicable to this system
        </label>
      </div>
    </div>
  );
}
