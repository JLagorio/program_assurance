/** Isolated local integration workspace; never provisions operational demo data. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { localDockerEnv } from "../local-docker-env.mjs";

export async function localWorkspace(prefix = "program-wizard") {
  assert.match(prefix, /^[a-z-]+$/);
  const dockerEnv = localDockerEnv();
  const status = JSON.parse(
    execFileSync("supabase", ["status", "--output", "json"], {
      env: dockerEnv,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  assert.equal(new URL(status.API_URL).hostname, "127.0.0.1");
  assert.equal(new URL(status.API_URL).port, "54321");
  const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const run = randomUUID();
  const email = `${prefix}-${run}@example.test`;
  const password = `Aa1!${randomUUID()}`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.ifError(error);
  const userId = created.user.id;
  const client = createClient(status.API_URL, status.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let tenantId;
  const cleanup = async () => {
    // Check the exact disposable identity and its personal workspace before any
    // cleanup. Trigger bypass is transaction-local and every delete is tenant-filtered.
    if (tenantId) {
      const sql = `begin;
        select set_config('test.cleanup_tenant', :'tenant_id', true);
        select set_config('test.cleanup_user', :'user_id', true);
        select set_config('test.cleanup_email', :'test_email', true);
        do $cleanup$
        declare target_table record; target_tenant uuid := current_setting('test.cleanup_tenant')::uuid;
        begin
          if not exists (
            select 1 from public.tenants t join auth.users u on u.id=t.personal_owner_id
            where t.id=target_tenant and u.id=current_setting('test.cleanup_user')::uuid
            and u.email=current_setting('test.cleanup_email') and u.email like '%@example.test'
          ) then raise exception 'Disposable test workspace identity did not match'; end if;
          perform set_config('session_replication_role','replica',true);
          for target_table in
            select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
            where n.nspname='public' and c.relkind='r'
            and exists (select 1 from pg_attribute a where a.attrelid=c.oid and a.attname='tenant_id' and not a.attisdropped)
          loop
            execute format('delete from public.%I where tenant_id=$1',target_table.relname) using target_tenant;
          end loop;
          delete from public.tenants where id=target_tenant;
          perform set_config('session_replication_role','origin',true);
        end $cleanup$;
        commit;`;
      execFileSync(
        "docker",
        [
          "exec",
          "-i",
          "supabase_db_program-assurance",
          "psql",
          "-X",
          "-q",
          "-v",
          "ON_ERROR_STOP=1",
          "-v",
          `tenant_id=${tenantId}`,
          "-v",
          `user_id=${userId}`,
          "-v",
          `test_email=${email}`,
          "-U",
          "supabase_admin",
          "-d",
          "postgres",
        ],
        { env: dockerEnv, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], input: sql },
      );
    }
    const removed = await admin.auth.admin.deleteUser(userId);
    assert.ifError(removed.error);
  };
  try {
    const signedIn = await client.auth.signInWithPassword({ email, password });
    assert.ifError(signedIn.error);
    const workspace = await client.rpc("ensure_personal_tenant");
    assert.ifError(workspace.error);
    tenantId = workspace.data;
    assert.match(tenantId, /^[0-9a-f-]{36}$/);
    return { run, email, password, userId, tenantId, client, admin, cleanup, dockerEnv };
  } catch (failure) {
    await cleanup();
    throw failure;
  }
}
