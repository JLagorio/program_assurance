// ledger/no-dark-variant: a dark: variant anywhere in a class's chain.

export default {
  valid: [
    { code: '<div className="bg-surface text-default" />' },
    // A data attribute named dark is a selector, not the variant.
    { code: '<div className="data-[dark]:bg-surface hover:text-subtle" />' },
    // A margin is no-margin's under any variant but dark: (classify in classes.js).
    { code: '<div className="md:mt-4 hover:-mx-100" />' },
  ],
  invalid: [
    {
      // A token alone under dark: already changes with the mode.
      code: '<div className="dark:bg-surface" />',
      errors: [
        {
          messageId: "token",
          data: { cls: "dark:bg-surface", token: "bg-surface" },
          line: 1,
          column: 16,
        },
      ],
    },
    {
      code: '<div className={cn("text-default", "md:dark:hover:text-subtle")} />',
      errors: [
        { messageId: "token", data: { cls: "md:dark:hover:text-subtle", token: "text-subtle" } },
      ],
    },
    {
      code: 'const tone = { className: "dark:bg-neutral" };',
      errors: [{ messageId: "token", data: { cls: "dark:bg-neutral", token: "bg-neutral" } }],
    },
    {
      // Beside its light twin, a token: the dark: class only goes.
      code: '<div className="bg-surface dark:bg-gray-900" />',
      errors: [{ messageId: "flips", data: { cls: "dark:bg-gray-900", sibling: "bg-surface" } }],
    },
    {
      // With a light twin that is no token, the pair is ranked in both modes (decision 8).
      code: '<div className="bg-white dark:bg-gray-900" />',
      errors: [
        {
          messageId: "pair",
          data: {
            cls: "dark:bg-gray-900",
            advice:
              'With "bg-white", grey is bg-surface-raised (background of raised cards, with…) or bg-surface (primary background for the UI).',
          },
        },
      ],
    },
    {
      // A token under dark: beside a light class that is a literal colour: the token already
      // changes with the mode, and the literal is the class to replace (the rule page's own
      // Instead example).
      code: '<div className="bg-white dark:bg-surface-raised" />',
      errors: [
        {
          messageId: "literalTwin",
          data: {
            cls: "dark:bg-surface-raised",
            advice:
              'With "bg-white" it is bg-surface-raised in both modes (background of raised cards, with…).',
          },
        },
      ],
    },
    {
      // Under a long chain the pair's words give way to the roles alone, so they keep to the limit.
      code: '<div className="group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:hover:bg-gray-100 group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:dark:hover:bg-gray-800" />',
      errors: [
        {
          messageId: "pair",
          data: {
            cls: "group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:dark:hover:bg-gray-800",
            advice: "Grey is bg-neutral-subtle-hovered or bg-surface-overlay-hovered.",
          },
        },
      ],
    },
    {
      // Whatever the class holds, the fix drops the dark: class: a stock colour, a design value,
      // alpha, an arbitrary value, a deprecated token or a margin are reported here alone. A
      // colour with no twin the site makes plain is ranked by its dark value; a class that is no
      // colour, alpha on a token or a deprecated token gets the rule's own words.
      code: '<div className="dark:bg-red-500 dark:bg-white dark:bg-brand-bold/50 dark:w-[1px] dark:fill-chart-categorical-8 dark:mt-4 dark:-mx-100" />',
      errors: [
        {
          messageId: "colour",
          data: {
            cls: "dark:bg-red-500",
            advice:
              "Red is bg-danger-bold (a vibrant background for critical information…) or bg-accent-red-bolder (a red fill that carries no meaning, for…).",
          },
        },
        {
          messageId: "colour",
          data: {
            cls: "dark:bg-white",
            advice: "Grey is bg-neutral-bold (a vibrant background option for neutral UI…).",
          },
        },
        { messageId: "dark", data: { cls: "dark:bg-brand-bold/50" } },
        { messageId: "dark", data: { cls: "dark:w-[1px]" } },
        { messageId: "dark", data: { cls: "dark:fill-chart-categorical-8" } },
        { messageId: "dark", data: { cls: "dark:mt-4" } },
        { messageId: "dark", data: { cls: "dark:-mx-100" } },
      ],
    },
  ],
};
