import { InheritChip, Mono } from "program-assurance";
import { systemComponents } from "@/lib/reusable-components";

const idp = systemComponents[0]!;
const landingZone = systemComponents[1]!;

export function Inherited() {
  return (
    <div className="flex flex-col gap-2" style={{ maxWidth: 460 }}>
      <div className="flex items-center gap-2 text-[13px]">
        <Mono>IA-2</Mono>
        <span className="flex-1 truncate">Identification and authentication (users)</span>
        <InheritChip component={idp} />
      </div>
      <div className="flex items-center gap-2 text-[13px]">
        <Mono>SC-7</Mono>
        <span className="flex-1 truncate">Boundary protection</span>
        <InheritChip component={landingZone} />
      </div>
    </div>
  );
}

export function Stale() {
  return (
    <div className="flex items-center gap-2 text-[13px]" style={{ maxWidth: 460 }}>
      <Mono>AC-7</Mono>
      <span className="flex-1 truncate">Unsuccessful logon attempts</span>
      <InheritChip component={idp} stale />
    </div>
  );
}
