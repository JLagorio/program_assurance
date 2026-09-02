import { Card, Dot, Table, Td, Th, Tr } from "program-assurance";

export function Rows() {
  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>POA&M item</Th>
            <Th>Severity</Th>
            <Th>Due</Th>
          </tr>
        </thead>
        <tbody>
          <Tr>
            <Td>
              <span className="flex items-center gap-2">
                <Dot tone="danger" /> Patch backlog on web tier
              </span>
            </Td>
            <Td>High</Td>
            <Td>Feb 02, 2026</Td>
          </Tr>
          <Tr>
            <Td>
              <span className="flex items-center gap-2">
                <Dot tone="warning" /> MFA rollout for service desk
              </span>
            </Td>
            <Td>Moderate</Td>
            <Td>Mar 20, 2026</Td>
          </Tr>
          <Tr>
            <Td>
              <span className="flex items-center gap-2">
                <Dot tone="success" /> Session lock timeout
              </span>
            </Td>
            <Td>Low</Td>
            <Td>Closed</Td>
          </Tr>
        </tbody>
      </Table>
    </Card>
  );
}
