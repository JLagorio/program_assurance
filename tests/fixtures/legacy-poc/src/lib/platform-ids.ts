import { platformSeed } from "@/lib/platform-seed";

/** Stable native identifiers for the supplied WS-X90 records. */
export const platformProgramId = "PRG-1090";
export const platformRootNodeId = "CN-109000";
export const platformRootScopeId = "SYS-1090";

export type PlatformSourceRecord = {
  datasetId: string;
  id: string;
  uuid?: string;
  /** Unmodified source data, including relationships not represented by a native field. */
  data: Record<string, unknown>;
};

export function platformSourceRecord(
  record: { id: string; uuid?: string } & Record<string, unknown>,
): PlatformSourceRecord {
  return {
    datasetId: platformSeed.dataset_metadata.dataset_id,
    id: record.id,
    ...(record.uuid ? { uuid: record.uuid } : {}),
    data: structuredClone(record),
  };
}

export const platformNodeIds = new Map<string, string>([
  [platformSeed.systems[0]!.id, platformRootNodeId],
  ...platformSeed.subsystems.map((item, index): [string, string] => [
    item.id,
    `CN-${109001 + index}`,
  ]),
  ...platformSeed.components.map((item, index): [string, string] => [
    item.id,
    `CN-${109101 + index}`,
  ]),
]);
export const platformScopeIds = new Map<string, string>([
  [platformSeed.systems[0]!.id, platformRootScopeId],
  ...platformSeed.subsystems.map((item, index): [string, string] => [
    item.id,
    `SYS-${1091 + index}`,
  ]),
  ...platformSeed.components.map((item, index): [string, string] => [
    item.id,
    `SYS-${109101 + index}`,
  ]),
]);
export const platformAssetIds = new Map<string, string>(
  platformSeed.components.map((item, index) => [item.id, `AST-${109001 + index}`]),
);

function requiredId(ids: ReadonlyMap<string, string>, sourceId: string, kind: string): string {
  const id = ids.get(sourceId);
  if (!id) throw new Error(`Unknown platform ${kind}: ${sourceId}`);
  return id;
}
export const platformNodeId = (sourceId: string) =>
  requiredId(platformNodeIds, sourceId, "element");
export const platformScopeId = (sourceId: string) =>
  requiredId(platformScopeIds, sourceId, "scope");
export const platformAssetId = (sourceId: string) =>
  requiredId(platformAssetIds, sourceId, "component");
