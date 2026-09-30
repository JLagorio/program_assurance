// ledger/no-alpha-token: an opacity modifier on a colour token.

export default {
  valid: [
    { code: '<div className="bg-brand-bold bg-neutral-hovered text-subtle" />' },
    // A fraction is a size, not an alpha.
    { code: '<div className="w-1/2 basis-1/3" />' },
    { code: '<div className="opacity-disabled" />' },
    // Alpha on a colour that is no token is no-non-token-class's: a palette colour, a shadcn name.
    // Alpha in brackets or read from a variable is no-arbitrary-value's, and a dark: class
    // no-dark-variant's (classify in classes.js).
    {
      code: '<div className="bg-red-500/50 text-white/70 bg-muted/50 bg-brand-bold/[0.5] bg-brand-bold/(--alpha) dark:bg-brand-bold/50" />',
    },
  ],
  invalid: [
    {
      // At /30 or below, the token's tints nearest what the alpha makes of it over the page.
      code: '<div className="bg-brand-bold/10" />',
      errors: [
        {
          messageId: "alpha",
          data: {
            cls: "bg-brand-bold/10",
            token: "bg-brand-bold",
            advice: "A tint of it is bg-brand-subtlest.",
          },
          line: 1,
          column: 16,
        },
      ],
    },
    {
      // A variant that asks for a state the token has not: by the alpha. A token with neither a
      // tint nor a state gets the rule's own words.
      code: '<div className={cn("p-200", selected && "hover:text-subtle/50 border-brand/20")} />',
      errors: [
        {
          messageId: "alpha",
          data: {
            cls: "hover:text-subtle/50",
            token: "text-subtle",
            advice: "A tint of it is hover:text-subtlest.",
          },
        },
        {
          messageId: "alpha",
          data: {
            cls: "border-brand/20",
            token: "border-brand",
            advice: "A tint or a state is its own token (subtle, hovered, pressed), never alpha.",
          },
        },
      ],
    },
    {
      // At /60 or above, the token's own hovered and pressed states.
      code: 'export const scrim = "bg-surface-overlay/80 fixed inset-0";',
      errors: [
        {
          messageId: "alpha",
          data: {
            cls: "bg-surface-overlay/80",
            token: "bg-surface-overlay",
            advice: "A state of it is bg-surface-overlay-hovered or bg-surface-overlay-pressed.",
          },
        },
      ],
    },
    {
      // In between, the nearest tint and the hovered state; a variant that asks for a state the
      // token has is that state.
      code: '<div className="bg-brand-bold/50 hover:bg-neutral/50 active:bg-brand-bold/90" />',
      errors: [
        {
          messageId: "alpha",
          data: {
            cls: "bg-brand-bold/50",
            token: "bg-brand-bold",
            advice: "A tint of it is bg-brand-subtlest; a state of it is bg-brand-bold-hovered.",
          },
        },
        {
          messageId: "alpha",
          data: {
            cls: "hover:bg-neutral/50",
            token: "bg-neutral",
            advice: "That state is its own token: hover:bg-neutral-hovered.",
          },
        },
        {
          messageId: "alpha",
          data: {
            cls: "active:bg-brand-bold/90",
            token: "bg-brand-bold",
            advice: "That state is its own token: active:bg-brand-bold-pressed.",
          },
        },
      ],
    },
    {
      // Text's quieter forms are the grey ladder's.
      code: '<p className="text-default/60" />',
      errors: [
        {
          messageId: "alpha",
          data: {
            cls: "text-default/60",
            token: "text-default",
            advice: "A tint of it is text-subtlest or text-subtle.",
          },
        },
      ],
    },
    {
      // Alpha only ever makes a colour quieter: the quietest grey has no quieter tint, and a faded
      // series is no hovered one, so the rule's own words stand.
      code: '<p className="text-subtlest/60 stroke-chart-brand/10" />',
      errors: [
        {
          messageId: "alpha",
          data: {
            cls: "text-subtlest/60",
            token: "text-subtlest",
            advice: "A tint or a state is its own token (subtle, hovered, pressed), never alpha.",
          },
        },
        {
          messageId: "alpha",
          data: {
            cls: "stroke-chart-brand/10",
            token: "stroke-chart-brand",
            advice: "A tint or a state is its own token (subtle, hovered, pressed), never alpha.",
          },
        },
      ],
    },
  ],
};
