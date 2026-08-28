import { Card, CardHeader, ProvidedControlsTable } from "program-assurance";
import { systemComponents } from "@/lib/reusable-components";

const idp = systemComponents[0]!;

export function Controls() {
  return (
    <Card>
      <CardHeader
        title="Provided controls"
        description="Controls this component satisfies for consuming programs."
      />
      <ProvidedControlsTable component={idp} />
    </Card>
  );
}
