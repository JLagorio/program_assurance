# Reusable implementations and inheritance

Design proposal · September 9, 2026 · Application behavior is not changed by this proposal.

## Recommendation

Build one versioned implementation library with three source categories: **organizational baselines**, **host platforms and shared services**, and **catalog products**. Programs adopt selected contributions from those sources for explicit systems, subsystems, LRUs, or components. Each adoption retains the original narrative, evidence, version, and conditions, alongside the program's own implementation details.

The reusable unit is an **implementation contribution**: a bounded statement of what an organization, product, or provider does, mapped to one or many controls, control statements, assessment objectives, and engineering requirements. A contribution may cover only part of an obligation. Multiple contributions may work together.

The central relationship is:

> Source version → implementation contribution → selected obligation(s) → program target(s), under recorded conditions.

Adding a source supplies implementation material and potential coverage. Accepting its use confirms the program's dependency and responsibilities. Assessing the resulting implementation determines satisfaction. These are separate actions.

## Three sources, one assignment model

| Source                          | Master record                                                                                                                                 | Program-specific record                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Organizational baseline         | Approved policies, procedures, accountable organization, geographic applicability, control mappings, evidence, effective dates                | Which policies apply, regional/program supplements, adoption decision, local owners and operating evidence                 |
| Host platform or shared service | Provider's published implementation, supported consumers/configurations, offered responsibilities, supporting assessment/evidence             | Explicit provider relationship, consuming target, interface/configuration conditions, remaining consumer responsibilities  |
| Product catalog                 | Product and immutable release/configuration profile, reusable internal structure, requirements, implementation narratives, tests and evidence | Actual product instance, deployed version/configuration, local allocations, integration narrative and integration evidence |

For example, Mission Computer X release 1 is a catalog definition. Program A / System B / Mission Computer instance 01 references that definition. Another instance in the same program, or an instance in Program C, has its own configuration and acceptance. A program should be able to use a black-box product definition without importing all of its internal parts; its published interface conditions and consumer obligations still apply.

If a product is expanded into constituent hardware, firmware, and software, each instantiated node retains its link to its definition node and version. Evidence applicability must describe the supported combination, not merely a matching product name.

An organizational implementation baseline must be distinct from a program's selected **control baseline**. One describes reusable work; the other defines obligations the program must address.

## Keep the different relationships explicit

Maintain separate relationships for:

- **Organization membership:** company, division, region and program affiliations; these suggest applicable policy bundles. Geography can be a qualifier rather than a forced branch in one hierarchy.
- **System containment:** system → subsystem → component; this supports target selection and rollups.
- **Product instantiation:** a deployed element uses a particular catalog definition and version.
- **Provider dependency:** a target relies on a host platform or shared service, including a provider outside its program or authorization boundary.
- **Assurance assignment:** an accepted source contribution addresses a particular obligation for particular targets.

A missile attaching to an aircraft would have an explicit host-provider relationship. That relationship alone grants no control coverage. Only the aircraft's offered contributions that the consuming program selects and confirms can apply. Conditions such as the supported attachment/configuration and operating context belong to the assignment; if the dependency is unavailable in another context, that context retains its own unresolved obligations.

A company policy need not be a physical component in the system tree. A host need not become the parent of the consuming system. These distinctions allow overlapping organizational, technical and assurance relationships without corrupting the system structure.

## Proposed records

Names below describe responsibilities, not a requirement to create this exact database schema.

| Record                                    | Essential content                                                                                                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Organization` / `OrganizationMembership` | Accountable organization, hierarchy, program memberships, region and other applicability attributes, effective dates                                                                            |
| `LibrarySource`                           | Stable identity; category and subtype; owner; product identity or provider identity; visibility; source of truth                                                                                |
| `SourceVersion`                           | Immutable published revision; product release separately from assurance-content revision; configuration profile; effective/review dates; lifecycle; exact dependencies on other source versions |
| `ImplementationContribution`              | Stable identity within a version; master narrative; provider responsibilities; consumer obligations; parameters; applicability conditions; supported evidence and assessments                   |
| `CoverageMapping`                         | Contribution reference; versioned framework/control/statement/objective or requirement reference; bounded coverage description; full/partial/conditional claim; rationale                       |
| `RequirementDefinitionVersion`            | Reusable requirement text, revision, derivations, success criteria, parameter schema and verification method                                                                                    |
| `ProductInstance`                         | Program element reference; exact product release and configuration; optional mapping of definition nodes to instantiated nodes                                                                  |
| `ProviderRelationship`                    | Provider identity/version, consuming element, supported context, agreement/reference and dependency conditions                                                                                  |
| `InheritanceAssignment`                   | Consumer program; selected contribution versions; obligation selection; target selection; include/exclude rules; baseline/build/context; parameter bindings; acceptance lifecycle               |
| `AssignmentResolution`                    | Materialized target × obligation × contribution rows for an assignment revision, with applicability result, rationale and source trace                                                          |
| `LocalImplementation`                     | Program/target/obligation context; narrative; completed consumer responsibilities; configuration bindings; local evidence; owner and revision                                                   |
| `EvidenceArtifactVersion` / `EvidenceUse` | Immutable artifact and provenance; owning organization/program; permitted visibility; consumer's reference, mapped claim, applicability and review decision                                     |
| `Acceptance` / `Assessment`               | Separate records: who accepted source use, versions and conditions; who assessed which claims in which context, using which evidence                                                            |

One contribution has many coverage mappings, and one obligation can receive many contributions. Evidence can support many contributions and program uses without duplicating the underlying file. An evidence link alone never establishes that every mapped obligation is satisfied.

An assignment is convenient for bulk authoring, but each resolved target/obligation/contribution row can have its own applicability and acceptance. A bulk acceptance records the exact rows accepted and cannot conceal an unresolved cell.

Avoid a generic numeric "50% of a control" field. State exactly which part is covered. Prefer existing framework statements or assessment objectives; when those are unavailable, record a bounded claim and require review before crediting full coverage.

## Controls and requirements

Control identifiers must include their framework/catalog revision. `AU-2` alone is insufficient across different catalogs and versions. Enhancements and individual statements remain independently addressable.

Reusable engineering requirements live in the library as versioned definitions. On adoption, create a program requirement referencing the exact definition revision, bind its parameters, and allocate it to actual program elements. Reuse an existing program requirement only after recording an explicit match and rationale. If local requirement text changes, retain its derivation from the source and record the local revision.

Keep direct control mappings and requirement derivations distinct. Mapping a contribution to AU-2 and a requirement does not automatically approve the requirement or verify its allocations. The program's existing requirement and assessment workflows still govern those decisions.

## Catalog and builder workflow

### 1. Publish reusable material

The library has Organizational baselines, Products, and Platforms & services views. Each source exposes versions, contributions, control/requirement coverage, evidence, conditions, consumer responsibilities and consuming programs.

Authors can start in the library or use **Save as reusable implementation** while working a control. That action creates a draft with selected narrative sections, mappings and eligible evidence. It retains provenance, identifies program-specific text/parameters for review, and leaves the program record linked to its original material until the draft is published and adopted.

Publishing creates an immutable version. A later change creates another version; drafts do not become eligible for accepted inheritance.

### 2. Assemble the program

Open **Add from library** from the system builder or inheritance page. The cart can contain product instances to add and reusable implementations to apply; the review distinguishes those actions. Adding a policy applies a baseline rather than inserting a component into the inventory.

Select product release/configuration, an organizational bundle, or a host/service offering. Suggestions can come from organization membership, existing inventory and provider relationships. Suggestions remain proposals.

### 3. Select obligations

Choose the **Controls** or **Requirements** view. Requirements can be selected directly from a source, including engineering requirements with no control mapping; adopting them creates or explicitly matches program requirements before allocation. Choose a family such as AU, individual controls such as AU-1 and AU-2, or finer statements/objectives in the Controls view. A family is a selection shortcut. Expand it to the intersection of:

1. Controls selected in the relevant target's baseline revision.
2. Controls actually offered by the selected source version.
3. Controls selected by the user, including explicit exclusions.

Show controls that the source does not offer or the target has not selected, with the reason. Do not silently add them to the control baseline. Include enhancements only when explicitly selected or included by the chosen bulk option.

Record the exact expansion at confirmation. A future AU control, changed baseline or new source contribution becomes a reviewable delta.

### 4. Confirm the matrix

Rows are controls, expandable to statements/requirements and source contributions, or directly selected requirements in the Requirements view. Standalone requirements never need an invented control mapping to appear here. Columns are selected systems, subsystems or component instances. Each cell shows proposed, accepted, shared, excluded, unknown, or conflicting source use, with source and version on inspection.

Support both **this element** and **this element plus selected descendants**. Preview every resolved target, explicit exclusion and obligation before confirmation. New descendants are proposed for review rather than automatically accepted. Moving or reclassifying an existing element reevaluates its conditions and applicability.

The same matrix can be opened from either direction: a source's **Apply to programs** action, or a program/control's **Inherit from library** action. Multi-program operations review a separate matrix and permission/acceptance result for each program.

### 5. Record local implementation and confirm

For selected cells, show the master narrative and evidence beside local configuration, responsibility completion, local evidence and applicability rationale. Require missing conditions and conflicting values to be resolved before accepting affected cells.

**Confirm assignments** records selected rows, pinned versions, owner/acceptor, timestamp and rationale. It makes the material available in program control and requirement workspaces, with residual work visible. **Submit for assessment** remains a separate existing workflow.

## Example confirmation matrix

Illustrative coverage only; these examples do not assert actual control satisfaction.

| Control / source contribution                             | Subsystem 1                                   | Subsystem 2                       | Mission Computer X instance 01                                             |
| --------------------------------------------------------- | --------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| AU-1 / corporate audit policy v3                          | Use policy; local procedure remains           | Exclude this source               | Use policy through explicit target selection                               |
| AU-2 / corporate event-selection procedure v3             | Use; identify local events                    | Use; identify local events        | Use; bind product event capabilities                                       |
| AU-2 / Mission Computer X release 1, assurance revision 1 | Rollup from the allocated instance            | No matching product instance      | Use product capability; configure and verify integration                   |
| AU-9 / host platform audit protection v2                  | Conditional on declared provider relationship | No declared provider relationship | Use only where the relationship's scope and conditions cover this instance |

Excluding corporate AU-1 from Subsystem 2 means **not inherited from this source**. The AU-1 obligation remains unless a separate approved tailoring decision says it is not applicable.

AU-2 can combine a corporate procedure, product capability, shared service and program implementation. These are complementary contributions. A product contribution allocated to a child can support its parent's rollup without claiming that every sibling uses that product or counting the same obligation twice.

## Resolution rules

Resolve on **program + assessment scope + target + obligation + baseline/build/context**, returning all contributions and remaining responsibilities. Program/control summaries are derived rollups.

1. Load the accepted immutable source versions and exact target/obligation selections.
2. Check source availability, product instance/configuration and provider relationship.
3. Evaluate conditions for each target. Unknown inventory or an unverified prerequisite stays unknown and cannot earn confirmed coverage.
4. Apply explicit selection/exclusion rules. Within one assignment, an exact-target rule overrides its subtree default. Independent accepted assignments are not silently canceled by another assignment's exclusion.
5. Combine compatible bounded contributions. Deduplicate identical source-claim uses for the same obligation/context while preserving all dependency paths.
6. Surface contradictory claims, incompatible parameter values and competing replacements. Resolve them explicitly with rationale; do not select a global winner by provider category, proximity or freshness.
7. Retain uncovered portions and consumer responsibilities. Source exclusion or withdrawal never removes the underlying obligation.
8. Expose implementation state and assessment outcome separately, preserving failures and their impact.

Regional policies can supplement the company baseline. A true replacement must name the replaced contribution and its approved scope. A more specific policy cannot silently weaken a corporate obligation. Program exceptions are explicit decisions with rationale and validity, not incidental tree precedence.

Nested sources may reference other pinned source versions. Reject circular dependencies and preserve the complete source chain. Composing a product from catalog parts can expose useful contributing evidence, but any assembly-level claim needs its own bounded implementation and integration support.

## Version changes and evidence reuse

Keep product release, assurance-content revision, evidence revision and program build distinct.

- **Update available:** a newer source version exists. An accepted, still-valid older version remains usable.
- **Deployment/configuration drift:** the running product or context no longer matches the accepted reference.
- **Evidence expired / review due:** support for a claim needs review under its applicable validity rules.
- **Revoked / provider failed:** the accepted contribution is no longer dependable; affected program claims and residual work must be reevaluated.

An update review shows changed narratives, mappings, requirements, parameters, evidence, conditions and affected targets/programs. Accepting the update creates a new assignment revision. Historical packages retain the versions used at export.

Keep a shared artifact in its source library and link consumer uses to it. Each consumer may record a different applicability/reuse decision and add local evidence. Access to a program does not automatically grant access to every source artifact. Where sharing is restricted, a permitted provider assertion can be referenced, with restricted supporting material clearly indicated and assessment limited to what can be substantiated.

The current application's browser-local stores can support a prototype of these records. A production shared company library needs authoritative persistence, cross-program access control, revision history and concurrent editing. Local browser storage alone does not provide organization-wide reuse.

## How much work is inherited?

Present separate counts for proposed reusable coverage, accepted reusable coverage, outstanding local responsibilities and assessed satisfaction.

For an initial reusable-coverage percentage, count units fully addressed by accepted, applicable, current **reusable contributions alone**, divided by all selected obligation units at the displayed scope and pinned baseline, excluding only approved non-applicability. An obligation unit is the unique program + assessment scope + target + obligation revision + baseline/build/context. Unknown applicability stays in the denominator and earns no confirmed coverage; if target inventory is too incomplete to enumerate that denominator, withhold the percentage and show an incomplete-inventory message.

Display the numerator and denominator. Deduplicate parent rollups and duplicate contribution paths, while retaining separate obligation instances for separate targets. A contribution covering a child must not automatically create another count for its parent. Partial coverage stays separate; a policy covering one statement cannot count as a fully covered control. Label statement/objective counts as such and report standalone engineering requirements separately instead of mixing units. Show combined reusable-plus-local implementation coverage as a distinct measure if needed.

Do not label reusable coverage "compliance" or equate it with engineering effort saved. An accepted source with incomplete local responsibilities can reduce work without producing assessed satisfaction.

## Fit with the current application

| Existing area                                        | Proposed evolution                                                                                                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/reusable-components.ts`                     | Evolve static provider offers into source/version/contribution records; add product categories, immutable history and evidence references                                   |
| `src/lib/inheritance.ts`                             | Replace whole-program single-winner resolution with target/obligation contribution resolution; retain failure, unknown applicability, revocation and residual-work behavior |
| `src/lib/composition.ts`, `src/lib/program-scope.ts` | Add explicit definition-instance bindings and use existing target traversal; keep external providers separate from containment                                              |
| `src/lib/requirements.ts`                            | Add reusable requirement provenance and definition revisions while retaining program requirements, allocations and verification gates                                       |
| `src/lib/evidence-catalog.ts`                        | Add library ownership and cross-program evidence uses; preserve artifact revisions and per-use applicability review                                                         |
| `src/lib/control-work.ts`                            | Surface source contributions beside the local narrative and gate transitions on exact accepted coverage plus remaining responsibilities                                     |
| Library component routes                             | Broaden into the three source views with authoring, versions, mappings, evidence, conditions and consumer impact                                                            |
| Program inheritance route                            | Add catalog cart and confirmation matrix; retain conflict, obligation and unavailable-source review                                                                         |
| SCTM, coverage, conmon and export readers            | Consume target-level resolution and derived rollups consistently; export original source trace and local contributions                                                      |

The current resolver selects one provider per control across an entire program. Its latest-version comparison also flags a newer provider version as drift without loading the accepted historical narrative. Both behaviors must change before the matrix can drive authoritative posture.

Migrate existing providers and acceptances without inventing historical evidence: create a version only from content actually available. If an acceptance names an older revision whose content is absent, retain that reference as **historical source unavailable / review required**, never substitute today's narrative. Existing program-wide acceptances have no target confirmation; retain their original recorded scope and flag target resolution for review rather than fabricating per-component approvals.

## Delivery sequence and acceptance cases

1. **Domain foundation:** source versions, contributions, mappings, exact target assignments, evidence uses and additive resolution. Define migration and assessment-gate behavior first.
2. **Complete initial workflow:** author/publish a corporate audit bundle and Mission Computer X release 1; instantiate it in a program; select AU or individual controls; confirm different target cells; enter local implementation; inspect traceability from control and requirement workspaces.
3. **Host and organization rules:** provider dependencies, context conditions, organization suggestions, scoped regional supplements, multiple programs and nested packages.
4. **Change lifecycle and reporting:** source updates, impact review, historical exports, consistent posture rollups and shared persistence.

Acceptance scenarios for implementation:

- One narrative and one evidence artifact support several controls/requirements across two programs without duplicate files or shared local decisions.
- A master product requirement with no control mapping can be selected, adopted and allocated directly.
- Corporate AU-1 applies to Subsystem 1 but is excluded for Subsystem 2; AU-2 applies to both. Subsystem 2's AU-1 obligation stays open.
- Corporate, product and host contributions coexist for a single control where their claims are compatible.
- Two instances of the same product retain independent configuration, local evidence and acceptance.
- A family selection cannot grant coverage for an unsupported control, a new enhancement or a newly added child without review.
- A newer catalog version does not invalidate a still-valid accepted version; actual configuration drift, revocation and evidence expiry do affect relevant claims.
- Missing target inventory, missing host relationship or unknown conditions cannot produce full confirmed coverage or approved non-applicability.
- A program can change its local narrative without editing master content; a master update cannot overwrite local work.
- Provider withdrawal retains the obligation and historical source trace; actual failures remain visible in downstream assessment and remediation.
- Conflicting regional parameters, circular package dependencies, duplicate contribution paths and unavailable historical versions produce explicit reviewable results.
- Coverage counts retain unresolved selected obligations, distinguish separate instances and suppress percentages when inventory prevents a reliable denominator.

## Standards alignment

This is a proposed application design. NIST's OSCAL Component Definition model supports reusable descriptions for products, services, policies and procedures, including capabilities formed from multiple components. It is a suitable interchange direction for library material. [NIST Component Definition model](https://pages.nist.gov/OSCAL/learn/concepts/layer/implementation/component-definition/).

The OSCAL SSP model describes system-specific implementations at system, component and control-statement granularity, including leveraged-authorization references. It is a suitable direction for representing adopted contributions and local implementation. [NIST SSP model](https://pages.nist.gov/OSCAL/learn/concepts/layer/implementation/ssp/).

The cart, assignment lifecycle, organizational rules, internal requirement definitions and coverage calculations remain application concepts. Define and validate exact serialization against the supported OSCAL version during export work; the conceptual alignment is not a claim of implemented schema conformance.
