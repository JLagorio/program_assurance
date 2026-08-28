import { FilterChip } from "program-assurance";

export function Bar() {
  return (
    <div className="flex items-center gap-2">
      <FilterChip label="Status" value="Open" active />
      <FilterChip label="Severity" value="High" active />
      <FilterChip label="Owner" />
      <FilterChip label="Control family" />
    </div>
  );
}

export function States() {
  return (
    <div className="flex items-center gap-2">
      <FilterChip label="Program" value="GovCloud Payroll" active />
      <FilterChip label="Add filter" />
    </div>
  );
}
