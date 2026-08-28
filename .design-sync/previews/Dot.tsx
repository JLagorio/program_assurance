import { Dot } from "program-assurance";

export function Tones() {
  return (
    <div className="flex flex-col gap-2 text-[13px]">
      <span className="flex items-center gap-2">
        <Dot tone="success" /> Control satisfied
      </span>
      <span className="flex items-center gap-2">
        <Dot tone="warning" /> Evidence expiring
      </span>
      <span className="flex items-center gap-2">
        <Dot tone="danger" /> POA&M overdue
      </span>
      <span className="flex items-center gap-2">
        <Dot tone="info" /> Inherited from platform
      </span>
      <span className="flex items-center gap-2">
        <Dot tone="neutral" /> Not assessed
      </span>
    </div>
  );
}

export function InlineUse() {
  return (
    <div className="flex items-center gap-4 text-[13px]">
      <span className="flex items-center gap-1.5">
        <Dot tone="success" /> 42 passing
      </span>
      <span className="flex items-center gap-1.5">
        <Dot tone="danger" /> 3 failing
      </span>
      <span className="flex items-center gap-1.5">
        <Dot tone="neutral" /> 11 pending
      </span>
    </div>
  );
}
