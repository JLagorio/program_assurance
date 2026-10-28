import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";
const workspace = await localWorkspace("navigation");
let other;
const { client, tenantId } = workspace;
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
};
const refuse = async (query) => {
  const result = await query;
  assert.ok(result.error, "must reject");
  return result.error;
};
const resolve = (target, actor = workspace) =>
  actor.client.rpc("resolve_assurance_destination", { p_tenant_id: tenantId, p_target: target });
const change = (operation, target, keys, actor = workspace) =>
  actor.client.rpc("command_assurance_navigation", {
    p_tenant_id: tenantId,
    p_operation: operation,
    p_target: target ?? null,
    p_keys: keys ?? null,
  });
const read = (actor = workspace) =>
  actor.client.rpc("read_assurance_navigation", { p_tenant_id: tenantId });
try {
  other = await localWorkspace("navigation-other");
  const program = await data(
    client
      .from("programs")
      .insert({ tenant_id: tenantId, code: "NAV", name: "Navigation source" })
      .select()
      .single(),
  );
  const target = { kind: "program", recordId: program.id };
  const destination = await data(resolve(target));
  assert.equal(destination.title, program.name);
  assert.equal(destination.href, `/programs/${program.id}`);
  await refuse(resolve(target, other));
  await refuse(change("favorite", target, null, other));
  await data(change("visit", target));
  await data(change("favorite", target));
  const first = await data(read());
  assert.equal(first.length, 1);
  assert.ok(first[0].visitedAt);
  assert.equal(first[0].favorite, true);
  await data(change("favorite", target));
  assert.equal((await data(read())).length, 1, "repeat add is idempotent");
  await data(
    client
      .from("programs")
      .update({ name: "Renamed live record", revision: program.revision + 1 })
      .eq("id", program.id),
  );
  assert.equal(
    (await data(read()))[0].destination.title,
    "Renamed live record",
    "labels follow source rename",
  );
  await refuse(
    client
      .from("assurance_navigation_items")
      .insert({ tenant_id: tenantId, user_id: workspace.userId, target_key: "fake", target }),
  );
  await refuse(resolve({ ...target, href: "https://evil.test" }));
  assert.equal(await data(resolve({ kind: "program", recordId: randomUUID() })), null);
  const sheet = { kind: "workbook-sheet", recordId: program.id, sheetId: "mappings" };
  assert.match((await data(resolve(sheet))).title, /SCTM$/);
  await data(change("favorite", sheet));
  assert.equal(await data(resolve({ ...sheet, sheetId: "unsaved-sheet" })), null);
  await refuse(change("favorite", { ...sheet, sheetId: "unsaved-sheet" }));
  await refuse(resolve({ ...sheet, sheetId: "//evil" }));
  const favoriteKeys = (await data(read())).filter((x) => x.favorite).map((x) => x.key);
  await data(change("reorder", null, [...favoriteKeys].reverse()));
  assert.deepEqual(
    (await data(read())).filter((x) => x.favorite).map((x) => x.key),
    [...favoriteKeys].reverse(),
  );
  await refuse(change("reorder", null, [favoriteKeys[0], favoriteKeys[0]]));
  await refuse(change("reorder", null, ["foreign"]));
  const viewId = randomUUID();
  await data(
    client.rpc("save_assurance_view", {
      p_tenant_id: tenantId,
      p_id: viewId,
      p_scope: "/programs:programs",
      p_name: "A private filtered view",
      p_visibility: "private",
      p_definition: {
        version: 1,
        kind: "table",
        question: { serialized: "q=Navigation" },
        destination: { href: "/programs?programs.q=Navigation" },
      },
    }),
  );
  const view = { kind: "saved-view", recordId: viewId };
  assert.equal(
    (await data(resolve(view))).href,
    `/programs?programs.q=Navigation&savedView=${viewId}`,
  );
  await data(change("favorite", view));
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: other.userId, role: "viewer" }),
  );
  assert.deepEqual(
    await data(read(other)),
    [],
    "another member cannot read private recents or favorites",
  );
  assert.equal(
    await data(resolve(view, other)),
    null,
    "private views are not resolved for another member",
  );
  await data(change("favorite", target, null, other));
  assert.equal((await data(read(other))).length, 1, "viewer can save own preference");
  assert.equal((await data(read())).length, 3, "another member writes only own navigation");
  assert.deepEqual(
    await data(
      other.client.from("assurance_navigation_items").select().eq("user_id", workspace.userId),
    ),
    [],
  );
  await data(change("clear-recent"));
  assert.equal((await data(read())).filter((x) => x.visitedAt).length, 0);
  assert.equal((await data(read())).length, 3, "clear history preserves favorites");
  await data(change("unfavorite", view));
  assert.equal((await data(read())).length, 2, "unfavorite removes unvisited preference");
  await data(change("visit", target));
  await data(change("forget", target));
  assert.equal((await data(read())).find((x) => x.key === destination.key).visitedAt, null);
  console.log(
    "PASS navigation backend: authorized live names, actor/tenant privacy, viewer preferences, saved-view target, real sheets, safe destinations, idempotent favorites, reorder and history controls",
  );
} finally {
  await workspace.cleanup();
  if (other) await other.cleanup();
}
