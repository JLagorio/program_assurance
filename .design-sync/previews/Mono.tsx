import { Mono } from "program-assurance";

export function Standalone() {
  return (
    <div className="flex flex-col gap-1.5">
      <Mono>AC-2(3)</Mono>
      <Mono>F-2031</Mono>
      <Mono>V-220912</Mono>
      <Mono>sha256:9f86d08...0f00a08</Mono>
    </div>
  );
}

export function Inline() {
  return (
    <div className="max-w-md text-[13px] text-muted-foreground">
      Finding <Mono>F-2031</Mono> maps to control <Mono>AU-6</Mono> and STIG rule{" "}
      <Mono>SV-230223r792832</Mono>; evidence uploaded to package <Mono>PKG-2026-014</Mono>.
    </div>
  );
}
