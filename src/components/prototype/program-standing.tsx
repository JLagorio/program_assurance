import { useMemo } from "react";
import {
  DateTime,
  Inline,
  Skeleton,
  Text,
  VisuallyHidden,
  useLedgerLocale,
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

/** A due day this close is said in the warning tone, as a due date's Due soon is. */
const SOON_DAYS = 2;
/** An authorization expiring within this many days is said in the warning tone. */
const EXPIRY_NOTICE_DAYS = 90;

/** The urgent date in the header's words: "PDR 35d late", "CDR due today", "expires Sep 17, 2029". */
function UrgentWords({ urgent }: { urgent: UrgentDate }) {
  const { formatNumber } = useLedgerLocale();
  const late = urgent.days < 0;
  const near =
    urgent.kind === "gate" ? urgent.days <= SOON_DAYS : urgent.days <= EXPIRY_NOTICE_DAYS;
  const color = late ? "color.text.danger" : near ? "color.text.warning" : undefined;
  const words =
    urgent.kind === "expiry" ? (
      <>
        expires <DateTime value={urgent.day} format="date" />
      </>
    ) : late ? (
      `${urgent.name} ${formatNumber(-urgent.days)}d late`
    ) : urgent.days === 0 ? (
      `${urgent.name} due today`
    ) : (
      <>
        {urgent.name} due <DateTime value={urgent.day} format="date" />
      </>
    );
  return <Text {...(color ? { color } : {})}>{words}</Text>;
}

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
      <Inline space="space.200" rowSpace="space.050" alignBlock="baseline" shouldWrap>
        {categorization && (
          <Text>
            <Text color="color.text.subtle">Categorization</Text>{" "}
            <Text weight="medium">
              {categorization.map((level) => statusLabel(impactLevels, level)).join(" · ")}
            </Text>
          </Text>
        )}
        {ready ? (
          <Text>
            <Text
              weight="medium"
              {...(statusTone(authorizationStandings, ready.standing) === "danger"
                ? { color: "color.text.danger" as const }
                : {})}
            >
              {statusLabel(authorizationStandings, ready.standing)}
            </Text>
            {ready.urgent && (
              <>
                {" · "}
                <UrgentWords urgent={ready.urgent} />
              </>
            )}
          </Text>
        ) : failed ? (
          <Text color="color.text.subtle">Could not load</Text>
        ) : (
          <>
            <Skeleton shape="line" width={180} />
            <VisuallyHidden>Loading the authorization standing</VisuallyHidden>
          </>
        )}
      </Inline>
    </>
  );
}
