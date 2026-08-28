import { RadioGroup, RadioGroupItem } from "program-assurance";

export function Methods() {
  return (
    <RadioGroup defaultValue="interview" className="space-y-1" style={{ maxWidth: 340 }}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="examine" id="m-examine" />
        <label htmlFor="m-examine" className="text-[13px]">
          Examine — review documentation and artifacts
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="interview" id="m-interview" />
        <label htmlFor="m-interview" className="text-[13px]">
          Interview — discuss with control owners
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="test" id="m-test" />
        <label htmlFor="m-test" className="text-[13px]">
          Test — exercise the mechanism directly
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="automated" id="m-automated" disabled />
        <label htmlFor="m-automated" className="text-[13px] text-muted-foreground">
          Automated — no collector connected
        </label>
      </div>
    </RadioGroup>
  );
}
