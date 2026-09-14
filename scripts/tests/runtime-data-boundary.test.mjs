import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

async function files(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? files(resolve(path, entry.name)) : resolve(path, entry.name),
      ),
    )
  ).flat();
}
test("runtime has no prototype snapshots, seed imports, demo fallback, or fictional clock", async () => {
  const source = await files(resolve("src"));
  for (const path of source.filter(
    (path) => /\.[jt]sx?$/.test(path) && !path.endsWith(".test.ts") && !path.endsWith(".types.ts"),
  )) {
    const text = await readFile(path, "utf8");
    assert.doesNotMatch(
      text,
      /legacy-poc|workspace_snapshots|save_workspace_snapshot|VITE_DATA_BACKEND|dataset-clock|platform-seed|grc-data|wsx90|WS-X90|Math\.random\(/,
      path,
    );
  }
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["gen:seed"],
    undefined,
    "old seed generation cannot repopulate runtime",
  );
});
