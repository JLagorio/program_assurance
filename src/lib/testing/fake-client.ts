/**
 * A stand-in for the Supabase client in src/lib tests. Every `from(table)` or `rpc(name)` chain is
 * recorded step by step, and answers, when it is awaited or ends in `single`/`maybeSingle`, with
 * what `answer` returns for that call.
 */
export type FakeResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
  count?: number | null;
};
export type FakeCall = { table: string; steps: [string, unknown[]][] };

const CHAIN = [
  "select",
  "insert",
  "update",
  "delete",
  "eq",
  "is",
  "in",
  "or",
  "order",
  "range",
  "setHeader",
  "retry",
  "abortSignal",
] as const;

export function fakeClient(answer: (call: FakeCall) => FakeResult | Promise<FakeResult>) {
  const calls: FakeCall[] = [];
  const chain = (call: FakeCall) => {
    const settle = () => Promise.resolve().then(() => answer(call));
    const builder: Record<string, unknown> = {};
    for (const name of CHAIN)
      builder[name] = (...args: unknown[]) => {
        call.steps.push([name, args]);
        return builder;
      };
    for (const name of ["single", "maybeSingle"])
      builder[name] = () => {
        call.steps.push([name, []]);
        return settle();
      };
    builder["then"] = (
      resolve: (value: FakeResult) => unknown,
      reject: (cause: unknown) => unknown,
    ) => settle().then(resolve, reject);
    return builder;
  };
  const client = {
    from(table: string) {
      const call: FakeCall = { table, steps: [] };
      calls.push(call);
      return chain(call);
    },
    rpc(name: string, ...args: unknown[]) {
      const call: FakeCall = { table: `rpc:${name}`, steps: [["rpc", args]] };
      calls.push(call);
      return chain(call);
    },
  };
  return { client: client as never, calls };
}

/** The arguments of each step of one kind: `args(call, "eq")` → `[["id", "…"], …]`. */
export const args = (call: FakeCall | undefined, step: string) =>
  (call?.steps ?? []).filter(([name]) => name === step).map(([, values]) => values);

/** The value one filter step gave a column, or undefined. */
export const filter = (call: FakeCall | undefined, step: string, column: string) =>
  args(call, step).find((values) => values[0] === column)?.[1];

/** A uuid made from a number, for readable fixtures. */
export const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
