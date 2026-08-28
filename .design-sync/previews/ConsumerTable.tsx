import { Card, CardHeader, ConsumerTable } from "program-assurance";
import { systemComponents } from "@/lib/reusable-components";

const idp = systemComponents[0]!;

export function Consumers() {
  return (
    <Card>
      <CardHeader
        title="Consuming programs"
        description={`${idp.consumers.length} programs inherit from ${idp.name}`}
      />
      <ConsumerTable component={idp} />
    </Card>
  );
}
