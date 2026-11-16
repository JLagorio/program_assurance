// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// The program's header has, under its name, its categorization and its standing as one fact: the
// newest authorization decision in RMF's short words (ATO, ATO with conditions, ATO expired, DATO,
// ATD; with none, the authorization every boundary records, else Package submitted, Package in
// draft or No authorization package) and its most urgent date, an open gate's due day or the
// authorization's expiry (ATO with conditions · CDR 46d late), `ProgramStandingFacts` over
// `programStanding` in program-standing.

import { useMemo } from "react";
import {
  Fact,
  PageHeader,
  useLedgerLocale,
  type PageHeaderStandingDate,
} from "@ledger/design-system";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  programCategorization,
  programStanding,
  useProgramAuthorization,
  type ImpactSystem,
  type StandingBoundary,
  type StandingGate,
  type UrgentDate,
} from "@/lib/program-standing";
import { authorizationStandings, impactLevels, statusLabel, statusTone } from "@/lib/status";
import { ReportFailures } from "./work-common";

/** An authorization expiring within this many days is flagged as soon; a gate, within two. */
const EXPIRY_NOTICE_DAYS = 90;

/**
 * The urgent date as the header's standing says it: a gate by its title ("PDR 35d late", "CDR due
 * today"), an expiry after the authorization's words alone ("expires Sep 17, 2029").
 */
const standingDate = (urgent: UrgentDate): PageHeaderStandingDate =>
  urgent.kind === "expiry"
    ? { value: urgent.day, kind: "expiry", soonWithin: EXPIRY_NOTICE_DAYS }
    : { value: urgent.day, name: urgent.name };

/**
 * The program's header facts, under its name: its security categorization (each of
 * confidentiality, integrity and availability at the highest impact its authorization boundaries
 * record) and its standing as one fact, the authorization in RMF's short words and its most urgent
 * date ("ATO with conditions · PDR 35d late"). The standing waits on its reads under a line, and a
 * read that fails says Could not load in its place under the page's alert.
 */
export function ProgramStandingFacts({
  programId,
  boundaries,
  gates,
}: {
  programId: string;
  /** The program's authorization boundaries, with their recorded impacts and authorization. */
  boundaries: readonly (ImpactSystem & StandingBoundary)[];
  /** The program's lifecycle gates, the read its Overview's timeline draws. */
  gates: UseQueryResult<readonly StandingGate[], Error>;
}) {
  const { zonedParts } = useLedgerLocale();
  const authorization = useProgramAuthorization(programId);
  const queries = [...authorization.queries, gates];
  const categorization = programCategorization(boundaries);
  const today = useMemo(() => {
    const { year, month, day } = zonedParts(Date.now());
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }, [zonedParts]);
  const ready =
    authorization.versions.data && authorization.decisions.data && gates.data
      ? programStanding({
          decisions: authorization.decisions.data,
          versions: authorization.versions.data,
          gates: gates.data,
          boundaries,
          today,
        })
      : null;
  const failed = queries.some((query) => query.isError && query.data === undefined);
  return (
    <>
      <ReportFailures queries={queries} />
      <PageHeader.Facts>
        {categorization && (
          <Fact label="Categorization">
            {categorization.map((level) => statusLabel(impactLevels, level)).join(" · ")}
          </Fact>
        )}
        {ready ? (
          <PageHeader.Standing
            label="Authorization"
            status={statusLabel(authorizationStandings, ready.standing)}
            tone={statusTone(authorizationStandings, ready.standing)}
            {...(ready.urgent ? { date: standingDate(ready.urgent) } : {})}
          />
        ) : failed ? (
          <PageHeader.Standing label="Authorization" status="Could not load" />
        ) : (
          <PageHeader.Standing label="Authorization" isLoading />
        )}
      </PageHeader.Facts>
    </>
  );
}
