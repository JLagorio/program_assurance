# Program creation walkthrough

Program creation uses a dedicated page at `/programs/new`. The prototype walkthrough and the schema inspector work with the same Supabase records. The wizard does not import the old demonstration workspace.

## Steps

1. **Program.** Enter the name, stable code, and mission. Sponsor, responsible parties, and dates are optional; the party pickers contain workspace records.
2. **Catalog and profiles.** Choose an exact published catalog edition and the published profiles available to this program. Each system subsequently selects one of these profiles explicitly.
3. **Systems.** Define the system boundaries and their nested composition using editing panels. Each system has its own type, code, name, description, and optional owner.
4. **Categorize and tailor.** Record confidentiality, integrity, availability, and a categorization rationale for each system. Select its base profile, inspect the catalog controls, include or exclude individual controls with reasons, and supply parameter overrides with reasons.
5. **Review and create.** Review the program, systems, effective control selections, and tailoring decisions. The final action saves the complete setup atomically. A rejected save retains the draft for correction.

Categorization does not silently select a profile or run an assumed CNSSI policy. A profile choice and every tailoring decision are explicit user inputs. System creation does not assert an authorization, assessment result, or approval.

## Reference and tailoring semantics

The supported profile subset uses one pinned catalog, exact control identifiers, `as-is` merge, and parameter value settings. Compatible published reference profiles provide the starting selection. Unsupported profile operations are reported instead of silently approximated.

An inclusion or exclusion affects the selected identifier only. It does not silently add or remove enhancements. When an excluded parent still has selected enhancements, the preview explains that those enhancements remain selected.

The resulting authored OSCAL profile records the selected identifiers, exclusions, parameter settings, and source document pins. Normalized profile imports, rules, selected controls, parameter values, and selection provenance support inspection of the same result. Shared catalog and profile releases remain unchanged.

Each system receives a whole-system scope, a draft authored profile and resolution, and a draft SSP with planned control requirements. Candidate catalog/profile choices are recorded on the program. The creation request has an idempotent receipt, so an identical retry returns the original program rather than creating another.

Parameter choices, constraints, and guidance come from the selected catalog. Constraint prose and embedded parameter references still require review; the bounded preview is not a general OSCAL constraint execution engine.

## Validation

The focused reference tests check profile support, control selection, parameter inheritance and overrides, and document authoring. Local integration checks exercise atomic persistence, invalid references, duplicate codes, and access control. The browser check walks through program details, catalog/profile selection, a system hierarchy, tailoring, and creation using a disposable local workspace.

Run `npm run test:app` for reference and application checks. With the local stack and app running, `npm run test:program-wizard` exercises the backend and browser flows, including rejected-save recovery and a fresh session reading the saved program in the schema inspector. Authored profiles are checked against the pinned official NIST OSCAL 1.2.2 JSON schema. All operational test records are confined to disposable workspaces and removed afterward.
