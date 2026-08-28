import { Card, Skeleton } from "program-assurance";

export function Loading() {
  return (
    <Card style={{ maxWidth: 480 }}>
      <div className="border-b border-border px-4 py-3">
        <Skeleton style={{ width: 160, height: 14 }} />
        <Skeleton className="mt-2" style={{ width: 240, height: 11 }} />
      </div>
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton style={{ width: 56, height: 12 }} />
          <Skeleton style={{ width: 220, height: 12 }} />
          <Skeleton style={{ width: 72, height: 18, borderRadius: 5 }} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton style={{ width: 56, height: 12 }} />
          <Skeleton style={{ width: 180, height: 12 }} />
          <Skeleton style={{ width: 72, height: 18, borderRadius: 5 }} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton style={{ width: 56, height: 12 }} />
          <Skeleton style={{ width: 200, height: 12 }} />
          <Skeleton style={{ width: 72, height: 18, borderRadius: 5 }} />
        </div>
      </div>
    </Card>
  );
}

export function Rows() {
  return (
    <div className="space-y-2" style={{ maxWidth: 360 }}>
      <Skeleton style={{ width: "100%", height: 12 }} />
      <Skeleton style={{ width: "83%", height: 12 }} />
      <Skeleton style={{ width: "91%", height: 12 }} />
    </div>
  );
}
