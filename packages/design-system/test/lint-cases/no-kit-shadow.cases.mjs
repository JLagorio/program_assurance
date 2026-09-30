// ledger/no-kit-shadow: a product file declares a component under a kit part's name, or a name the
// kit retired, instead of importing the part.

export default {
  valid: [
    { code: "export function RequirementRow() { return null; }" },
    // Not a component: a value, and a component nested inside another.
    { code: 'export const Button = "primary";' },
    { code: "export function Screen() { function Badge() { return null; } return <Badge />; }" },
    // A kit part is imported, not declared.
    { code: 'import { Badge } from "@ledger/design-system"; export const A = () => <Badge />;' },
  ],
  invalid: [
    {
      code: "export default function Badge() { return null; }",
      errors: [{ messageId: "kitPart", data: { name: "Badge" }, line: 1, column: 25 }],
    },
    {
      // memo and forwardRef declare a component too.
      code: "export const Button = memo(function Button() { return null; });\nconst Dialog = React.forwardRef(function Dialog() { return null; });",
      errors: [
        { messageId: "kitPart", data: { name: "Button" }, line: 1, column: 14 },
        { messageId: "kitPart", data: { name: "Dialog" }, line: 2, column: 7 },
      ],
    },
    {
      code: "export class Table extends React.Component {}",
      errors: [{ messageId: "kitPart", data: { name: "Table" } }],
    },
    {
      code: 'const Modal = ({ children }) => <div role="dialog">{children}</div>;',
      errors: [{ messageId: "legacyName", data: { name: "Modal", part: "Dialog" } }],
    },
    {
      // The product's note names its own binding of the part.
      code: "export function Severity() { return null; }",
      options: [{ note: "In this app a level is LevelIndicator." }],
      errors: [
        {
          messageId: "legacyName",
          data: {
            name: "Severity",
            part: "Indicator",
            note: " In this app a level is LevelIndicator.",
          },
        },
      ],
    },
  ],
};
