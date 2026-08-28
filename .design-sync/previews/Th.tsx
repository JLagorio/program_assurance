import { Card, Table, Th } from "program-assurance";

export function Header() {
  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Control</Th>
            <Th>Title</Th>
            <Th>Assessed</Th>
            <Th className="text-right">Findings</Th>
          </tr>
        </thead>
      </Table>
    </Card>
  );
}
