/** Import compatibility and author permissions; every fixture is rolled back. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { quote, sql } from "./demo/database.mjs";

const ids = Object.fromEntries(
  ["user", "tenant", "program", "legacy", "authored", "invalid", "content", "party"].map((key) => [
    key,
    randomUUID(),
  ]),
);
const q = (key) => `${quote(ids[key])}::uuid`;
const insertContent = (identity, number, id = randomUUID()) => `
  insert into public.requirement_revisions
    (id, tenant_id, engineering_requirement_id, version_number, title, statement,
      acceptance_criteria, requirement_type)
  values (${quote(id)}::uuid, ${q("tenant")}, ${q(identity)}, ${number},
    'Rollback-only requirement', 'Verify imported content remains editable.',
    'The same content ID survives an authenticated edit.', 'security')`;
const reject = (statement, code, message) => `
  do $test$ begin
    begin
      ${statement};
      raise exception 'Expected SQLSTATE ${code}; operation unexpectedly succeeded';
    exception when sqlstate '${code}' then
      ${message ? `if sqlerrm <> ${quote(message)} then raise; end if;` : ""}
    end;
  end; $test$;`;
const initialMessage = "Initial requirement content must use its initial storage identifier";
const successorMessage = "This requirement already has details. Edit the existing record.";

const output = sql(`
  begin;
  set local lock_timeout = '5s';
  set local statement_timeout = '10s';
  set local request.jwt.claim.sub = '';
  set local request.jwt.claims = '{}';
  do $test$ begin
    if session_user <> 'postgres' or current_setting('role') <> 'none' or auth.uid() is not null then
      raise exception 'This test must use the same authless postgres session as the importer';
    end if;
  end; $test$;

  insert into auth.users (id, email) values (${q("user")}, ${quote(`requirement-import-${ids.user}@example.invalid`)});
  insert into public.tenants (id, name) values (${q("tenant")}, 'Rollback-only import test');
  insert into public.tenant_memberships (tenant_id, user_id, role) values (${q("tenant")}, ${q("user")}, 'owner');
  insert into public.parties (id, tenant_id, party_type, name, auth_user_id)
    values (${q("party")}, ${q("tenant")}, 'person', 'Rollback-only test actor', ${q("user")});
  insert into public.programs (id, tenant_id, code, name)
    values (${q("program")}, ${q("tenant")}, 'ROLLBACK-IMPORT', 'Rollback-only import test');
  insert into public.engineering_requirements (id, tenant_id, program_id, code) values
    (${q("legacy")}, ${q("tenant")}, ${q("program")}, 'LEGACY-STORAGE-2'),
    (${q("authored")}, ${q("tenant")}, ${q("program")}, 'AUTHORED-STORAGE-1'),
    (${q("invalid")}, ${q("tenant")}, ${q("program")}, 'INVALID-STORAGE');

  -- Match the fresh fixture import: the first and only stored content has number 2.
  ${insertContent("legacy", 2, ids.content)};
  do $test$ begin
    if not exists (select 1 from public.requirement_revisions
      where id = ${q("content")} and version_number = 2 and revision = 1) then
      raise exception 'The original positive storage number was not preserved';
    end if;
    if exists (select 1 from public.activity_events where tenant_id = ${q("tenant")}) then
      raise exception 'An authless import fabricated product edit activity';
    end if;
  end; $test$;
  ${reject(insertContent("legacy", 3), "23514", successorMessage)}
  ${reject(insertContent("invalid", 0), "23514")}
  ${reject(insertContent("invalid", -1), "23514")}

  set local role authenticated;
  set local request.jwt.claim.sub = ${quote(ids.user)};
  ${reject(insertContent("authored", 2), "23514", initialMessage)}
  ${insertContent("authored", 1)};
  ${reject(insertContent("authored", 2), "23514", successorMessage)}
  ${reject(insertContent("legacy", 3), "23514", successorMessage)}

  -- Imported storage numbers do not change product editing: update the same ID
  -- through the normal CAS/audit RPC, and never create another content record.
  do $test$
  declare result jsonb;
  begin
    result := public.edit_requirement(${q("tenant")}, ${quote(randomUUID())}::uuid,
      ${q("legacy")}, ${q("content")}, 1, '{"title":"Edited imported requirement"}'::jsonb);
    if result->>'contentId' <> ${quote(ids.content)} or (result->>'revision')::integer <> 2
      or not (result->>'changed')::boolean then
      raise exception 'Editing imported content did not return the same row and next CAS counter';
    end if;
    if (select count(*) from public.requirement_revisions where engineering_requirement_id = ${q("legacy")}) <> 1
      or not exists (select 1 from public.requirement_revisions where id = ${q("content")}
        and version_number = 2 and revision = 2 and title = 'Edited imported requirement') then
      raise exception 'Editing imported content created or renumbered a record';
    end if;
    if not exists (select 1 from public.activity_events where id = (result->>'activityEventId')::uuid
      and requirement_revision_id = ${q("content")} and source_requirement_revision_id is null
      and created_by = ${q("user")} and actor_party_id = ${q("party")}
      and changes->'title' = '{"before":"Rollback-only requirement","after":"Edited imported requirement"}'::jsonb) then
      raise exception 'Editing imported content did not record the actual actor and before/after values';
    end if;
  end; $test$;
  ${reject(`update public.requirement_revisions set version_number = 3, revision = 3 where id = ${q("content")}`, "23514", "The requirement storage identifier cannot change")}

  -- A privileged connection acting as an ordinary role cannot take the exception.
  set local request.jwt.claim.sub = '';
  ${reject(insertContent("invalid", 2), "23514", initialMessage)}
  reset role;
  set local request.jwt.claim.sub = ${quote(ids.user)};
  ${reject(insertContent("invalid", 2), "23514", initialMessage)}
  set local request.jwt.claim.sub = '';
  ${insertContent("invalid", 7)};
  ${reject(insertContent("invalid", 8), "23514", successorMessage)}

  rollback;
  select jsonb_build_object(
    'users', (select count(*) from auth.users where id = ${q("user")}),
    'tenants', (select count(*) from public.tenants where id = ${q("tenant")}),
    'content', (select count(*) from public.requirement_revisions where tenant_id = ${q("tenant")}),
    'activity', (select count(*) from public.activity_events where tenant_id = ${q("tenant")})
  );
`);
assert.deepEqual(JSON.parse(output), { users: 0, tenants: 0, content: 0, activity: 0 });
console.log(
  "PASS authless legacy import preserves positive storage numbers; authenticated creation stays at 1; successors and renumbering remain blocked; same-row edits retain audit; all fixtures rolled back",
);
