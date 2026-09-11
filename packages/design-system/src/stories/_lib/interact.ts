import { act } from "react";

// Storybook's userEvent wrapper disables the act environment during async work.
// Drive these promise-settlement cases with awaited native events in a single act scope.
export const interact = async (event: () => void) => {
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await act(async () => {
      event();
    });
  } finally {
    if (previous === undefined) delete environment.IS_REACT_ACT_ENVIRONMENT;
    else environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
};
