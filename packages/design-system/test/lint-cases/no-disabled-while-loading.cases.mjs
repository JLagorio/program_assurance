// ledger/no-disabled-while-loading: a pending flag goes to isLoading only, never also to disabled.

export default {
  valid: [
    { code: "<Button isLoading={saving} disabled={!canEdit}>Save</Button>" },
    { code: "<Button isLoading={save.isPending} disabled={form.invalid}>Save</Button>" },
    { code: "<Button isLoading={saving}>Save</Button>" },
    { code: "<Button disabled={saving}>Save</Button>" },
    { code: "const action = { isLoading: adding, disabled: empty };" },
    // A parameter that shadows the import is no part at all, and neither is a local that does.
    {
      code: 'import { Button } from "@ledger/design-system"; export function Row(Button) { return <Button isLoading={saving} disabled={saving}>Save</Button>; }',
    },
    {
      code: 'import { Button } from "@ledger/design-system"; export function Row({ as }) { const Button = as; return <Button isLoading={saving} disabled={saving}>Save</Button>; }',
    },
  ],
  invalid: [
    {
      code: "<Button isLoading={saving} disabled={saving}>Save</Button>",
      errors: [
        {
          messageId: "pending",
          data: { tag: "Button", flags: "saving", them: "it" },
          line: 1,
          column: 1,
        },
      ],
    },
    {
      code: "<Button isLoading={save.isPending} disabled={save.isPending || !valid}>Save</Button>",
      errors: [
        { messageId: "pending", data: { tag: "Button", flags: "save.isPending", them: "it" } },
      ],
    },
    {
      code: "<Button isLoading={guard.busy} disabled={!ready || guard.busy}>Create</Button>",
      errors: [{ messageId: "pending", data: { tag: "Button", flags: "guard.busy", them: "it" } }],
    },
    {
      code: "<Button isLoading={saving} disabled={saving ? true : invalid}>Create</Button>",
      errors: [{ messageId: "pending", data: { tag: "Button", flags: "saving", them: "it" } }],
    },
    {
      // An action object for a toolbar or a menu.
      code: "const action = { label: 'Add', isLoading: adding, disabled: adding || none };",
      errors: [
        {
          messageId: "pendingObject",
          data: { flags: "adding", them: "it", is: "is" },
          line: 1,
          column: 16,
        },
      ],
    },
    {
      // The flags are named once; two long ones give way to the first and how many more, so the
      // words keep to the message limit.
      code: "<Button isLoading={publishEvidenceVersion.isPending || removeRequirementAllocation.isPending} disabled={publishEvidenceVersion.isPending || removeRequirementAllocation.isPending}>Publish version</Button>",
      errors: [
        {
          messageId: "pending",
          data: {
            tag: "Button",
            flags: "publishEvidenceVersion.isPending and 1 more",
            them: "them",
          },
        },
      ],
    },
    {
      code: "<Button isLoading={saving || deleting} disabled={saving || deleting}>Save</Button>",
      errors: [
        { messageId: "pending", data: { tag: "Button", flags: "saving, deleting", them: "them" } },
      ],
    },
    {
      code: "<Button isLoading={save?.isPending!} disabled={save?.isPending! || busy}>Save</Button>",
      only: "ts",
      errors: [
        { messageId: "pending", data: { tag: "Button", flags: "save.isPending", them: "it" } },
      ],
    },
    // A component a caller hands in, as a parameter that shadows nothing, is judged as any
    // component that takes both props is; so is one read from the props object.
    {
      code: "export function Row({ Action, saving }) { return <Action isLoading={saving} disabled={saving} />; }",
      errors: [{ messageId: "pending", data: { tag: "Action", flags: "saving", them: "it" } }],
    },
    {
      code: "export function Row(props) { return <props.Action isLoading={props.saving} disabled={props.saving} />; }",
      errors: [
        { messageId: "pending", data: { tag: "props.Action", flags: "props.saving", them: "it" } },
      ],
    },
  ],
};
