import { describe, expect, it } from "vitest";
import { args, fakeClient, uuid, type FakeCall } from "./testing/fake-client";

const {
  SBOM_COLUMNS,
  SBOM_COMPONENT_COLUMNS,
  SBOM_COMPONENT_KINDS,
  SBOM_COMPONENT_LIMIT,
  SBOM_FORMATS,
  SBOM_IMPORT_UNREADABLE,
  SBOM_NEEDS_DAY,
  SBOM_NEEDS_SUBJECT,
  SBOM_NEEDS_TITLE,
  SBOM_NO_COMPONENTS,
  SBOM_NOT_JSON,
  SBOM_TOO_MANY,
  SBOM_UNKNOWN_FORMAT,
  VULNERABILITY_ISSUES_UNREADABLE,
  VULNERABILITY_NEEDS_CVE,
  importSbom,
  newestSbomFirst,
  openVulnerabilityIssues,
  readComponentVulnerabilities,
  readSbomFile,
  sbomComponentRead,
  sbomImportIssues,
  sbomUnnamed,
} = await import("./component-vulnerabilities");
const { readServerPage } = await import("./server-table");

const context = { tenantId: uuid(1), token: "token" };
const rpc = (data: unknown, error: { code?: string; message: string } | null = null) =>
  fakeClient(() => ({ data, error }));
const sent = (call: FakeCall | undefined) => args(call, "rpc")[0]?.[0];

describe("the CVEs on a component version", () => {
  // The seeded scenario: version 1 of the Mission Computer carries OpenSSH server 9.6p1, which
  // CVE-2024-6387 affects. Three programs are built from it; one has answered.
  const consumer = (program: number, code: string, issue: Record<string, unknown> | null) => ({
    program_id: uuid(program),
    program_code: code,
    program_name: `${code} program`,
    business_line_id: issue ? null : uuid(3),
    system_components: [
      {
        system_id: uuid(program + 1),
        system_code: `${code}-SYS`,
        system_name: `${code} system`,
        system_component_id: uuid(program + 2),
        component_code: "LRU-001",
        component_name: "Mission Computer",
      },
    ],
    answered: !!issue,
    issues: issue ? 1 : 0,
    issue,
  });
  const answer = {
    defined_component_id: uuid(10),
    component: {
      id: uuid(10),
      name: "Mission Computer",
      component_type: "hardware",
      definition_id: uuid(11),
      definition_code: "x800-components",
      definition_name: "X800 Missile component set",
      revision_id: uuid(12),
      version: 1,
      state: "published",
      owner_party_id: uuid(2),
    },
    sbom: {
      id: uuid(20),
      title: "Mission Computer maintenance image SBOM",
      format: "cyclonedx",
      spec_version: "1.5",
      serial: "urn:uuid:63d63818-ca79-406b-939d-74a552feae25",
      generated_on: "2026-10-08",
      evidence_artifact_id: null,
      components: 13,
    },
    vulnerabilities: [
      {
        vulnerability_id: uuid(30),
        cve_id: "CVE-2024-6387",
        title: "Signal handler race in OpenSSH's sshd (regreSSHion)",
        severity: "high",
        cvss_score: 8.1,
        cvss_vector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H",
        published_on: "2024-07-01",
        fixed_in: "OpenSSH 9.8p1",
        source_uri: "https://nvd.nist.gov/vuln/detail/CVE-2024-6387",
        known_exploited: false,
        components: [
          {
            sbom_component_id: uuid(21),
            name: "openssh-server",
            version: "9.6p1",
            kind: "application",
            purl: "pkg:generic/openssh@9.6p1",
            cpe: "cpe:2.3:a:openbsd:openssh:9.6:p1:*:*:*:*:*:*",
            note: "9.6p1 is inside the affected range, OpenSSH 8.5p1 through 9.7p1.",
          },
        ],
        controls: [
          { control_id: uuid(40), code: "RA-5", title: "Vulnerability Monitoring and Scanning" },
          { control_id: uuid(41), code: "SI-2", title: "Flaw Remediation" },
        ],
        consumers: [
          consumer(50, "PRG-1090", {
            issue_id: uuid(60),
            title: "CVE-2024-6387 in the OpenSSH server (regreSSHion)",
            severity: "high",
            status: "open",
            open: true,
            opened_at: "2026-10-10T15:00:00+00:00",
            owner_party_id: uuid(4),
            poam_items: 1,
          }),
          consumer(53, "PRG-2101", null),
          consumer(56, "PRG-2102", null),
        ],
        programs: 3,
        programs_answered: 1,
        programs_open: 1,
      },
    ],
    totals: {
      vulnerabilities: 1,
      sbom_components: 1,
      programs: 3,
      unanswered: 2,
      programs_unanswered: 2,
    },
  };

  it("asks for the component version alone, and reads each CVE with who is exposed and who has answered", async () => {
    const { client, calls } = rpc(answer);
    const read = await readComponentVulnerabilities(client, context, uuid(10));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("rpc:component_vulnerabilities");
    expect(sent(calls[0])).toEqual({ p_defined_component_id: uuid(10) });
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
    expect(read.component).toEqual({
      id: uuid(10),
      name: "Mission Computer",
      componentType: "hardware",
      definitionId: uuid(11),
      definitionCode: "x800-components",
      definitionName: "X800 Missile component set",
      revisionId: uuid(12),
      version: 1,
      state: "published",
      ownerPartyId: uuid(2),
    });
    expect(read.sbom).toEqual({
      id: uuid(20),
      title: "Mission Computer maintenance image SBOM",
      format: "cyclonedx",
      specVersion: "1.5",
      serial: "urn:uuid:63d63818-ca79-406b-939d-74a552feae25",
      generatedOn: "2026-10-08",
      evidenceArtifactId: null,
      components: 13,
    });
    const [cve] = read.vulnerabilities;
    expect(cve).toMatchObject({
      vulnerabilityId: uuid(30),
      cveId: "CVE-2024-6387",
      severity: "high",
      cvssScore: 8.1,
      publishedOn: "2024-07-01",
      fixedIn: "OpenSSH 9.8p1",
      knownExploited: false,
      programs: 3,
      programsAnswered: 1,
      programsOpen: 1,
    });
    expect(cve?.components).toEqual([
      {
        sbomComponentId: uuid(21),
        name: "openssh-server",
        version: "9.6p1",
        kind: "application",
        purl: "pkg:generic/openssh@9.6p1",
        cpe: "cpe:2.3:a:openbsd:openssh:9.6:p1:*:*:*:*:*:*",
        note: "9.6p1 is inside the affected range, OpenSSH 8.5p1 through 9.7p1.",
      },
    ]);
    expect(cve?.controls.map((control) => [control.id, control.code])).toEqual([
      [uuid(40), "RA-5"],
      [uuid(41), "SI-2"],
    ]);
    // The program that answered names its issue; one that holds none has not answered.
    expect(cve?.consumers.map((row) => [row.programCode, row.answered, row.issues])).toEqual([
      ["PRG-1090", true, 1],
      ["PRG-2101", false, 0],
      ["PRG-2102", false, 0],
    ]);
    expect(cve?.consumers[0]).toMatchObject({
      businessLineId: null,
      systemComponents: [
        {
          systemId: uuid(51),
          systemCode: "PRG-1090-SYS",
          systemComponentId: uuid(52),
          componentCode: "LRU-001",
        },
      ],
      issue: {
        issueId: uuid(60),
        status: "open",
        open: true,
        openedAt: "2026-10-10T15:00:00+00:00",
        ownerPartyId: uuid(4),
        poamItems: 1,
      },
    });
    expect(cve?.consumers[1]?.issue).toBeNull();
    expect(read.totals).toEqual({
      vulnerabilities: 1,
      sbomComponents: 1,
      programs: 3,
      unanswered: 2,
      programsUnanswered: 2,
    });
  });

  it("reads a version with no SBOM recorded as nothing known, never as nothing wrong", async () => {
    const { client } = rpc({
      ...answer,
      sbom: null,
      vulnerabilities: [],
      totals: { ...answer.totals, vulnerabilities: 0, sbom_components: 0, unanswered: 0 },
    });
    const read = await readComponentVulnerabilities(client, context, uuid(10));
    expect(read.sbom).toBeNull();
    expect(read.vulnerabilities).toEqual([]);
  });

  it("refuses an SBOM format it does not know, and passes a refusal on as it is", async () => {
    const unknown = rpc({ ...answer, sbom: { ...answer.sbom, format: "swid" } });
    await expect(readComponentVulnerabilities(unknown.client, context, uuid(10))).rejects.toThrow();
    const refused = rpc(null, { code: "42501", message: "Component access is required" });
    await expect(readComponentVulnerabilities(refused.client, context, uuid(10))).rejects.toThrow(
      "Component access is required",
    );
  });
});

describe("the components of a standing SBOM", () => {
  it("reads the view by name, with every column an SBOM component's form edits", () => {
    const read = sbomComponentRead();
    expect(read).toMatchObject({ source: "sbom_component_rows", model: "sbom_components" });
    expect(read.scope).toBeUndefined();
    expect(read.columns).toEqual([...SBOM_COMPONENT_COLUMNS]);
    for (const column of [
      "sbom_id",
      "parent_component_id",
      "name",
      "version",
      "kind",
      "supplier",
      "purl",
      "cpe",
      "license",
      "hash",
      "revision",
      "tenant_id",
    ])
      expect(read.columns).toContain(column);
    for (const model of ["sboms", "sbom_component_vulnerabilities", "vulnerabilities"])
      expect(read.models).toContain(model);
  });

  it("keeps to one SBOM, a component version's standing SBOM or an asset's", async () => {
    expect(sbomComponentRead({ sbomId: uuid(20) }).scope).toEqual({ sbom_id: uuid(20) });
    expect(sbomComponentRead({ inventoryItemId: uuid(25) }).scope).toEqual({
      inventory_item_id: uuid(25),
    });
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 13 }));
    const page = await readServerPage(
      client,
      context,
      sbomComponentRead({ definedComponentId: uuid(10) }),
      { pageIndex: 0, pageSize: 25 },
    );
    expect(page.count).toBe(13);
    expect(calls[0]?.table).toBe("sbom_component_rows");
    expect(args(calls[0], "eq")).toEqual([["defined_component_id", uuid(10)]]);
    expect(args(calls[0], "order")).toEqual([
      ["name", { ascending: true, nullsFirst: false }],
      ["version", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
  });

  it("sorts the worst severity in the product's order and finds it by its word", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readServerPage(client, context, sbomComponentRead(), {
      pageIndex: 0,
      pageSize: 25,
      search: "critical",
      sorting: [
        { id: "worst_severity", desc: true },
        { id: "parent_component_id", desc: false },
      ],
    });
    expect(args(calls[0], "order")).toEqual([
      ["worst_severity_rank", { ascending: false, nullsFirst: true }],
      ["parent_name", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    const search = String(args(calls[0], "or")[1]?.[0]);
    expect(search).toContain('worst_severity.in.("critical")');
    expect(search).toContain("purl.ilike.");
  });
});

describe("the SBOMs of a component version", () => {
  const sbom = (id: number, generated_on: string, created_at: string) => ({
    id: uuid(id),
    title: `SBOM ${id}`,
    format: "cyclonedx",
    spec_version: "1.5",
    serial: null,
    generated_on,
    evidence_artifact_id: null,
    created_at,
    revision: 1,
  });

  it("reads what the document says of itself", () => {
    expect([...SBOM_COLUMNS]).toEqual([
      "id",
      "title",
      "format",
      "spec_version",
      "serial",
      "generated_on",
      "evidence_artifact_id",
      "created_at",
      "revision",
    ]);
  });

  it("lists the newest first, and the latest by the day it was generated stands", () => {
    const sboms = newestSbomFirst([
      sbom(1, "2026-10-08", "2026-11-15T17:52:07.704878+00:00"),
      sbom(2, "2026-11-15", "2026-11-15T17:52:07.704878+00:00"),
      // Recorded last, and generated before the one that stands.
      sbom(3, "2026-09-01", "2026-11-16T09:00:00+00:00"),
    ]);
    expect(sboms.map((row) => [row.id, row.standing])).toEqual([
      [uuid(2), true],
      [uuid(1), false],
      [uuid(3), false],
    ]);
  });

  it("of two generated the same day, stands the one recorded last, then the one of the later id", () => {
    expect(
      newestSbomFirst([
        sbom(1, "2026-10-08", "2026-10-08T10:00:00.5+00:00"),
        sbom(2, "2026-10-08", "2026-10-08T10:00:00.75+00:00"),
      ]).map((row) => row.id),
    ).toEqual([uuid(2), uuid(1)]);
    expect(
      newestSbomFirst([
        sbom(4, "2026-10-08", "2026-10-08T10:00:00+00:00"),
        sbom(5, "2026-10-08", "2026-10-08T10:00:00+00:00"),
      ]).map((row) => [row.id, row.standing]),
    ).toEqual([
      [uuid(5), true],
      [uuid(4), false],
    ]);
    expect(newestSbomFirst([])).toEqual([]);
  });
});

describe("reading an SBOM document", () => {
  const cyclonedx = {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: "urn:uuid:63d63818-ca79-406b-939d-74a552feae25",
    version: 1,
    metadata: {
      timestamp: "2026-10-08T14:03:11Z",
      component: {
        type: "firmware",
        "bom-ref": "image",
        name: "mission-computer-image",
        version: "1.0.0",
      },
    },
    components: [
      {
        type: "application",
        "bom-ref": "pkg:generic/openssh@9.6p1",
        name: "openssh-server",
        version: "9.6p1",
        supplier: { name: "OpenBSD" },
        purl: "pkg:generic/openssh@9.6p1",
        cpe: "cpe:2.3:a:openbsd:openssh:9.6:p1:*:*:*:*:*:*",
        licenses: [{ license: { id: "BSD-2-Clause" } }, { license: { name: "ISC" } }],
        hashes: [
          { alg: "MD5", content: "0f343b0931126a20f133d67c2b018a3b" },
          {
            alg: "SHA-256",
            content: "910211c07255a8c5ad654391b40ee59800710dbcd9ff0b89bb8c8dfc1d95d50d",
          },
        ],
      },
      {
        type: "operating-system",
        name: "linux",
        version: "6.6.30",
        licenses: [{ expression: "GPL-2.0-only WITH Linux-syscall-note" }],
        publisher: "kernel.org",
        // A component nested in another sits inside it, though the outer one gives no reference.
        components: [{ type: "device-driver", name: "e1000e", version: "6.6.30" }],
      },
      { type: "framework", name: "boost", version: "  " },
    ],
  };

  it("reads a CycloneDX document: what it describes first, with what it lists inside it", () => {
    const file = readSbomFile(JSON.stringify(cyclonedx));
    expect(file).toMatchObject({
      format: "cyclonedx",
      specVersion: "1.5",
      serial: "urn:uuid:63d63818-ca79-406b-939d-74a552feae25",
      generatedOn: "2026-10-08",
      title: "mission-computer-image 1.0.0",
    });
    expect(file.components).toEqual([
      { name: "mission-computer-image", version: "1.0.0", kind: "firmware", ref: "image" },
      {
        name: "openssh-server",
        version: "9.6p1",
        kind: "application",
        supplier: "OpenBSD",
        purl: "pkg:generic/openssh@9.6p1",
        cpe: "cpe:2.3:a:openbsd:openssh:9.6:p1:*:*:*:*:*:*",
        license: "BSD-2-Clause, ISC",
        hash: "SHA-256:910211c07255a8c5ad654391b40ee59800710dbcd9ff0b89bb8c8dfc1d95d50d",
        ref: "pkg:generic/openssh@9.6p1",
        parent: "image",
      },
      {
        name: "linux",
        version: "6.6.30",
        kind: "operating-system",
        supplier: "kernel.org",
        license: "GPL-2.0-only WITH Linux-syscall-note",
        ref: "component-1",
        parent: "image",
      },
      // A type the product has no kind for is read with none, and counted.
      { name: "e1000e", version: "6.6.30", parent: "component-1" },
      // A framework is a library; a blank version is no version.
      { name: "boost", kind: "library", parent: "image" },
    ]);
    expect(file.kindsUnread).toBe(1);
    // Every parent names a component of the document, as the import requires.
    const refs = new Set(file.components.map((component) => component.ref));
    for (const component of file.components)
      if (component.parent) expect(refs.has(component.parent)).toBe(true);
  });

  it("lists what a CycloneDX document describes once, and reads one that describes nothing", () => {
    const repeated = readSbomFile(
      JSON.stringify({
        ...cyclonedx,
        components: [cyclonedx.metadata.component, cyclonedx.components[0]],
      }),
    );
    expect(repeated.components.map((component) => [component.name, component.parent])).toEqual([
      ["mission-computer-image", undefined],
      ["openssh-server", undefined],
    ]);
    // A file saved with a byte order mark reads the same.
    const bare = readSbomFile(
      `\uFEFF${JSON.stringify({ bomFormat: "CycloneDX", components: [{ name: "zlib", version: "1.3.1" }] })}`,
    );
    expect(bare).toEqual({
      format: "cyclonedx",
      specVersion: null,
      serial: null,
      generatedOn: null,
      title: null,
      components: [{ name: "zlib", version: "1.3.1" }],
      kindsUnread: 0,
    });
  });

  it("reads an SPDX document: its packages, and what contains what", () => {
    const file = readSbomFile(
      JSON.stringify({
        spdxVersion: "SPDX-2.3",
        SPDXID: "SPDXRef-DOCUMENT",
        name: "audit-log-collector 2.4.0",
        documentNamespace: "https://example.test/spdx/audit-log-collector-2.4.0",
        creationInfo: { created: "2026-11-02T08:00:00Z" },
        packages: [
          {
            SPDXID: "SPDXRef-collector",
            name: "audit-log-collector",
            versionInfo: "2.4.0",
            primaryPackagePurpose: "APPLICATION",
            supplier: "Organization: Air Defense Software",
            licenseConcluded: "NOASSERTION",
            licenseDeclared: "Apache-2.0",
          },
          {
            SPDXID: "SPDXRef-openssl",
            name: "openssl",
            versionInfo: "3.0.13",
            primaryPackagePurpose: "LIBRARY",
            supplier: "NOASSERTION",
            licenseConcluded: "Apache-2.0",
            checksums: [{ algorithm: "SHA256", checksumValue: "88525753f79d3bec27d2fa7c66aa0b92" }],
            externalRefs: [
              {
                referenceCategory: "PACKAGE-MANAGER",
                referenceType: "purl",
                referenceLocator: "pkg:generic/openssl@3.0.13",
              },
              {
                referenceCategory: "SECURITY",
                referenceType: "cpe23Type",
                referenceLocator: "cpe:2.3:a:openssl:openssl:3.0.13:*:*:*:*:*:*:*",
              },
            ],
          },
          {
            SPDXID: "SPDXRef-base",
            name: "debian",
            versionInfo: "12",
            primaryPackagePurpose: "OPERATING_SYSTEM",
          },
          { SPDXID: "SPDXRef-src", name: "collector-src", primaryPackagePurpose: "SOURCE" },
        ],
        relationships: [
          {
            spdxElementId: "SPDXRef-DOCUMENT",
            relationshipType: "DESCRIBES",
            relatedSpdxElement: "SPDXRef-collector",
          },
          {
            spdxElementId: "SPDXRef-collector",
            relationshipType: "CONTAINS",
            relatedSpdxElement: "SPDXRef-openssl",
          },
          {
            spdxElementId: "SPDXRef-base",
            relationshipType: "CONTAINED_BY",
            relatedSpdxElement: "SPDXRef-collector",
          },
          // A dependency is not containment, and a file is no package of the document.
          {
            spdxElementId: "SPDXRef-collector",
            relationshipType: "DEPENDS_ON",
            relatedSpdxElement: "SPDXRef-src",
          },
          {
            spdxElementId: "SPDXRef-File-1",
            relationshipType: "CONTAINS",
            relatedSpdxElement: "SPDXRef-src",
          },
        ],
      }),
    );
    expect(file).toMatchObject({
      format: "spdx",
      specVersion: "2.3",
      serial: "https://example.test/spdx/audit-log-collector-2.4.0",
      generatedOn: "2026-11-02",
      title: "audit-log-collector 2.4.0",
      kindsUnread: 1,
    });
    expect(file.components).toEqual([
      {
        name: "audit-log-collector",
        version: "2.4.0",
        kind: "application",
        supplier: "Air Defense Software",
        license: "Apache-2.0",
        ref: "SPDXRef-collector",
      },
      {
        name: "openssl",
        version: "3.0.13",
        kind: "library",
        purl: "pkg:generic/openssl@3.0.13",
        cpe: "cpe:2.3:a:openssl:openssl:3.0.13:*:*:*:*:*:*:*",
        license: "Apache-2.0",
        hash: "SHA256:88525753f79d3bec27d2fa7c66aa0b92",
        ref: "SPDXRef-openssl",
        parent: "SPDXRef-collector",
      },
      {
        name: "debian",
        version: "12",
        kind: "operating-system",
        ref: "SPDXRef-base",
        parent: "SPDXRef-collector",
      },
      { name: "collector-src", ref: "SPDXRef-src" },
    ]);
  });

  it("says in the reader's words what stops it", () => {
    expect(() => readSbomFile("<bom xmlns='http://cyclonedx.org/schema/bom/1.5'/>")).toThrow(
      SBOM_NOT_JSON,
    );
    for (const document of [[], "an SBOM", { name: "release notes" }, { bomFormat: "SWID" }])
      expect(() => readSbomFile(JSON.stringify(document))).toThrow(SBOM_UNKNOWN_FORMAT);
    for (const document of [
      { bomFormat: "CycloneDX", components: [] },
      { spdxVersion: "SPDX-2.3", packages: [] },
    ])
      expect(() => readSbomFile(JSON.stringify(document))).toThrow(SBOM_NO_COMPONENTS);
    const many = Array.from({ length: SBOM_COMPONENT_LIMIT + 1 }, (_, index) => ({
      name: `package-${index}`,
    }));
    expect(() =>
      readSbomFile(JSON.stringify({ bomFormat: "CycloneDX", components: many })),
    ).toThrow(SBOM_TOO_MANY);
    // The most an import takes is read.
    expect(
      readSbomFile(JSON.stringify({ bomFormat: "CycloneDX", components: many.slice(1) }))
        .components,
    ).toHaveLength(SBOM_COMPONENT_LIMIT);
    expect(() =>
      readSbomFile(
        JSON.stringify({
          bomFormat: "CycloneDX",
          components: [{ name: "zlib" }, { version: "1.0" }, { name: " " }],
        }),
      ),
    ).toThrow("Every component needs a name; 2 of this SBOM's have none.");
    expect(sbomUnnamed(1)).toBe("Every component needs a name; 1 of this SBOM's has none.");
  });
});

describe("importing an SBOM", () => {
  const components = [
    { name: "mission-computer-image", version: "1.0.0", kind: "firmware" as const, ref: "image" },
    { name: "openssh-server", version: "9.6p1", parent: "image", purl: undefined },
  ];
  const sbom = {
    subject: { definedComponentId: uuid(10) },
    title: " Mission Computer maintenance image SBOM ",
    format: "cyclonedx" as const,
    specVersion: "1.5",
    serial: null,
    generatedOn: "2026-10-08",
    components,
    requestId: uuid(99),
  };
  const answered = {
    sbomId: uuid(20),
    definedComponentId: uuid(10),
    inventoryItemId: null,
    title: "Mission Computer maintenance image SBOM",
    format: "cyclonedx",
    generatedOn: "2026-10-08",
    components: 2,
    standing: true,
    revision: 1,
  };

  it("takes what the product records of a document, in its words", () => {
    expect([...SBOM_FORMATS]).toEqual(["cyclonedx", "spdx", "other"]);
    expect([...SBOM_COMPONENT_KINDS]).toEqual([
      "library",
      "application",
      "operating-system",
      "firmware",
      "container",
      "device",
      "file",
    ]);
  });

  it("sends the SBOM and every component in one request, naming its one subject", async () => {
    const { client, calls } = rpc(answered);
    await expect(importSbom(client, context, sbom)).resolves.toEqual(answered);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("rpc:import_sbom");
    expect(sent(calls[0])).toEqual({
      p_tenant_id: uuid(1),
      p_defined_component_id: uuid(10),
      p_inventory_item_id: null,
      p_title: "Mission Computer maintenance image SBOM",
      p_format: "cyclonedx",
      p_spec_version: "1.5",
      p_serial: null,
      p_generated_on: "2026-10-08",
      p_evidence_artifact_id: null,
      // Only what the document gave of each component.
      p_components: [
        { name: "mission-computer-image", version: "1.0.0", kind: "firmware", ref: "image" },
        { name: "openssh-server", version: "9.6p1", parent: "image" },
      ],
      p_request_id: uuid(99),
    });
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
  });

  it("names an asset as the subject, with the evidence artifact that holds the document", async () => {
    const { client, calls } = rpc({
      ...answered,
      definedComponentId: null,
      inventoryItemId: uuid(25),
      standing: false,
    });
    const imported = await importSbom(client, context, {
      ...sbom,
      subject: { inventoryItemId: uuid(25) },
      evidenceArtifactId: uuid(26),
    });
    // Not the standing one when a later SBOM of the asset was already recorded.
    expect(imported.standing).toBe(false);
    expect(sent(calls[0])).toMatchObject({
      p_defined_component_id: null,
      p_inventory_item_id: uuid(25),
      p_evidence_artifact_id: uuid(26),
    });
  });

  it("says what stops an import on the field that fixes it, and sends nothing", async () => {
    expect(sbomImportIssues({ title: " ", generatedOn: null, components: [] })).toEqual([
      { field: "title", message: SBOM_NEEDS_TITLE },
      { field: "generatedOn", message: SBOM_NEEDS_DAY },
      { field: "components", message: SBOM_NO_COMPONENTS },
    ]);
    expect(
      sbomImportIssues({
        title: "SBOM",
        generatedOn: "2026-10-08T14:03:11Z",
        components: Array.from({ length: SBOM_COMPONENT_LIMIT + 1 }),
      }),
    ).toEqual([
      { field: "generatedOn", message: SBOM_NEEDS_DAY },
      { field: "components", message: SBOM_TOO_MANY },
    ]);
    expect(sbomImportIssues(sbom)).toEqual([]);
    const { client, calls } = rpc(answered);
    await expect(importSbom(client, context, { ...sbom, title: "" })).rejects.toThrow(
      SBOM_NEEDS_TITLE,
    );
    await expect(importSbom(client, context, { ...sbom, generatedOn: "" })).rejects.toThrow(
      SBOM_NEEDS_DAY,
    );
    await expect(
      importSbom(client, context, { ...sbom, subject: { definedComponentId: "" } }),
    ).rejects.toThrow(SBOM_NEEDS_SUBJECT);
    expect(calls).toEqual([]);
  });

  it("says each refusal in the command's own words, and an answer it cannot read", async () => {
    for (const [message, said] of [
      [
        "openssl 3.0.13 is listed more than once. List each component and version once.",
        "openssl 3.0.13 is listed more than once. List each component and version once.",
      ],
      [
        "zlib names a parent, image, that is not a component of this SBOM",
        "zlib names a parent, image, that is not a component of this SBOM.",
      ],
      [
        "This import request was already used with different details",
        "This import request was already used with different details.",
      ],
    ] as const) {
      const { client } = rpc(null, { message });
      await expect(importSbom(client, context, sbom)).rejects.toThrow(said);
    }
    const unread = rpc({ ...answered, standing: "yes" });
    await expect(importSbom(unread.client, context, sbom)).rejects.toThrow(SBOM_IMPORT_UNREADABLE);
  });
});

describe("opening a CVE's operational issues", () => {
  const request = { vulnerabilityId: uuid(30), requestId: uuid(99) };
  const answered = {
    vulnerabilityId: uuid(30),
    cveId: "CVE-2024-6387",
    componentVersions: 1,
    programs: 2,
    issues: [
      { programId: uuid(53), issueId: uuid(61) },
      { programId: uuid(56), issueId: uuid(62) },
    ],
    held: 1,
  };

  it("sends one request for the CVE, and reads what it opened and which programs held one", async () => {
    const { client, calls } = rpc(answered);
    await expect(openVulnerabilityIssues(client, context, request)).resolves.toEqual(answered);
    expect(calls[0]?.table).toBe("rpc:open_vulnerability_issues");
    expect(sent(calls[0])).toEqual({
      p_tenant_id: uuid(1),
      p_vulnerability_id: uuid(30),
      p_request_id: uuid(99),
    });
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
  });

  it("reads a CVE that affects no version as opening nothing", async () => {
    const { client } = rpc({ ...answered, componentVersions: 0, programs: 0, issues: [], held: 0 });
    await expect(openVulnerabilityIssues(client, context, request)).resolves.toMatchObject({
      componentVersions: 0,
      programs: 0,
      issues: [],
    });
  });

  it("sends nothing without the CVE, and says a refusal or an unreadable answer", async () => {
    const unsent = rpc(answered);
    await expect(
      openVulnerabilityIssues(unsent.client, context, { ...request, vulnerabilityId: "" }),
    ).rejects.toThrow(VULNERABILITY_NEEDS_CVE);
    expect(unsent.calls).toEqual([]);
    const refused = rpc(null, {
      message: "An editor, admin, or owner can open a CVE's operational issues",
    });
    await expect(openVulnerabilityIssues(refused.client, context, request)).rejects.toThrow(
      "An editor, admin, or owner can open a CVE's operational issues.",
    );
    const unread = rpc({ ...answered, programs: -1 });
    await expect(openVulnerabilityIssues(unread.client, context, request)).rejects.toThrow(
      VULNERABILITY_ISSUES_UNREADABLE,
    );
  });
});
