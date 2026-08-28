import { Badge, Card, Mono, Table, Td, Th, Tr } from "program-assurance";

export function Cells() {
  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Evidence</Th>
            <Th>Control</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          <Tr>
            <Td>Quarterly account review export — Active Directory, all privileged accounts, signed by ISSO</Td>
            <Td>
              <Mono>AC-2(3)</Mono>
            </Td>
            <Td>
              <Badge tone="success">Accepted</Badge>
            </Td>
          </Tr>
          <Tr>
            <Td>SIEM forwarding config</Td>
            <Td>
              <Mono>AU-6</Mono>
            </Td>
            <Td>
              <Badge tone="warning">Pending review</Badge>
            </Td>
          </Tr>
        </tbody>
      </Table>
    </Card>
  );
}
