/**
 * Program people and workstreams.
 *
 * A program is built by hundreds of engineers across very different disciplines.
 * The unit that matters is not the person — it is the workstream: a scoped piece
 * of build work with a lead, a set of disciplines pulled into it, the controls it
 * satisfies, and the other workstreams it cannot finish without. People join the
 * spine through the workstream, and the workstream joins through controls/CCIs.
 */

export const disciplines = [
  "Product security",
  "Offensive security",
  "Anti-tamper",
  "Software",
  "Firmware",
  "Autonomy",
  "Electrical",
  "Mechanical",
  "Manufacturing",
  "Program office",
  "Systems engineering",
  "Test",
] as const;
export type Discipline = (typeof disciplines)[number];

export type Person = {
  id: string; // PPL-
  name: string;
  discipline: Discipline;
  title: string;
  org: string;
  clearance: "Secret" | "Top Secret" | "TS/SCI" | "None";
  site: string;
  email: string;
};

export type WorkstreamStatus = "Active" | "Blocked" | "Planned" | "Done";

export type Assignment = {
  person: string; // PPL-
  role: string;
  allocation: number; // percent of their time on this workstream
};

export type Workstream = {
  id: string; // WS-
  title: string;
  program: string; // PRG-
  stage: "Scope" | "Build" | "Assess" | "Authorize" | "Operate";
  status: WorkstreamStatus;
  lead: string; // PPL-
  objective: string;
  disciplines: Discipline[];
  members: Assignment[];
  dependsOn: string[]; // WS-
  controls: string[];
  ccis: string[];
  gate: string;
  due: string;
  note: string;
};

export const people: Person[] = [
  {
    id: "PPL-0101",
    name: "Priya Raghavan",
    discipline: "Product security",
    title: "Principal product security engineer",
    org: "Product Security",
    clearance: "TS/SCI",
    site: "Huntsville, AL",
    email: "p.raghavan@equinox.mil",
  },
  {
    id: "PPL-0102",
    name: "Marcus Ryde",
    discipline: "Product security",
    title: "Secure boot lead",
    org: "Product Security",
    clearance: "Top Secret",
    site: "Huntsville, AL",
    email: "m.ryde@equinox.mil",
  },
  {
    id: "PPL-0103",
    name: "Dan Whitfield",
    discipline: "Firmware",
    title: "Boot ROM / bootloader engineer",
    org: "Embedded Software",
    clearance: "Secret",
    site: "Huntsville, AL",
    email: "d.whitfield@equinox.mil",
  },
  {
    id: "PPL-0104",
    name: "Elena Vasquez",
    discipline: "Electrical",
    title: "Board bring-up engineer",
    org: "Electrical Engineering",
    clearance: "Secret",
    site: "Huntsville, AL",
    email: "e.vasquez@equinox.mil",
  },
  {
    id: "PPL-0105",
    name: "Tom Okafor",
    discipline: "Manufacturing",
    title: "Test equipment engineer",
    org: "Manufacturing Engineering",
    clearance: "Secret",
    site: "Decatur, AL",
    email: "t.okafor@equinox.mil",
  },
  {
    id: "PPL-0106",
    name: "Hana Lindqvist",
    discipline: "Mechanical",
    title: "Fixture and enclosure design",
    org: "Mechanical Engineering",
    clearance: "None",
    site: "Decatur, AL",
    email: "h.lindqvist@equinox.mil",
  },
  {
    id: "PPL-0107",
    name: "Sarah Chen",
    discipline: "Autonomy",
    title: "Autonomy software architect",
    org: "Mission Autonomy",
    clearance: "Top Secret",
    site: "Boulder, CO",
    email: "s.chen@equinox.mil",
  },
  {
    id: "PPL-0108",
    name: "Wes Duarte",
    discipline: "Offensive security",
    title: "Red team lead",
    org: "Offensive Security",
    clearance: "TS/SCI",
    site: "Remote",
    email: "w.duarte@equinox.mil",
  },
  {
    id: "PPL-0109",
    name: "Ingrid Solberg",
    discipline: "Anti-tamper",
    title: "Anti-tamper engineer",
    org: "Anti-Tamper / TSN",
    clearance: "TS/SCI",
    site: "Huntsville, AL",
    email: "i.solberg@equinox.mil",
  },
  {
    id: "PPL-0110",
    name: "Ray Colston",
    discipline: "Program office",
    title: "Deputy program manager",
    org: "Program Office",
    clearance: "Secret",
    site: "Huntsville, AL",
    email: "r.colston@equinox.mil",
  },
  {
    id: "PPL-0111",
    name: "Amara Bell",
    discipline: "Systems engineering",
    title: "Lead systems engineer",
    org: "Systems Engineering",
    clearance: "Top Secret",
    site: "Huntsville, AL",
    email: "a.bell@equinox.mil",
  },
  {
    id: "PPL-0112",
    name: "Joel Barrantes",
    discipline: "Software",
    title: "Platform / build infrastructure",
    org: "Platform Engineering",
    clearance: "Secret",
    site: "Boulder, CO",
    email: "j.barrantes@equinox.mil",
  },
  {
    id: "PPL-0113",
    name: "Nadia Fournier",
    discipline: "Test",
    title: "Verification engineer",
    org: "Test & Evaluation",
    clearance: "Secret",
    site: "Yuma, AZ",
    email: "n.fournier@equinox.mil",
  },
  {
    id: "PPL-0114",
    name: "Victor Amsel",
    discipline: "Product security",
    title: "Key management / PKI engineer",
    org: "Product Security",
    clearance: "TS/SCI",
    site: "Huntsville, AL",
    email: "v.amsel@equinox.mil",
  },
];

export const workstreams: Workstream[] = [
  {
    id: "WS-0101",
    title: "Secure boot chain of trust on the mission compute module",
    program: "PRG-1041",
    stage: "Build",
    status: "Blocked",
    lead: "PPL-0102",
    objective:
      "Every stage from boot ROM to the autonomy container runtime verifies the next stage against a production key before execution, with rollback protection fuses burned at manufacture.",
    disciplines: ["Product security", "Firmware", "Electrical", "Autonomy"],
    members: [
      { person: "PPL-0102", role: "Workstream lead", allocation: 60 },
      { person: "PPL-0103", role: "Bootloader implementation", allocation: 80 },
      { person: "PPL-0104", role: "SoC fuse map and bring-up", allocation: 30 },
      { person: "PPL-0107", role: "Signed payload integration", allocation: 20 },
      { person: "PPL-0111", role: "Requirements decomposition", allocation: 10 },
    ],
    dependsOn: ["WS-0102", "WS-0103"],
    controls: ["SI-7", "CM-5", "SC-12"],
    ccis: ["CCI-001749", "CCI-002696"],
    gate: "CDR",
    due: "Oct 09, 2026",
    note:
      "Blocked on production signing keys — the boot chain cannot be closed against a development key, so CDR evidence stays provisional until the ceremony in WS-0103 completes.",
  },
  {
    id: "WS-0102",
    title: "Fusing and flashing fixture for the manufacturing line",
    program: "PRG-1041",
    stage: "Build",
    status: "Active",
    lead: "PPL-0104",
    objective:
      "A powered fixture that brings the module up on the line, burns secure-boot and rollback fuses, flashes the signed image, and records the per-unit provisioning log without exposing key material to line operators.",
    disciplines: ["Electrical", "Mechanical", "Manufacturing", "Product security"],
    members: [
      { person: "PPL-0104", role: "Workstream lead — power and interface board", allocation: 50 },
      { person: "PPL-0106", role: "Fixture mechanics and bed-of-nails", allocation: 40 },
      { person: "PPL-0105", role: "Line integration and operator flow", allocation: 60 },
      { person: "PPL-0102", role: "Provisioning protocol review", allocation: 15 },
    ],
    dependsOn: ["WS-0103"],
    controls: ["SC-12", "PE-3", "CM-3"],
    ccis: ["CCI-002696", "CCI-000919"],
    gate: "CDR",
    due: "Sep 26, 2026",
    note:
      "Second fixture revision powers the module from the fixture rather than the flight harness, which removes the hot-plug risk seen in the first bring-up.",
  },
  {
    id: "WS-0103",
    title: "On-prem air-gapped HSM key generation and signing ceremony",
    program: "PRG-1041",
    stage: "Build",
    status: "Blocked",
    lead: "PPL-0114",
    objective:
      "Generate the production signing hierarchy inside an air-gapped FIPS 140-3 Level 3 HSM pair, define the two-person ceremony, and get the signed artifacts to the line and the build system without a network path.",
    disciplines: ["Product security", "Program office", "Manufacturing", "Anti-tamper"],
    members: [
      { person: "PPL-0114", role: "Workstream lead — PKI and ceremony design", allocation: 70 },
      { person: "PPL-0101", role: "Policy, CPS and approval", allocation: 25 },
      { person: "PPL-0109", role: "Tamper response for the HSM enclosure", allocation: 20 },
      { person: "PPL-0110", role: "Facility, custodians and scheduling", allocation: 15 },
      { person: "PPL-0105", role: "Transfer media handling on the line", allocation: 10 },
    ],
    dependsOn: [],
    controls: ["SC-12", "SC-13", "MP-5", "PE-3"],
    ccis: ["CCI-002696", "CCI-001199"],
    gate: "CDR",
    due: "Sep 18, 2026",
    note:
      "Blocked on the SCIF slot for the ceremony. Key custodians are named but the second custodian has not cleared the facility read-on yet.",
  },
  {
    id: "WS-0104",
    title: "Signed artifact pipeline from build system to line",
    program: "PRG-1041",
    stage: "Build",
    status: "Active",
    lead: "PPL-0112",
    objective:
      "Reproducible builds emit an SBOM and a detached signature request; the air-gap transfer set is the only path into the signing enclave and back out to the flashing fixture.",
    disciplines: ["Software", "Product security", "Manufacturing"],
    members: [
      { person: "PPL-0112", role: "Workstream lead — pipeline", allocation: 55 },
      { person: "PPL-0107", role: "Autonomy image reproducibility", allocation: 25 },
      { person: "PPL-0114", role: "Signature request format", allocation: 15 },
    ],
    dependsOn: ["WS-0103"],
    controls: ["CM-5", "SA-10", "SR-4"],
    ccis: ["CCI-001749"],
    gate: "CDR",
    due: "Oct 02, 2026",
    note: "Transfer set manifest format agreed with the register export; SBOM diffing still manual.",
  },
  {
    id: "WS-0105",
    title: "Red team assault on the provisioning and boot path",
    program: "PRG-1041",
    stage: "Assess",
    status: "Planned",
    lead: "PPL-0108",
    objective:
      "Attack the fixture, the transfer media and the boot chain as an insider on the manufacturing line: downgrade attempts, unsigned payloads, fuse bypass, and key extraction from a fielded unit.",
    disciplines: ["Offensive security", "Anti-tamper", "Test"],
    members: [
      { person: "PPL-0108", role: "Workstream lead — red team", allocation: 40 },
      { person: "PPL-0109", role: "Physical extraction attempts", allocation: 35 },
      { person: "PPL-0113", role: "Test evidence capture", allocation: 20 },
    ],
    dependsOn: ["WS-0101", "WS-0102"],
    controls: ["CA-8", "SI-7", "PE-3"],
    ccis: ["CCI-001749"],
    gate: "TRR",
    due: "Nov 14, 2026",
    note: "Cannot start until the boot chain runs on production keys — otherwise the result is not representative.",
  },
  {
    id: "WS-0106",
    title: "Anti-tamper response and zeroization on the mission module",
    program: "PRG-1041",
    stage: "Build",
    status: "Active",
    lead: "PPL-0109",
    objective:
      "Enclosure intrusion and environmental triggers zeroize key material and log the event without bricking a unit during legitimate depot maintenance.",
    disciplines: ["Anti-tamper", "Mechanical", "Firmware"],
    members: [
      { person: "PPL-0109", role: "Workstream lead", allocation: 60 },
      { person: "PPL-0106", role: "Mesh and enclosure integration", allocation: 30 },
      { person: "PPL-0103", role: "Zeroize handler in firmware", allocation: 20 },
    ],
    dependsOn: ["WS-0101"],
    controls: ["PE-3", "SC-12", "AU-2"],
    ccis: ["CCI-000919"],
    gate: "CDR",
    due: "Oct 24, 2026",
    note: "Depot maintenance exception path is the open design question.",
  },
  {
    id: "WS-0107",
    title: "Control-to-team assignment and ATO staffing plan",
    program: "PRG-1041",
    stage: "Scope",
    status: "Done",
    lead: "PPL-0110",
    objective:
      "Every tailored control has a named engineering owner and a discipline, so nothing lands on the program office by default at the authorization push.",
    disciplines: ["Program office", "Systems engineering", "Product security"],
    members: [
      { person: "PPL-0110", role: "Workstream lead", allocation: 20 },
      { person: "PPL-0111", role: "Control decomposition", allocation: 25 },
      { person: "PPL-0101", role: "Security ownership map", allocation: 15 },
    ],
    dependsOn: [],
    controls: ["PM-2", "PL-2"],
    ccis: [],
    gate: "RMF-2",
    due: "Jun 12, 2026",
    note: "Approved at the scope gate; revisited whenever the tailored baseline changes.",
  },
];

export const personById = new Map(people.map((p) => [p.id, p]));
export const workstreamById = new Map(workstreams.map((w) => [w.id, w]));

export function workstreamsForProgram(programId: string): Workstream[] {
  return workstreams.filter((w) => w.program === programId);
}

export function workstreamsForPerson(personId: string): Workstream[] {
  return workstreams.filter(
    (w) => w.lead === personId || w.members.some((m) => m.person === personId),
  );
}

export function peopleForProgram(programId: string): Person[] {
  const ids = new Set<string>();
  for (const w of workstreamsForProgram(programId)) {
    ids.add(w.lead);
    for (const m of w.members) ids.add(m.person);
  }
  return people.filter((p) => ids.has(p.id));
}

/** Total allocation for a person across every workstream — over 100% is a flag. */
export function allocationFor(personId: string): number {
  return workstreams
    .flatMap((w) => w.members)
    .filter((m) => m.person === personId)
    .reduce((sum, m) => sum + m.allocation, 0);
}

/** Workstreams that depend on this one — the downstream blast radius. */
export function dependentsOf(id: string): Workstream[] {
  return workstreams.filter((w) => w.dependsOn.includes(id));
}

export function workstreamStatusTone(s: WorkstreamStatus) {
  if (s === "Blocked") return "danger" as const;
  if (s === "Active") return "info" as const;
  if (s === "Done") return "success" as const;
  return "neutral" as const;
}

/** Disciplines that must coordinate because they share a workstream. */
export function crossDisciplineEdges(programId: string) {
  const seen = new Map<string, { a: Discipline; b: Discipline; via: string[] }>();
  for (const w of workstreamsForProgram(programId)) {
    const list = w.disciplines;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        const key = [a, b].sort().join("::");
        const existing = seen.get(key);
        if (existing) existing.via.push(w.id);
        else seen.set(key, { a, b, via: [w.id] });
      }
    }
  }
  return Array.from(seen.values()).sort((x, y) => y.via.length - x.via.length);
}
