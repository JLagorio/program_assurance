import { Meter } from "program-assurance";

export function Tones() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3 text-[12px]">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span>Controls implemented</span>
          <span className="tnum">82%</span>
        </div>
        <Meter value={82} tone="info" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span>Evidence current</span>
          <span className="tnum">96%</span>
        </div>
        <Meter value={96} tone="success" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span>STIG findings closed</span>
          <span className="tnum">54%</span>
        </div>
        <Meter value={54} tone="warning" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span>POA&M on schedule</span>
          <span className="tnum">23%</span>
        </div>
        <Meter value={23} tone="danger" />
      </div>
    </div>
  );
}

export function Neutral() {
  return (
    <div className="w-full max-w-md">
      <Meter value={40} tone="neutral" />
    </div>
  );
}
