# WS-X90 seed

`wsx90-platform-seed.json` is an unchanged copy of the user-supplied synthetic dataset at `docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json`. It is shipped here because `docs/examples` is ignored by Git.

SHA-256: `2a45006e38a20f9fe2498869a892694efd89b81c22a89659a85399d4981ce354`

`src/lib/platform-seed.ts` validates the source. `platform-ingestion.ts` registers it in the existing program stores before saved edits are restored. No separate program layout or parallel workspace store is used.
