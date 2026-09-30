// The props tables come from the types: unions become their values, JSDoc becomes the description,
// defaults come from the destructuring. A part's own props and the Base UI props it inherits (a
// Dialog's `open` and `onOpenChange`, a Switch's `checked`) are listed; the DOM's own attributes,
// declared by @types/react, and other dependencies' props are left out. The Storybook (main.ts)
// and llms.txt (build/llms.mjs) read these options, so both list the same props.
export const docgenOptions = {
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  propFilter: (prop) => {
    const files = [prop.parent, ...(prop.declarations ?? [])].flatMap((declaration) =>
      declaration ? [declaration.fileName] : [],
    );
    return (
      files.length === 0 ||
      files.some(
        (file) => !file.includes("node_modules/") || file.includes("node_modules/@base-ui/"),
      )
    );
  },
};
