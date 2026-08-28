import { Badge, Card, Mono, Table, Td, Th, Tr } from "program-assurance";

export function ControlsTable() {
  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Control</Th>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Owner</Th>
          </tr>
        </thead>
        <tbody>
          <Tr>
            <Td>
              <Mono>AC-2</Mono>
            </Td>
            <Td>Account Management</Td>
            <Td>
              <Badge tone="success">Satisfied</Badge>
            </Td>
            <Td>J. Rivera</Td>
          </Tr>
          <Tr>
            <Td>
              <Mono>AU-6</Mono>
            </Td>
            <Td>Audit Record Review, Analysis, and Reporting</Td>
            <Td>
              <Badge tone="warning">Partially satisfied</Badge>
            </Td>
            <Td>M. Chen</Td>
          </Tr>
          <Tr>
            <Td>
              <Mono>CM-6</Mono>
            </Td>
            <Td>Configuration Settings</Td>
            <Td>
              <Badge tone="danger">Other than satisfied</Badge>
            </Td>
            <Td>Unassigned</Td>
          </Tr>
          <Tr>
            <Td>
              <Mono>IR-4</Mono>
            </Td>
            <Td>Incident Handling</Td>
            <Td>
              <Badge tone="neutral">Not assessed</Badge>
            </Td>
            <Td>S. Okafor</Td>
          </Tr>
        </tbody>
      </Table>
    </Card>
  );
}
