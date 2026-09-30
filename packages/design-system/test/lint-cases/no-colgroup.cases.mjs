// ledger/no-colgroup: column widths go on Table.Header width, not in a colgroup.
import { kitImport } from "../lint-helpers.mjs";

export default {
  valid: [
    {
      code: `${kitImport("Table")} <Table><Table.Header width="medium">Name</Table.Header></Table>`,
    },
    { code: "<table><thead><tr><th>Name</th></tr></thead></table>" },
    // Another component that happens to be named for column groups is not the element.
    { code: "<ColGroup span={2} />" },
  ],
  invalid: [
    {
      code: "<table><colgroup /></table>",
      errors: [{ messageId: "colgroup", line: 1, column: 8 }],
    },
    {
      code: "<table>\n  <colgroup>\n    <col span={2} />\n  </colgroup>\n</table>",
      errors: [{ messageId: "colgroup", line: 2, column: 3 }],
    },
  ],
};
