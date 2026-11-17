/**
 * The program roles scenario: who holds RMF's roles on the demo programs, so a record's action
 * slot can say whose step it is (Josef, 2026-11-16: "Role-true slot", "Enforce by role"). It is
 * authored for this repository and written by `npm run seed:demo-roles` under its own provenance
 * dataset, standing on the demo import (seed:demo), the showcase (seed:demo-showcase) and the
 * products scenario (seed:demo-products), whose people it names.
 *
 * Every holder is a person the demo data already names in that part: the authorizing official who
 * signed a program's authorization decisions (R. Calloway, on WS-X90, Atlas payments and the legacy
 * billing gateway), the control assessor who published WS-X90's assessment results and reviewed
 * the packages (D. Okafor, its lead assessor), the assessor whose findings they hold (Nadia
 * Fournier on WS-X90; on the customer programs, Elena Vasquez and Ray Colston, who published their
 * delta assessment results) and the showcase's ISSO and program office (Priya Raghavan, Ray
 * Colston). The one holder nothing names is WS-X90's ISSM, Joel Barrantes, the ISSO of the other
 * customer programs. The account the seed runs as is one of WS-X90's assessors, so a reader signed
 * in as it holds a role there and waits on D. Okafor to publish.
 *
 * Roles the programs already record (the products scenario's program managers, ISSOs, assessors,
 * control owners and reviewers; the import's system owners) are left as they are. Corporate
 * identity provider and the check programs keep no role, so a program that records none still acts
 * as before.
 */

export const datasetId = "program-roles-v1";

/** Each program's roles: [role, holder], the holder a person by name or the seed's own account. */
export const programRoles = [
  {
    program: "PRG-1090",
    roles: [
      ["authorizing_official", "R. Calloway"],
      ["lead_assessor", "D. Okafor"],
      ["assessor", "Nadia Fournier"],
      ["assessor", { account: true }],
      ["security_manager", "Joel Barrantes"],
      ["security_officer", "Priya Raghavan"],
      ["system_owner", "Ray Colston"],
    ],
  },
  {
    program: "PRG-1041",
    roles: [
      ["authorizing_official", "R. Calloway"],
      ["lead_assessor", "D. Okafor"],
    ],
  },
  {
    program: "PRG-0994",
    roles: [
      ["authorizing_official", "R. Calloway"],
      ["lead_assessor", "D. Okafor"],
    ],
  },
  { program: "PRG-2101", roles: [["lead_assessor", "Elena Vasquez"]] },
  { program: "PRG-2102", roles: [["lead_assessor", "Ray Colston"]] },
  { program: "PRG-2201", roles: [["lead_assessor", "Elena Vasquez"]] },
];

/** The program the scenario leaves with no role recorded, which the seed checks it still has none. */
export const leftEmpty = ["PRG-1013"];

/** A holder's key: the person's name, or `account` for the seed's own account. */
export const holderKey = (holder) => (typeof holder === "string" ? holder : "account");

/** Every assignment the scenario writes, one a program, role and holder, with its stable key. */
export const assignments = () =>
  programRoles.flatMap(({ program, roles }) =>
    roles.map(([role, holder]) => ({
      key: `${program}/${role}/${holderKey(holder)}`,
      program,
      role,
      ...(typeof holder === "string" ? { person: holder } : { account: true }),
    })),
  );

/** The people the scenario names. */
export const people = () => [
  ...new Set(
    programRoles.flatMap(({ roles }) =>
      roles.map(([, holder]) => holder).filter((holder) => typeof holder === "string"),
    ),
  ),
];
