/** Real concurrent structural writes, confined to a disposable test workspace. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dockerEnvironment, queryJson, quote } from "./demo/database.mjs";
import { localWorkspace } from "./tests/local-workspace.mjs";

assert.equal(
  queryJson(`select exists(select 1 from information_schema.columns where table_schema='public'
    and table_name='systems' and column_name='boundary_system_id')`),
  true,
  "Run this two-session check only after the reviewed foundation migration is installed",
);
const workspace = await localWorkspace("canonical-system-race");
const { client, tenantId, userId } = workspace;
const sessions = [];
const data = async (request) => {
  const result = await request;
  assert.ifError(result.error);
  return result.data;
};
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );

function session(label) {
  const applicationName = `canonical-system-${randomUUID()}-${label}`;
  const process = spawn(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_program-assurance",
      "psql",
      "-X",
      "-q",
      "-A",
      "-t",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
    ],
    { env: dockerEnvironment(), stdio: ["pipe", "pipe", "pipe"] },
  );
  let output = "";
  let error = "";
  const markers = new Map();
  process.stdout.on("data", (bytes) => {
    output += bytes;
    for (const [marker, resolve] of markers) if (output.includes(marker)) resolve();
  });
  process.stderr.on("data", (bytes) => {
    error += bytes;
  });
  const done = new Promise((resolve, reject) => {
    process.on("error", reject);
    process.on("exit", (code) => resolve({ code, output, error }));
  });
  const started = (marker) =>
    Promise.race([
      new Promise((resolve) => {
        if (output.includes(marker)) resolve();
        else markers.set(marker, resolve);
      }),
      done.then((result) => {
        throw new Error(`SQL session ended before ${marker}: ${result.error}`);
      }),
    ]);
  process.stdin.write(`\\set VERBOSITY verbose
begin;
set local lock_timeout='6s';
set local statement_timeout='8s';
set local role authenticated;
set local request.jwt.claim.sub=${quote(userId)};
set local application_name=${quote(applicationName)};
`);
  const result = { process, applicationName, done, started };
  sessions.push(result);
  return result;
}

try {
  const program = await insert("programs", {
    code: "SYSTEM-RACE",
    name: "Disposable structural race",
  });
  const boundary = await insert("systems", {
    program_id: program.id,
    code: "BOUNDARY",
    name: "Disposable boundary",
    system_type: "information_system",
  });
  const child = async (code) =>
    insert("systems", {
      program_id: program.id,
      parent_system_id: boundary.id,
      is_authorization_boundary: false,
      code,
      name: `Disposable ${code}`,
      system_type: "hardware",
    });
  const first = await child("FIRST");
  const second = await child("SECOND");
  const firstSession = session("legacy");
  firstSession.process.stdin
    .write(`update public.composition_nodes set parent_id=${quote(second.id)}::uuid,
    revision=2 where id=${quote(first.id)}::uuid;
\\echo FIRST_REPARENT_READY
`);
  await firstSession.started("FIRST_REPARENT_READY");

  const secondSession = session("canonical");
  secondSession.process.stdin
    .end(`update public.systems set parent_system_id=${quote(first.id)}::uuid,
    revision=2 where id=${quote(second.id)}::uuid;
commit;
`);
  const deadline = Date.now() + 4000;
  let blocked = false;
  while (Date.now() < deadline && !blocked) {
    blocked = queryJson(`select exists(select 1 from pg_stat_activity waiting
      join pg_stat_activity holding on holding.application_name=${quote(firstSession.applicationName)}
      where waiting.application_name=${quote(secondSession.applicationName)} and waiting.wait_event_type='Lock'
        and holding.pid=any(pg_blocking_pids(waiting.pid)))`);
    if (!blocked) await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(
    blocked,
    true,
    "Concurrent canonical reparent must wait for the legacy structural transaction",
  );
  firstSession.process.stdin.end("commit;\n");
  const firstResult = await firstSession.done;
  const secondResult = await secondSession.done;
  assert.equal(firstResult.code, 0, firstResult.error);
  assert.notEqual(secondResult.code, 0, "The second reparent would create a cycle and must fail");
  assert.match(secondResult.error, /23514.*cycle|cycle[\s\S]*23514/i);
  assert.doesNotMatch(secondResult.error, /deadlock|40P01|lock timeout/i);
  const records = await data(client.from("systems").select().in("id", [first.id, second.id]));
  assert.equal(records.find((row) => row.id === first.id).parent_system_id, second.id);
  assert.equal(records.find((row) => row.id === first.id).revision, 2);
  assert.equal(records.find((row) => row.id === second.id).parent_system_id, boundary.id);
  assert.equal(records.find((row) => row.id === second.id).revision, 1);
  console.log(
    "PASS concurrent legacy/canonical structural writes serialize; one valid reparent commits, the cycle fails without deadlock or partial edit",
  );
} finally {
  for (const session of sessions) {
    if (session.process.exitCode === null && !session.process.stdin.writableEnded)
      session.process.stdin.end("rollback;\n");
  }
  await Promise.allSettled(sessions.map((session) => session.done));
  await workspace.cleanup();
  console.log("Disposable concurrency workspace removed; existing workspace records unchanged.");
}
