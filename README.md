# Program Assurance

A TanStack Start / React application backed by local Supabase Postgres, Auth and private Storage. It has two interfaces over the same normalized records: the Equinox prototype for daily work, and a schema inspector for validating backend data. New workspaces start empty; published reference material is imported separately from pinned source files.

## Run locally with Supabase and Colima

On macOS, install Node.js 22.12+ (or a newer supported LTS), npm, and the CLI tools:

```sh
brew install colima docker
brew install supabase/tap/supabase
npm install
npm run local:start
npm run dev
```

The setup uses Supabase CLI **2.107.0** and Colima's Docker runtime. The first startup downloads the VM and container images and can take several minutes. Allow about 8 GiB of memory and disk space for the images and database. See the official [Supabase local development guide](https://supabase.com/docs/guides/local-development) for CLI requirements and installation details.

`local:start` starts the dedicated `program-assurance` Colima profile with 4 CPUs, 8 GiB RAM, and a 60 GiB virtual disk; starts Supabase; applies pending local migrations; imports the pinned reference releases idempotently; creates the developer account if missing; and writes the public connection values to ignored `.env.local`. Existing users and workspaces survive repeated starts. Other values already in `.env.local` are preserved. Restart Vite after the environment file changes. During development, UI edits preserve the loaded workspace; edits to persistence or authentication modules trigger a full page reload, so wait for a successful save before changing those modules.

Open the app at the URL printed by Vite and click **Sign in as seeded user** to fill the local credentials and sign in. The shortcut is available during development when connected to the local Supabase stack. You can also sign in manually with:

- Email: `developer@program-assurance.local`
- Password: `local-program-assurance`

These credentials are for this local development stack only. Public signups are disabled; additional test accounts can be created in local Studio under Authentication.

| Service                    | Local address                                                    |
| -------------------------- | ---------------------------------------------------------------- |
| Supabase API / Auth        | http://127.0.0.1:54321                                           |
| Supabase Studio            | http://127.0.0.1:54323                                           |
| Captured development email | http://127.0.0.1:54324                                           |
| Postgres                   | `127.0.0.1:54322` (`postgres` / `postgres`, database `postgres`) |

The runner selects `~/.colima/program-assurance/docker.sock` for its commands and starts Colima with `--activate=false`, preserving the current Docker context. The `program-assurance-local` Docker bridge sets `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`, so published services forward to loopback only. Startup verifies those effective container bindings. Colima's host networking options remain disabled. See Docker's [default bind address documentation](https://docs.docker.com/engine/network/port-publishing/#setting-the-default-bind-address-for-containers) for this setting. [Colima profiles](https://colima.run/docs/profiles/) provide separate VMs; its [command reference](https://colima.run/docs/commands/) describes runtime and resource flags.

## Daily commands

```sh
npm run local:start          # Start/resume, apply migrations, prepare local sign-in
npm run local:status         # Show this profile and service URLs without printing keys
npm run dev                  # Start the frontend
npm run test:app             # Application tests
npm run test:local           # Auth/PostgREST integration checks
npm run test:browser         # Browser CRUD and evidence recovery checks; app must be running
npm run test:program-wizard  # Program wizard persistence and browser walkthrough; app must be running
npm run test:product-flows   # Task/evidence transactions and product dialogs; app must be running
npm run test:requirements    # Requirement editing, control mappings and evidence; app must be running
npm run test:system-assurance # Nested systems, profiles and SSP flows; app must be running
npm run test:demo            # Archived source mapping and isolated seed preservation/rollback checks
npm run test:demo-browser    # Read-only check of the seeded local developer workspace
npm run test:reference       # Verify source hashes, normalization and provenance
npm run models:generate      # Refresh TypeScript models after schema changes
npm run local:stop           # Stop Supabase and this VM; retain database volumes
```

To discard all local users and workspaces and rebuild the database from migrations:

```sh
npm run local:reset -- --yes
```

Reset requires a running stack and the explicit `--yes` argument. It only targets the local database, then recreates the developer account. The next sign-in creates only the authenticated identity and its tenant workspace. Programs and other operational records remain empty. Normal startup never resets the database. Supabase describes migration and reset behavior in its [local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows).

For direct CLI work, target this VM explicitly:

```sh
export DOCKER_HOST="unix://$HOME/.colima/program-assurance/docker.sock"
unset DOCKER_CONTEXT
supabase migration new describe_your_change
supabase migration up --local --network-id program-assurance-local
```

If another project occupies ports 54320–54324, stop that project's services or change the local ports and matching runner checks before starting. If Docker reports an API-version mismatch with an older runtime, set `DOCKER_API_VERSION=1.41` only for the affected command. The runner otherwise leaves Docker API negotiation unchanged.

## Relational records and reference data

The **New program** action opens a dedicated four-step walkthrough: program, catalog and profiles, systems and components (by hand, from the Components library, or as a variant of a product configuration), then review and create. It saves the complete setup in one Supabase transaction and opens the new program. See [the program wizard guide](docs/program-wizard.md) for supported OSCAL tailoring and the records it creates.

The schema separates shared reference publications from tenant-owned operational records. Programs, system composition, requirements, implementation claims, assessments, observations, findings, risks, POA&M commitments, tasks, reviews and authorization packages have real columns, UUID identities and foreign keys. The prototype at `/` retains the Equinox shell and its program, work, assessment, evidence, risk, POA&M, package, and library navigation. Its screens use the generated models in `src/lib/database.types.ts` through `src/lib/models.ts`. Product create/edit actions open dialogs while keeping the page visible; new programs use the dedicated wizard. Contextual parent records stay fixed, and optional technical metadata is grouped under Additional details. Task creation can save its responsible assignment in the same transaction. Adding evidence creates an artifact and its first draft metadata version together, then opens the existing file upload and recovery controls.

Requirements use the design system's table, eye preview and contextual panel. The preview and full page share the same current content and inline **Editable** fields. Edits update the requirement directly and record the actor, time and before/after values in **Edit history**. Requirement revision controls and automatic copies are removed. **Add evidence** opens the large searchable evidence picker; **New evidence / Upload** creates a separate artifact and draft evidence version before explicit publication and linking. See [the requirement workspace guide](docs/requirement-workspace.md) for these interaction conventions.

The schema inspector at `/schema` and `/records/:collection` provides a separate view for validating the same rows, relationships, and controlled values. Changes in either interface are visible in the other. The original POC snapshot, stores, generators, and fictional records are preserved under `tests/fixtures/legacy-poc` for historical tests; they are excluded from the application build. `npm run test:poc` runs the preserved historical domain tests. The initial snapshot migration remains in history for existing database compatibility. The explicit demo importer below projects archived source records into the relational models.

Sign-in creates a tenant workspace and a party record from the actual authenticated account. Tenant membership controls read/write access. Owners, reviewers and assignments reference parties; links between tenant-owned records include the tenant in their foreign key. Optional unknown dates, outcomes and metadata remain empty. The application never generates fallback operational examples, approvals, or evidence files.

## Restore the original demo baseline

The frozen prototype dataset is a separate, explicit local seed. It preserves the original fictional records as Supabase rows with source provenance. It includes programs and systems, scope/control selections, requirements and allocations, implementation narratives, library entries, evidence metadata, campaigns, observations, issues, risks, POA&M items, tasks, workstreams, and supplier organizations. See [the source inventory and mapping gaps](docs/demo-seed-mapping.md).

Use the workspace UUID shown by the schema inspector and the email of its owner:

```sh
npm run seed:demo -- --tenant YOUR_WORKSPACE_UUID --account YOUR_LOCAL_EMAIL --report /tmp/demo-import-report.json
npm run seed:demo -- --tenant YOUR_WORKSPACE_UUID --account YOUR_LOCAL_EMAIL --check
npm run seed:demo -- --tenant YOUR_WORKSPACE_UUID --account YOUR_LOCAL_EMAIL --apply
```

The default command produces a read-only plan. `--check` runs the whole import and rolls back; `--apply` commits it atomically. Repeat imports preserve existing rows and user edits. An unrelated code collision, deleted prior import, changed source, or invalid relationship aborts the transaction. Startup and sign-in do not automatically seed new workspaces.

Missing source facts stay missing. In particular, the old packages reference absent systems, many test results lack the version pins needed for a formal assessment, and the supplied evidence catalog has metadata rather than associated file bytes. Resolvable results appear as observations and operational issues; no formal run, approval, file, or package parent is invented. The complete source and per-record import issues remain available through the import provenance tables and report.

## Persistence and evidence

The reference importer verifies source hashes and imports the pinned NIST OSCAL control catalog/baselines and DISA CCI reference release documented in [the reference manifest](supabase/reference/manifest.json). Its deterministic IDs preserve the same release across repeated runs. Reference rows are shared read-only publications; tenant work links to exact versions. To inspect or repeat the import directly:

```sh
node scripts/seed-reference.mjs --check  # Verify pinned sources without DB changes
node scripts/seed-reference.mjs        # Idempotent local reference import
```

Record updates use optimistic concurrency: the client sends the previous revision plus one and filters by the previous value. A stale update fails instead of overwriting another session's work. Wait for a successful save before navigating away or editing persistence/authentication modules during development; an unsaved form remains browser memory.

Published reference, evidence and assessment revisions retain their publication protections. Assessments and packages pin their recorded input versions. Completed executions, recorded decisions and activity events retain their history. Requirements use direct edits with edit history, as described in [requirement edit persistence](docs/requirement-edit-history.md). See the [implemented ERD](docs/schema-erd.md), [assurance schema](docs/assurance-schema.md) and [workflow schema](docs/workflow-schema.md) for table relationships and constraints.

Evidence files use a private `evidence` Storage bucket. Each file belongs to an actual tenant/artifact/version path, and its version record references the uploaded Storage object. Uploads require tenant write access and a draft version. Published versions cannot be overwritten; downloads require tenant membership. Interrupted uploads can be recovered from their actual stored bytes without inventing metadata or overwriting a different file. External artifact locations can also be recorded without inventing a file. Realtime, Edge Functions, analytics, vector services and the connection pooler remain disabled.

The frontend receives only the public local anon/publishable key. The setup script uses the local admin key in memory to [create the developer account](https://supabase.com/docs/reference/javascript/auth-admin-createuser) and never writes it into a `VITE_` variable. `.env.example` documents public connection settings; `local:start` generates their actual local values.

The application provides model-backed prototype workflows and separate backend inspection. General OSCAL profile resolution and document import/export automation are not complete. Exports labeled as recorded JSON contain actual database records, not a claim of validated OSCAL interchange. The bundled resolver supports the published NIST profile forms described in [reference seeding](docs/reference-seeding.md); unsupported forms fail explicitly.

Schema checks in `supabase/tests/assurance.sql` and `supabase/tests/workflow.sql` run inside rollback-only transactions. They exercise tenancy, foreign keys, concurrency, publication and evidence restrictions without resetting or retaining fixture records.

## Lovable connection

This project remains connected to [Lovable](https://lovable.dev). Commits pushed to its connected branch sync into the editor. Preserve published Git history: do not force-push or rewrite commits already pushed.

Built with TanStack Start, TypeScript, React, Tailwind CSS, and Supabase.

### Recover archived requirement/control references

Existing imported workspaces can recover the original fixture's exact whole-control derivations without replaying the full seed or replacing edited records:

```sh
node scripts/restore-requirement-control-mappings.mjs --tenant YOUR_WORKSPACE_UUID --account YOUR_LOCAL_EMAIL --check
node scripts/restore-requirement-control-mappings.mjs --tenant YOUR_WORKSPACE_UUID --account YOUR_LOCAL_EMAIL --apply
```

Recovery resolves each imported requirement's stable identity to its current details, retains the original control and rationale, and preserves existing source receipts and authored conflicts. It creates no guessed statement, system allocation, implementation claim or evidence file. The current fixture contains 665 such references, including four for PRG-1041. New workspaces receive these through the regular explicit demo seed.

See [System assurance workflow](docs/system-assurance-workflow.md) for the canonical system tree, profile inheritance, requirement mappings and SSP assembly.
