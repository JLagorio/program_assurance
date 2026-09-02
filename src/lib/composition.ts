/**
 * Chunk 9 of the CCI spine — system composition (HBOM / FBOM / SBOM).
 *
 * A Composition node is one item the system is made of: a chassis, a board, a
 * switch ASIC, a bootloader, a firmware image, an OS, a container layer, a
 * package, a library. The graph it forms is a strict parent-pointer TREE of
 * *instances* — every node has exactly one parent and exactly one node has
 * none. "The same library on two hosts" is therefore two nodes that share one
 * `partKey`, never one node with two parents; `partKey` is the fleet identity
 * and the tree stays O(depth) to walk and impossible to cycle through.
 *
 * Invariants held here:
 *  - Every node belongs to exactly one program and names exactly one parent
 *    (or null for the root).
 *  - `Asset` is ANCHORED to the graph, not replaced by it: exactly one node per
 *    tracked asset carries that asset's AST- id in `asset`. Assets remain the
 *    boundary inventory; nodes are what the boundary is built out of.
 *  - Reachability is a SEPARATE edge list, because containment cannot say "the
 *    container talks to the database". A trust boundary is DERIVED by comparing
 *    the ordinal `zone` rank of an edge's two ends — it is never its own edge
 *    kind.
 *  - Traversal is cycle-safe by construction: every walk carries an explicit
 *    visited set, so a malformed chain yields a truncated result, never a hang.
 *  - The store is real from day one (overrides / cache / listeners /
 *    useSyncExternalStore) because nodes get created and re-classified at
 *    runtime; `graphVersion()` bumps on every mutation so downstream caches can
 *    key off it.
 *
 * This module imports the spine only. Findings point at nodes by bare string id
 * so that `findings.ts` never has to import this file.
 */

import { useSyncExternalStore } from "react";

export type NodeClass = "System" | "Hardware" | "Firmware" | "Software";

export type NodeKind =
  | "System"
  | "Subsystem"
  | "Enclave"
  | "Chassis"
  | "Board"
  | "Chip"
  | "Peripheral"
  | "Bootloader"
  | "Firmware image"
  | "Operating system"
  | "Hypervisor"
  | "Container image"
  | "Runtime"
  | "Application"
  | "Service"
  | "Package"
  | "Library";

export type BomSource =
  "CycloneDX" | "SPDX" | "Hardware part list" | "Firmware manifest" | "Declared" | "Discovery scan";

export type SupplierOrigin = "Internal" | "Domestic" | "Allied" | "Foreign" | "Unknown";

export type Criticality =
  "Mission critical" | "Mission essential" | "Mission support" | "Non-critical";

/** Ordinal — index in this array IS the trust rank, lowest is least trusted. */
export const trustZones = ["Public", "DMZ", "Enclave", "Management", "Isolated"] as const;
export type TrustZone = (typeof trustZones)[number];

export type CompositionNode = {
  id: string; // CN-
  name: string;
  kind: NodeKind;
  class: NodeClass;
  parent: string | null; // CN- — strict tree, exactly one parent
  program: string; // PRG-
  /** "—" when the thing does not carry a version. */
  version: string;
  supplier: string;
  origin: SupplierOrigin;
  criticality: Criticality;
  zone: TrustZone;
  bomSource: BomSource;
  /** BOM- document that asserted this node, or null when hand-declared. */
  bom: string | null;
  /** Fleet-wide identity. purl-ish for software, "hw:<vendor>/<part>" for hardware. */
  partKey: string;
  /** AST- when this node IS a tracked boundary asset. Exactly one node per asset. */
  asset: string | null;
  /** Supplier attestation / SBOM attestation on file. */
  attested: boolean;
  note: string;
  digest?: string; // sha256:... — firmware images and container layers only
  partNumber?: string; // hardware only
  eol?: string; // "MMM DD, YYYY" — omit the key when unknown
};

export type EdgeKind = "Depends on" | "Connects to" | "Flows to" | "Hosts" | "Authenticates to";

export type CompositionEdge = {
  from: string; // CN-
  to: string; // CN-
  kind: EdgeKind;
  /** Protocol / port / data label, e.g. "TCP 5432 — mission telemetry". */
  via: string;
  /** True when there is no redundant path; drives blast radius and exposure weighting. */
  critical: boolean;
};

export type BomDocument = {
  id: string; // BOM-
  name: string;
  format: BomSource;
  specVersion: string;
  producer: string;
  received: string; // "MMM DD, YYYY"
  sha256: string;
  components: number;
  program: string; // PRG-
  /** CN- the document describes the subtree of. */
  subject: string;
  signed: boolean;
};

/* ── The composition of PRG-1041 ─────────────────────────────────────────── */

export const compositionNodes: CompositionNode[] = [
  {
    id: "CN-0001",
    name: "Atlas payments platform",
    kind: "System",
    class: "System",
    parent: null,
    program: "PRG-1041",
    version: "—",
    supplier: "Atlas program office",
    origin: "Internal",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "Declared",
    bom: null,
    partKey: "sys:atlas/atlas-prod",
    asset: null,
    attested: true,
    note: "Authorization boundary for atlas-prod in AWS GovCloud. Categorized High / High / Moderate.",
  },
  {
    id: "CN-0100",
    name: "Ground control segment",
    kind: "Subsystem",
    class: "System",
    parent: "CN-0001",
    program: "PRG-1041",
    version: "—",
    supplier: "Atlas program office",
    origin: "Internal",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "Declared",
    bom: null,
    partKey: "sys:atlas/ground-control-segment",
    asset: null,
    attested: true,
    note: "The bare-metal application and database tier operated by Platform ops out of Sierra Vista.",
  },
  {
    id: "CN-0110",
    name: "gcs-app-01",
    kind: "Chassis",
    class: "Hardware",
    parent: "CN-0100",
    program: "PRG-1041",
    version: "—",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "Declared",
    bom: null,
    partKey: "hw:dell/poweredge-r760",
    asset: "AST-0117",
    attested: true,
    partNumber: "R760-CHS",
    note: "Primary application-tier host. Carries the boundary asset record AST-0117.",
  },
  {
    id: "CN-0111",
    name: "PowerEdge R760 mainboard",
    kind: "Board",
    class: "Hardware",
    parent: "CN-0110",
    program: "PRG-1041",
    version: "Rev A03",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission essential",
    zone: "Enclave",
    bomSource: "Hardware part list",
    bom: "BOM-0003",
    partKey: "hw:dell/r760-mb",
    asset: null,
    attested: true,
    partNumber: "R760-MB",
    note: "Dual-socket Sapphire Rapids mainboard delivered under the FY26 ground segment refresh.",
  },
  {
    id: "CN-0112",
    name: "UEFI BIOS 2.14.1",
    kind: "Firmware image",
    class: "Firmware",
    parent: "CN-0111",
    program: "PRG-1041",
    version: "2.14.1",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "Firmware manifest",
    bom: "BOM-0003",
    partKey: "fw:dell/r760-bios@2.14.1",
    asset: null,
    attested: true,
    digest: "sha256:857e881b911b2b73d19a271d43e6547423a4670f411db0c1a79031926dbccbcf",
    note: "Secure Boot enabled with the DoD PKI db; measured boot extends PCRs 0-7 to the TPM 2.0 module.",
  },
  {
    id: "CN-0116",
    name: "Broadcom BCM57414 25GbE adapter",
    kind: "Peripheral",
    class: "Hardware",
    parent: "CN-0111",
    program: "PRG-1041",
    version: "Rev B1",
    supplier: "Broadcom",
    origin: "Domestic",
    criticality: "Mission support",
    zone: "Enclave",
    bomSource: "Hardware part list",
    bom: "BOM-0003",
    partKey: "hw:broadcom/bcm57414",
    asset: null,
    attested: true,
    partNumber: "BCM57414-OCP3",
    note: "OCP 3.0 dual-port adapter carrying the application VLAN and the storage VLAN on separate ports.",
  },
  {
    id: "CN-0117",
    name: "iDRAC9 BMC firmware 7.10.50.10",
    kind: "Firmware image",
    class: "Firmware",
    parent: "CN-0111",
    program: "PRG-1041",
    version: "7.10.50.10",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission support",
    zone: "Management",
    bomSource: "Firmware manifest",
    bom: "BOM-0003",
    partKey: "fw:dell/idrac9@7.10.50.10",
    asset: null,
    attested: true,
    digest: "sha256:f7dda7db68e981b3da0822d5cefb848d9f9083e4e1862053e3b6c90991b96013",
    note: "Out-of-band management processor. Reachable only from the management VLAN behind the jump host.",
  },
  {
    id: "CN-0113",
    name: "RHEL 9.4 kernel 5.14.0-427",
    kind: "Operating system",
    class: "Software",
    parent: "CN-0110",
    program: "PRG-1041",
    version: "5.14.0-427.28.1.el9_4",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "SPDX",
    bom: "BOM-0002",
    partKey: "pkg:rpm/kernel@5.14.0-427",
    asset: null,
    attested: true,
    eol: "May 31, 2026",
    note: "Golden image build gcs-rhel94-0812 with FIPS mode enabled and the DISA RHEL 9 STIG profile applied.",
  },
  {
    id: "CN-0114",
    name: "openssh-server 8.7p1",
    kind: "Package",
    class: "Software",
    parent: "CN-0113",
    program: "PRG-1041",
    version: "8.7p1-38.el9",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission essential",
    zone: "Enclave",
    bomSource: "SPDX",
    bom: "BOM-0002",
    partKey: "pkg:rpm/openssh-server@8.7p1",
    asset: null,
    attested: true,
    note: "The privileged remote access interface. sshd_config is the artifact V-257984 is checked against.",
  },
  {
    id: "CN-0115",
    name: "audit 3.0.7",
    kind: "Package",
    class: "Software",
    parent: "CN-0113",
    program: "PRG-1041",
    version: "3.0.7-104.el9",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission support",
    zone: "Enclave",
    bomSource: "SPDX",
    bom: "BOM-0002",
    partKey: "pkg:rpm/audit@3.0.7",
    asset: null,
    attested: true,
    note: "auditd plus the augenrules ruleset that feeds rsyslog forwarding to the enclave aggregator.",
  },
  {
    id: "CN-0118",
    name: "openssl 3.0.7",
    kind: "Package",
    class: "Software",
    parent: "CN-0113",
    program: "PRG-1041",
    version: "3.0.7-27.el9",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "SPDX",
    bom: "BOM-0002",
    partKey: "pkg:rpm/openssl@3.0.7",
    asset: null,
    attested: true,
    eol: "Sep 07, 2026",
    note: "Provides the FIPS 140-3 validated provider the host TLS and SSH stacks are bound to.",
  },
  {
    id: "CN-0120",
    name: "gcs-app-02",
    kind: "Chassis",
    class: "Hardware",
    parent: "CN-0100",
    program: "PRG-1041",
    version: "—",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "Declared",
    bom: null,
    partKey: "hw:dell/poweredge-r760",
    asset: "AST-0118",
    attested: true,
    partNumber: "R760-CHS",
    note: "Peer application-tier host, identical build to gcs-app-01. Carries AST-0118.",
  },
  {
    id: "CN-0121",
    name: "PowerEdge R760 mainboard",
    kind: "Board",
    class: "Hardware",
    parent: "CN-0120",
    program: "PRG-1041",
    version: "Rev A03",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission essential",
    zone: "Enclave",
    bomSource: "Hardware part list",
    bom: "BOM-0003",
    partKey: "hw:dell/r760-mb",
    asset: null,
    attested: true,
    partNumber: "R760-MB",
    note: "Same part as CN-0111 — one part key, two instances. Fleet actions apply to both.",
  },
  {
    id: "CN-0123",
    name: "UEFI BIOS 2.14.1",
    kind: "Firmware image",
    class: "Firmware",
    parent: "CN-0121",
    program: "PRG-1041",
    version: "2.14.1",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "Firmware manifest",
    bom: "BOM-0003",
    partKey: "fw:dell/r760-bios@2.14.1",
    asset: null,
    attested: true,
    digest: "sha256:857e881b911b2b73d19a271d43e6547423a4670f411db0c1a79031926dbccbcf",
    note: "Digest matches CN-0112, so the pair is provably on the same firmware level.",
  },
  {
    id: "CN-0122",
    name: "RHEL 9.4 kernel 5.14.0-427",
    kind: "Operating system",
    class: "Software",
    parent: "CN-0120",
    program: "PRG-1041",
    version: "5.14.0-427.28.1.el9_4",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "SPDX",
    bom: "BOM-0002",
    partKey: "pkg:rpm/kernel@5.14.0-427",
    asset: null,
    attested: true,
    eol: "May 31, 2026",
    note: "Same golden image as gcs-app-01, but the operator profile here ships without tmux lock-after-time.",
  },
  {
    id: "CN-0124",
    name: "openssh-server 8.7p1",
    kind: "Package",
    class: "Software",
    parent: "CN-0122",
    program: "PRG-1041",
    version: "8.7p1-38.el9",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission essential",
    zone: "Enclave",
    bomSource: "SPDX",
    bom: "BOM-0002",
    partKey: "pkg:rpm/openssh-server@8.7p1",
    asset: null,
    attested: true,
    note: "Second instance of the same package key as CN-0114; the GSSAPI setting here was already corrected.",
  },
  {
    id: "CN-0130",
    name: "gcs-db-01",
    kind: "Chassis",
    class: "Hardware",
    parent: "CN-0100",
    program: "PRG-1041",
    version: "—",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Isolated",
    bomSource: "Declared",
    bom: null,
    partKey: "hw:dell/poweredge-r660",
    asset: "AST-0507",
    attested: true,
    partNumber: "R660-CHS",
    note: "Database host on the isolated data VLAN. Carries AST-0507; no inbound path except from the app tier.",
  },
  {
    id: "CN-0133",
    name: "PowerEdge R660 mainboard",
    kind: "Board",
    class: "Hardware",
    parent: "CN-0130",
    program: "PRG-1041",
    version: "Rev A01",
    supplier: "Dell Technologies",
    origin: "Domestic",
    criticality: "Mission essential",
    zone: "Isolated",
    bomSource: "Hardware part list",
    bom: "BOM-0003",
    partKey: "hw:dell/r660-mb",
    asset: null,
    attested: true,
    partNumber: "R660-MB",
    note: "1U mainboard with eight NVMe bays carrying the write-ahead log and the audit spool.",
  },
  {
    id: "CN-0131",
    name: "RHEL 9.4 kernel 5.14.0-427",
    kind: "Operating system",
    class: "Software",
    parent: "CN-0130",
    program: "PRG-1041",
    version: "5.14.0-427.28.1.el9_4",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Isolated",
    bomSource: "SPDX",
    bom: "BOM-0002",
    partKey: "pkg:rpm/kernel@5.14.0-427",
    asset: null,
    attested: true,
    eol: "May 31, 2026",
    note: "Third instance of the ground segment kernel key; a kernel action here is a three-host action.",
  },
  {
    id: "CN-0132",
    name: "PostgreSQL 15.6",
    kind: "Package",
    class: "Software",
    parent: "CN-0130",
    program: "PRG-1041",
    version: "15.6-1PGDG.rhel9",
    supplier: "PostgreSQL Global Development Group",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Isolated",
    bomSource: "SPDX",
    bom: "BOM-0002",
    partKey: "pkg:rpm/postgresql-server@15.6",
    asset: null,
    attested: true,
    eol: "Nov 11, 2027",
    note: "System of record for payment state. pgaudit writes to the local spool that rsyslog drains upstream.",
  },
  {
    id: "CN-0200",
    name: "Mission software",
    kind: "Subsystem",
    class: "System",
    parent: "CN-0001",
    program: "PRG-1041",
    version: "—",
    supplier: "Atlas program office",
    origin: "Internal",
    criticality: "Mission critical",
    zone: "DMZ",
    bomSource: "Declared",
    bom: null,
    partKey: "sys:atlas/mission-software",
    asset: null,
    attested: true,
    note: "Containerized service tier behind the mesh ingress, plus the identity provider it authenticates to.",
  },
  {
    id: "CN-0210",
    name: "mission-api:2.14.0",
    kind: "Container image",
    class: "Software",
    parent: "CN-0200",
    program: "PRG-1041",
    version: "2.14.0",
    supplier: "Atlas mission software",
    origin: "Internal",
    criticality: "Mission critical",
    zone: "DMZ",
    bomSource: "CycloneDX",
    bom: "BOM-0001",
    partKey: "pkg:oci/mission-api@2.14.0",
    asset: "AST-0203",
    attested: true,
    digest: "sha256:72591e579afd0f029ac0caff912107bdd9f180a675405ae2f8a787e6fe4670f1",
    note: "The published tag running in production. Carries AST-0203; the image digest is what the mesh admits.",
  },
  {
    id: "CN-0211",
    name: "ubuntu 22.04 base layer",
    kind: "Operating system",
    class: "Software",
    parent: "CN-0210",
    program: "PRG-1041",
    version: "22.04.4 LTS",
    supplier: "Canonical",
    origin: "Allied",
    criticality: "Mission essential",
    zone: "DMZ",
    bomSource: "CycloneDX",
    bom: "BOM-0001",
    partKey: "pkg:oci/ubuntu@22.04",
    asset: null,
    attested: true,
    digest: "sha256:29ad08166aade176aae4510e54ec815a2ce7efbb9110379326573e82452a2a2e",
    note: "Unhardened upstream parent layer; the hardened parent carrying openssl 3.0.13 is the rebase target.",
  },
  {
    id: "CN-0212",
    name: "openssl 3.0.11",
    kind: "Package",
    class: "Software",
    parent: "CN-0210",
    program: "PRG-1041",
    version: "3.0.11-1ubuntu2",
    supplier: "OpenSSL Project",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "DMZ",
    bomSource: "CycloneDX",
    bom: "BOM-0001",
    partKey: "pkg:deb/openssl@3.0.11",
    asset: null,
    attested: true,
    eol: "Sep 07, 2026",
    note: "Pinned by the base layer. CVE-2024-2511 is unremediated at this version in the published tag.",
  },
  {
    id: "CN-0213",
    name: "github.com/gorilla/mux v1.8.0",
    kind: "Library",
    class: "Software",
    parent: "CN-0210",
    program: "PRG-1041",
    version: "v1.8.0",
    supplier: "Unknown",
    origin: "Unknown",
    criticality: "Mission essential",
    zone: "DMZ",
    bomSource: "CycloneDX",
    bom: "BOM-0001",
    partKey: "pkg:golang/github.com/gorilla/mux@v1.8.0",
    asset: null,
    attested: false,
    note: "Vendored HTTP router. Fetched outside the internal proxy, so no provenance was captured at build.",
  },
  {
    id: "CN-0214",
    name: "github.com/lestrrat-go/jwx v2.0.19",
    kind: "Library",
    class: "Software",
    parent: "CN-0210",
    program: "PRG-1041",
    version: "v2.0.19",
    supplier: "Unknown",
    origin: "Unknown",
    criticality: "Mission critical",
    zone: "DMZ",
    bomSource: "CycloneDX",
    bom: "BOM-0001",
    partKey: "pkg:golang/github.com/lestrrat-go/jwx@v2.0.19",
    asset: null,
    attested: false,
    note: "Validates every OIDC access token the service accepts, and its chain of custody cannot be shown.",
  },
  {
    id: "CN-0215",
    name: "mission-api service",
    kind: "Service",
    class: "Software",
    parent: "CN-0210",
    program: "PRG-1041",
    version: "2.14.0",
    supplier: "Atlas mission software",
    origin: "Internal",
    criticality: "Mission critical",
    zone: "DMZ",
    bomSource: "Declared",
    bom: null,
    partKey: "svc:atlas/mission-api",
    asset: null,
    attested: true,
    note: "The running workload: 6 replicas behind the mesh, exposing /v1 to partners and /metrics to the mesh.",
  },
  {
    id: "CN-0220",
    name: "keycloak-idp",
    kind: "Application",
    class: "Software",
    parent: "CN-0200",
    program: "PRG-1041",
    version: "24.0.5",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "Declared",
    bom: null,
    partKey: "app:atlas/keycloak-idp",
    asset: "AST-0402",
    attested: true,
    note: "The program's OIDC provider instance. Carries AST-0402; inherits its platform from CMP-014 idp-core.",
  },
  {
    id: "CN-0221",
    name: "Keycloak 24.0.5",
    kind: "Application",
    class: "Software",
    parent: "CN-0220",
    program: "PRG-1041",
    version: "24.0.5",
    supplier: "Red Hat",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "CycloneDX",
    bom: "BOM-0005",
    partKey: "pkg:maven/org.keycloak/keycloak-server@24.0.5",
    asset: null,
    attested: true,
    eol: "Feb 28, 2025",
    note: "Holds the atlas realm, the break-glass realm and the client registrations mission-api authenticates with.",
  },
  {
    id: "CN-0222",
    name: "OpenJDK 21.0.3",
    kind: "Runtime",
    class: "Software",
    parent: "CN-0220",
    program: "PRG-1041",
    version: "21.0.3+9",
    supplier: "Eclipse Adoptium",
    origin: "Allied",
    criticality: "Mission essential",
    zone: "Enclave",
    bomSource: "CycloneDX",
    bom: "BOM-0005",
    partKey: "pkg:generic/openjdk@21.0.3",
    asset: null,
    attested: true,
    eol: "Dec 31, 2029",
    note: "Temurin 21 LTS build hosting the Keycloak distribution, started with the FIPS security providers.",
  },
  {
    id: "CN-0223",
    name: "Bouncy Castle FIPS 1.0.2.4",
    kind: "Library",
    class: "Software",
    parent: "CN-0222",
    program: "PRG-1041",
    version: "1.0.2.4",
    supplier: "Legion of the Bouncy Castle",
    origin: "Allied",
    criticality: "Mission critical",
    zone: "Enclave",
    bomSource: "CycloneDX",
    bom: "BOM-0005",
    partKey: "pkg:maven/org.bouncycastle/bc-fips@1.0.2.4",
    asset: null,
    attested: true,
    note: "CMVP certificate 4616. Every token signature and realm secret in the IdP is produced through it.",
  },
  {
    id: "CN-0300",
    name: "Tactical edge",
    kind: "Subsystem",
    class: "System",
    parent: "CN-0001",
    program: "PRG-1041",
    version: "—",
    supplier: "Atlas program office",
    origin: "Internal",
    criticality: "Mission essential",
    zone: "Public",
    bomSource: "Declared",
    bom: null,
    partKey: "sys:atlas/tactical-edge",
    asset: null,
    attested: true,
    note: "Deployed transport at the forward site. Untrusted transit; everything above it treats this as public.",
  },
  {
    id: "CN-0310",
    name: "edge-sw-a1",
    kind: "Chassis",
    class: "Hardware",
    parent: "CN-0300",
    program: "PRG-1041",
    version: "—",
    supplier: "Cisco Systems",
    origin: "Domestic",
    criticality: "Mission essential",
    zone: "Public",
    bomSource: "Declared",
    bom: null,
    partKey: "hw:cisco/c9300-24t",
    asset: "AST-0311",
    attested: true,
    partNumber: "C9300-24T-A",
    note: "Catalyst 9300 aggregating the forward site uplink. Carries AST-0311.",
  },
  {
    id: "CN-0311",
    name: "C9300-24T line board",
    kind: "Board",
    class: "Hardware",
    parent: "CN-0310",
    program: "PRG-1041",
    version: "Rev B2",
    supplier: "Cisco Systems",
    origin: "Domestic",
    criticality: "Mission essential",
    zone: "Public",
    bomSource: "Hardware part list",
    bom: "BOM-0004",
    partKey: "hw:cisco/c9300-24t-linecard",
    asset: null,
    attested: true,
    partNumber: "C9300-24T rev B2",
    note: "24-port copper line board with the uplink module bay populated by a 4x10G network module.",
  },
  {
    id: "CN-0312",
    name: "Marvell 88E6390 switch ASIC",
    kind: "Chip",
    class: "Hardware",
    parent: "CN-0311",
    program: "PRG-1041",
    version: "Rev A2",
    supplier: "Marvell",
    origin: "Foreign",
    criticality: "Mission critical",
    zone: "Public",
    bomSource: "Hardware part list",
    bom: "BOM-0004",
    partKey: "hw:marvell/88e6390",
    asset: null,
    attested: false,
    partNumber: "88E6390-A2-TFJ2C000",
    eol: "Dec 31, 2027",
    note: "Foreign-fabricated forwarding ASIC with no supplier attestation on file — a DoDI 5200.44 critical item.",
  },
  {
    id: "CN-0313",
    name: "IOS-XE 17.9.4a",
    kind: "Firmware image",
    class: "Firmware",
    parent: "CN-0310",
    program: "PRG-1041",
    version: "17.9.4a",
    supplier: "Cisco Systems",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Management",
    bomSource: "Firmware manifest",
    bom: "BOM-0004",
    partKey: "fw:cisco/ios-xe@17.9.4a",
    asset: null,
    attested: true,
    digest: "sha256:29516ec5e274216e7fd22fec9dfe3f63a6892a0bf7d286dcd249003ce1387dcf",
    eol: "Mar 31, 2028",
    note: "Running image. Its vty configuration is where transport input telnet is still accepted.",
  },
  {
    id: "CN-0314",
    name: "ROMMON bootloader 17.9.1r",
    kind: "Bootloader",
    class: "Firmware",
    parent: "CN-0310",
    program: "PRG-1041",
    version: "17.9.1r",
    supplier: "Cisco Systems",
    origin: "Domestic",
    criticality: "Mission critical",
    zone: "Public",
    bomSource: "Firmware manifest",
    bom: "BOM-0004",
    partKey: "fw:cisco/rommon@17.9.1r",
    asset: null,
    attested: false,
    digest: "sha256:d5d8d1c5f2596340f5991076229cc22ce627c428e21987a377a7ea2431117624",
    note: "Pre-boot loader that anchors image verification; the delivered manifest carries no signed attestation.",
  },
];

export const nodeById = new Map(compositionNodes.map((n) => [n.id, n]));

const childIndex = new Map<string, CompositionNode[]>();
const assetIndex = new Map<string, CompositionNode>();
const partKeyIndex = new Map<string, CompositionNode[]>();

for (const n of compositionNodes) {
  if (n.parent) {
    const kids = childIndex.get(n.parent);
    if (kids) kids.push(n);
    else childIndex.set(n.parent, [n]);
  }
  if (n.asset && !assetIndex.has(n.asset)) assetIndex.set(n.asset, n);
  const peers = partKeyIndex.get(n.partKey);
  if (peers) peers.push(n);
  else partKeyIndex.set(n.partKey, [n]);
}

/* ── Delivered BOM documents ─────────────────────────────────────────────── */

export const bomDocuments: BomDocument[] = [
  {
    id: "BOM-0001",
    name: "mission-api 2.14.0 image SBOM",
    format: "CycloneDX",
    specVersion: "1.6",
    producer: "Atlas mission software CI (syft 1.14.0)",
    received: "Aug 26, 2026",
    sha256: "51fd9238a8b7709c73941429b76733c1777fd0fbf09c3679a7dff685aababbb5",
    components: 412,
    program: "PRG-1041",
    subject: "CN-0210",
    signed: true,
  },
  {
    id: "BOM-0002",
    name: "Ground control RHEL 9.4 golden image SBOM",
    format: "SPDX",
    specVersion: "2.3",
    producer: "Platform ops image factory",
    received: "Aug 18, 2026",
    sha256: "61d509c3fab8e5d65ffd19b0f32194390d104d4e91aee11930221c7b6cc4da96",
    components: 1284,
    program: "PRG-1041",
    subject: "CN-0100",
    signed: true,
  },
  {
    id: "BOM-0003",
    name: "Dell PowerEdge ground segment part list",
    format: "Hardware part list",
    specVersion: "1.0",
    producer: "Dell Technologies Federal",
    received: "Apr 12, 2026",
    sha256: "34b76844f9de01964d087cb095087a018380ddcc96c3c763cc734289f27e35ca",
    components: 68,
    program: "PRG-1041",
    subject: "CN-0100",
    signed: true,
  },
  {
    id: "BOM-0004",
    name: "Catalyst 9300 hardware and firmware manifest",
    format: "Firmware manifest",
    specVersion: "1.2",
    producer: "Cisco Systems",
    received: "Jun 02, 2026",
    sha256: "63e249fe625aed4eb87386c4de5fd7c9892f8e69d9f41e7e3d2da7a2b8a29408",
    components: 24,
    program: "PRG-1041",
    subject: "CN-0310",
    signed: true,
  },
  {
    id: "BOM-0005",
    name: "keycloak-idp 24.0.5 component inventory",
    format: "CycloneDX",
    specVersion: "1.5",
    producer: "Identity platform CI (cdxgen 10.9.4)",
    received: "Aug 14, 2026",
    sha256: "032be2cbdc214014b8560adfe7368e2de5ccfb1357ddaf08a5539f75c85bee3d",
    components: 187,
    program: "PRG-1041",
    subject: "CN-0220",
    signed: false,
  },
];

export const bomById = new Map(bomDocuments.map((b) => [b.id, b]));

/* ── Reachability ────────────────────────────────────────────────────────── */

export const compositionEdges: CompositionEdge[] = [
  {
    from: "CN-0310",
    to: "CN-0210",
    kind: "Flows to",
    via: "TCP 443 — tactical uplink",
    critical: true,
  },
  {
    from: "CN-0210",
    to: "CN-0130",
    kind: "Connects to",
    via: "TCP 5432 — mission telemetry writes",
    critical: true,
  },
  {
    from: "CN-0210",
    to: "CN-0220",
    kind: "Authenticates to",
    via: "TCP 8443 — OIDC client credentials and JWKS fetch",
    critical: true,
  },
  {
    from: "CN-0220",
    to: "CN-0130",
    kind: "Connects to",
    via: "TCP 5432 — Keycloak realm store",
    critical: true,
  },
  {
    from: "CN-0110",
    to: "CN-0130",
    kind: "Connects to",
    via: "TCP 5432 — application tier to database",
    critical: false,
  },
  {
    from: "CN-0110",
    to: "CN-0113",
    kind: "Hosts",
    via: "bare metal — RHEL 9.4 on the R760 chassis",
    critical: true,
  },
  {
    from: "CN-0120",
    to: "CN-0122",
    kind: "Hosts",
    via: "bare metal — RHEL 9.4 on the R760 chassis",
    critical: false,
  },
  {
    from: "CN-0130",
    to: "CN-0131",
    kind: "Hosts",
    via: "bare metal — RHEL 9.4 on the R660 chassis",
    critical: true,
  },
  {
    from: "CN-0114",
    to: "CN-0118",
    kind: "Depends on",
    via: "libcrypto.so.3 — FIPS provider for the SSH transport",
    critical: true,
  },
  {
    from: "CN-0215",
    to: "CN-0212",
    kind: "Depends on",
    via: "libssl 3.0.11 — TLS client for downstream calls",
    critical: true,
  },
  {
    from: "CN-0221",
    to: "CN-0222",
    kind: "Depends on",
    via: "JVM 21.0.3 — runtime hosting the Keycloak distribution",
    critical: true,
  },
  {
    from: "CN-0311",
    to: "CN-0312",
    kind: "Depends on",
    via: "MDIO / SGMII — line board to forwarding ASIC",
    critical: true,
  },
];

const edgeFromIndex = new Map<string, CompositionEdge[]>();
const edgeToIndex = new Map<string, CompositionEdge[]>();

for (const e of compositionEdges) {
  const out = edgeFromIndex.get(e.from);
  if (out) out.push(e);
  else edgeFromIndex.set(e.from, [e]);
  const inbound = edgeToIndex.get(e.to);
  if (inbound) inbound.push(e);
  else edgeToIndex.set(e.to, [e]);
}

/* ── Store ───────────────────────────────────────────────────────────────── */

type NodePatch = Partial<Pick<CompositionNode, "criticality" | "zone" | "attested" | "note">>;

const overrides = new Map<string, NodePatch>();
const cache = new Map<string, CompositionNode[]>();
const listeners = new Set<() => void>();
let version = 0;

function resolve(node: CompositionNode): CompositionNode {
  const patch = overrides.get(node.id);
  return patch ? { ...node, ...patch } : node;
}

function lookup(nodeId: string): CompositionNode | null {
  const base = nodeById.get(nodeId);
  return base ? resolve(base) : null;
}

function snapshot(programId: string): CompositionNode[] {
  const hit = cache.get(programId);
  if (hit) return hit;
  const rows = compositionNodes.filter((n) => n.program === programId).map(resolve);
  cache.set(programId, rows);
  return rows;
}

/** Bumps on every mutation so downstream caches can key off it. */
export function graphVersion(): number {
  return version;
}

export function subscribeGraph(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setNodeField(nodeId: string, patch: NodePatch) {
  if (!nodeById.has(nodeId)) return;
  overrides.set(nodeId, { ...overrides.get(nodeId), ...patch });
  cache.clear();
  version += 1;
  for (const l of listeners) l();
}

/* ── Creation ────────────────────────────────────────────────────────────── */

export type NewCompositionNode = Pick<
  CompositionNode,
  "id" | "name" | "kind" | "class" | "parent" | "program"
> &
  Partial<Omit<CompositionNode, "id" | "name" | "kind" | "class" | "parent" | "program">>;

export function nextNodeId(): string {
  const max = compositionNodes.reduce(
    (m, n) => Math.max(m, Number(n.id.replace(/^CN-/, "")) || 0),
    0,
  );
  return `CN-${String(max + 1).padStart(4, "0")}`;
}

function insertNode(input: NewCompositionNode): CompositionNode {
  const hit = nodeById.get(input.id);
  if (hit) return hit;
  const node: CompositionNode = {
    version: "—",
    supplier: "—",
    origin: "Internal",
    criticality: "Mission support",
    zone: "Enclave",
    bomSource: "Declared",
    bom: null,
    partKey: `sys:${input.program.toLowerCase()}/${input.id.toLowerCase()}`,
    asset: null,
    attested: false,
    note: "",
    ...input,
  };
  compositionNodes.push(node);
  nodeById.set(node.id, node);
  if (node.parent) {
    const kids = childIndex.get(node.parent);
    if (kids) kids.push(node);
    else childIndex.set(node.parent, [node]);
  }
  if (node.asset && !assetIndex.has(node.asset)) assetIndex.set(node.asset, node);
  const peers = partKeyIndex.get(node.partKey);
  if (peers) peers.push(node);
  else partKeyIndex.set(node.partKey, [node]);
  return node;
}

/**
 * Declare system elements at runtime — a program's systems and subsystems as
 * the wizard drew them. Parents must precede their children. One bump for the
 * batch; the per-program snapshot cache is cleared so `nodesForProgram` sees
 * the new rows.
 */
export function addCompositionNodes(inputs: NewCompositionNode[]): CompositionNode[] {
  const out = inputs.map(insertNode);
  cache.clear();
  version += 1;
  for (const l of listeners) l();
  return out;
}

/* ── Selectors ───────────────────────────────────────────────────────────── */

export function nodesForProgram(programId: string): CompositionNode[] {
  return snapshot(programId);
}

export function childrenOf(nodeId: string): CompositionNode[] {
  return (childIndex.get(nodeId) ?? []).map(resolve);
}

/** Nearest ancestor first. Cycle-safe: a repeated or missing parent ends the walk. */
export function ancestorsOf(nodeId: string): CompositionNode[] {
  const out: CompositionNode[] = [];
  const seen = new Set<string>([nodeId]);
  let current = nodeById.get(nodeId);
  while (current?.parent) {
    if (seen.has(current.parent)) break;
    seen.add(current.parent);
    const parent = nodeById.get(current.parent);
    if (!parent) break;
    out.push(resolve(parent));
    current = parent;
  }
  return out;
}

/** Pre-order, excluding the node itself. Cycle-safe: one visited set for the whole DFS. */
export function descendantsOf(nodeId: string): CompositionNode[] {
  const out: CompositionNode[] = [];
  const visited = new Set<string>([nodeId]);
  const stack = [...(childIndex.get(nodeId) ?? [])].reverse();
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || visited.has(node.id)) continue;
    visited.add(node.id);
    out.push(resolve(node));
    const kids = childIndex.get(node.id);
    if (kids) for (let i = kids.length - 1; i >= 0; i -= 1) stack.push(kids[i]!);
  }
  return out;
}

export function rootOf(nodeId: string): CompositionNode | null {
  const self = lookup(nodeId);
  if (!self) return null;
  const chain = ancestorsOf(nodeId);
  return chain.length > 0 ? chain[chain.length - 1]! : self;
}

/** Root first, the node itself last. */
export function pathOf(nodeId: string): CompositionNode[] {
  const self = lookup(nodeId);
  if (!self) return [];
  return [...ancestorsOf(nodeId).reverse(), self];
}

export function pathLabel(nodeId: string): string {
  const path = pathOf(nodeId);
  return path.length > 0 ? path.map((n) => n.name).join(" / ") : "—";
}

export function nodeForAsset(assetId: string): CompositionNode | null {
  const node = assetIndex.get(assetId);
  return node ? resolve(node) : null;
}

/** Every instance of the same part across the fleet, this node included. */
export function nodesByPartKey(partKey: string): CompositionNode[] {
  return (partKeyIndex.get(partKey) ?? []).map(resolve);
}

export function trustRank(zone: TrustZone): number {
  return trustZones.indexOf(zone);
}

/** True when the edge's two ends sit at different trust ranks. */
export function crossesBoundary(edge: CompositionEdge): boolean {
  const from = lookup(edge.from);
  const to = lookup(edge.to);
  if (!from || !to) return false;
  return trustRank(from.zone) !== trustRank(to.zone);
}

export function edgesFrom(nodeId: string): CompositionEdge[] {
  return edgeFromIndex.get(nodeId) ?? [];
}

export function edgesTo(nodeId: string): CompositionEdge[] {
  return edgeToIndex.get(nodeId) ?? [];
}

export function bomForNode(nodeId: string): BomDocument | null {
  const node = nodeById.get(nodeId);
  if (!node?.bom) return null;
  return bomById.get(node.bom) ?? null;
}

export function useCompositionGraph(programId: string): CompositionNode[] {
  const get = () => snapshot(programId);
  return useSyncExternalStore(subscribeGraph, get, get);
}
