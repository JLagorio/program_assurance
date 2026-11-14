import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Crosshair } from "lucide-react";
import { Absent, DataTable, Section, TextLink, defineColumns } from "@ledger/design-system";
import { RESILIENCY_GUIDANCE_KINDS } from "@/lib/control-resiliency";
import { controlThreats, risksByTechnique, type CounteredTechnique } from "@/lib/control-threats";
import {
  ATTACK_FRAMEWORKS,
  CYBER_RESILIENCY_FRAMEWORK,
  attackMatrix,
  useFrameworkControlLinks,
  useFrameworkItemLinks,
  useFrameworkItems,
  type ControlLinkScope,
  type ItemLinkScope,
} from "@/lib/frameworks";
import { programRiskTechniquesColumn, registerViews } from "@/lib/register-views";
import { codedName, useProgramRiskTechniques, type ThreatTactic } from "@/lib/risk-threats";
import { questionSearch, useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
} from "./record-preview";
import { TechniqueDetails } from "./risk-threats";
import { ReportFailures, type QueryStatus } from "./work-common";

/*
 * The threats a control counters, in ATT&CK's words: the techniques NIST SP 800-160 Vol. 2 Rev. 1
 * prints the control against, ATT&CK for Enterprise's in Appendix F and ATT&CK for ICS's in
 * Appendix G, each with the tactics, the mitigations, the cyber resiliency approaches and the
 * effects on the adversary. It is the appendices read from the control's side; a risk's record
 * reads them from the technique's (risk-threats). A technique has no page of its own: its name
 * opens its preview.
 */

const techniqueNoun = { one: "ATT&CK technique", other: "ATT&CK techniques" };
/** What the appendices' rows name by code or title: the same items a technique's preview reads. */
const VOCABULARY_KINDS = ["candidate-mitigation", "effect", "mitigation", "tactic"] as const;

type ThreatRow = CounteredTechnique & {
  /** The technique's identifier and name together. */
  name: string;
  /** The matrix it belongs to: Enterprise or ICS. */
  matrix: string | null;
  /** How many of the program's risks name it; none outside a program, or when it could not be read. */
  risks: number | null;
};

const named = (records: readonly { code: string; title: string }[]) =>
  records.map((record) => ({ key: record.code, label: record.title }));

/**
 * The program's POA&M & risk tab with its risks asked for exactly the ones that name a technique,
 * by the technique's identifier and name, as the risks' ATT&CK techniques column lists it; the
 * address names the risks' Section, which brings it into view.
 */
const risksNaming = (technique: string) => ({
  tab: "POA&M & risk" as const,
  ...questionSearch(registerViews.programRisks, {
    filters: [{ id: programRiskTechniquesColumn, value: [technique] }],
  }),
});

/**
 * The columns: a technique by its identifier and name, which opens its preview, the matrix it
 * belongs to, then what its appendix prints with it for this control. Inside a program, how many
 * of its risks name the technique stays in a narrow row longest, as a number does, and a count
 * opens those risks.
 */
function threatColumns(onPreview: (id: string) => void, programId: string | undefined) {
  return defineColumns<ThreatRow>((c) => [
    c.text("name", {
      header: "ATT&CK technique",
      minWidth: 240,
      priority: 0,
      hideable: false,
      // A technique has no page of its own: its name opens its preview here.
      cell: (row) => (
        <RecordLink
          table="framework_items"
          record={{ id: row.id }}
          onPreview={() => onPreview(row.id)}
        >
          {row.name}
        </RecordLink>
      ),
    }),
    c.text("matrix", { header: "Matrix", width: 110, priority: 2 }),
    c.list("tactics", {
      header: "Tactics",
      width: 190,
      priority: 4,
      searchable: true,
      items: (row) => named(row.tactics),
    }),
    c.list("mitigations", {
      header: "Mitigations",
      width: 220,
      priority: 6,
      searchable: true,
      items: (row) =>
        row.mitigations.map((mitigation) => ({
          key: mitigation.code,
          label: codedName(mitigation),
          meta: mitigation.candidate ? "Candidate mitigation" : "ATT&CK mitigation",
        })),
    }),
    c.list("approaches", {
      header: "Approaches",
      width: 220,
      priority: 5,
      searchable: true,
      items: (row) => named(row.approaches),
      empty: () => <Absent label="No approach named" />,
    }),
    c.list("effects", {
      header: "Effects",
      width: 170,
      priority: 3,
      searchable: true,
      items: (row) => row.effects.map((effect) => ({ key: effect, label: effect })),
    }),
    ...(programId
      ? [
          c.number("risks", {
            header: "Risks",
            width: 88,
            priority: 1,
            // A count that could not be read never reads as zero: the page's alert says why. A
            // count opens the program's risks that name the technique; a zero opens nothing.
            cell: (row) =>
              row.risks === null ? (
                <Absent label="Could not load" />
              ) : row.risks > 0 ? (
                <TextLink
                  aria-label={`${row.risks} ${row.risks === 1 ? "risk names" : "risks name"} ${row.name}`}
                  render={
                    <Link
                      to="/programs/$programId"
                      params={{ programId }}
                      search={risksNaming(row.name)}
                      hash={registerViews.programRisks}
                    />
                  }
                >
                  {row.risks}
                </TextLink>
              ) : (
                row.risks
              ),
          }),
        ]
      : []),
  ]);
}

/**
 * A technique's preview beside the control. Its row says the tactics whose tables print the
 * control against it; the preview says every tactic the technique sits under, read as it opens,
 * with the row's standing in until then.
 */
function CounteredTechniquePreview({
  technique,
  tacticOrder,
  catalogRevisionId,
  programId,
}: {
  technique: Pick<CounteredTechnique, "code" | "framework" | "tactics">;
  /** Each tactic's place among its appendix's tables, by its framework and code. */
  tacticOrder: ReadonlyMap<string, number>;
  catalogRevisionId: string;
  programId?: string | undefined;
}) {
  const scope = useMemo(
    (): ItemLinkScope => ({ relation: "tactic", sourceCodes: [technique.code] }),
    [technique.code],
  );
  const links = useFrameworkItemLinks(technique.framework, scope);
  const tactics = useMemo((): readonly ThreatTactic[] => {
    if (!links.data?.length) return technique.tactics;
    const place = (code: string) =>
      tacticOrder.get(`${technique.framework} ${code}`) ?? Number.MAX_SAFE_INTEGER;
    return links.data
      .map((link) => ({ code: link.target_code, title: link.target_title }))
      .sort((a, b) => place(a.code) - place(b.code));
  }, [links.data, technique.tactics, technique.framework, tacticOrder]);
  return (
    <TechniqueDetails
      code={technique.code}
      framework={technique.framework}
      tactics={tactics}
      catalogRevisionId={catalogRevisionId}
      programId={programId}
    />
  );
}

/**
 * The ATT&CK techniques a control counters, as a Section of its record: one line a technique, of
 * ATT&CK for Enterprise (Appendix F) or ATT&CK for ICS (Appendix G). A control neither appendix
 * names draws nothing, and nothing is drawn until the read says which. Inside a program a Risks
 * column counts the program's risks that name each technique.
 */
export function ControlThreats({
  controlId,
  catalogRevisionId,
  programId,
}: {
  controlId: string;
  /** The control's catalog edition: a technique's preview lists that edition's countering controls. */
  catalogRevisionId: string;
  /** The program the control is read in: its risks are counted, and a control's name opens there. */
  programId?: string | undefined;
}) {
  const scope = useMemo(
    (): ControlLinkScope => ({ controlIds: [controlId], relation: "mitigates" }),
    [controlId],
  );
  const links = useFrameworkControlLinks(ATTACK_FRAMEWORKS, scope);
  const countered = (links.data?.length ?? 0) > 0;
  // What the rows name: read once for every control, and only for one an appendix names.
  const attack = useFrameworkItems(ATTACK_FRAMEWORKS, {
    kinds: VOCABULARY_KINDS,
    enabled: countered,
  });
  const approaches = useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, {
    kinds: RESILIENCY_GUIDANCE_KINDS,
    enabled: countered,
  });
  // The program's risks that name a technique: the reads the program's risks register lists their
  // techniques from. A link keeps the item it was made from, and an item's id changes when the
  // appendix is read again: the count goes by the item's code.
  const programRisks = useProgramRiskTechniques(programId, { enabled: countered });
  const riskLinks = programRisks.links;
  const riskItems = programRisks.items;

  const techniques = useMemo(
    () =>
      controlThreats(links.data ?? [], {
        attack: attack.data ?? [],
        approaches: approaches.data ?? [],
      }),
    [links.data, attack.data, approaches.data],
  );
  // Counted once both reads have answered (`risks` says so): links whose items are not read yet
  // would count as none.
  const riskCounts = useMemo(
    () =>
      programId && riskLinks.data && programRisks.risks
        ? risksByTechnique(riskLinks.data, riskItems.data ?? [])
        : null,
    [programId, riskLinks.data, riskItems.data, programRisks.risks],
  );
  const rows = useMemo<ThreatRow[]>(
    () =>
      techniques.map((technique) => ({
        ...technique,
        name: codedName(technique),
        matrix: attackMatrix(technique.framework) ?? null,
        risks: riskCounts ? (riskCounts.get(technique.code) ?? 0) : null,
      })),
    [techniques, riskCounts],
  );
  // A Matrix filter is worth its place once the control counters techniques of both matrices.
  const matrices = new Set(rows.map((row) => row.matrix)).size;

  // Both appendices print an Initial Access: a tactic's place is its own framework's.
  const tacticOrder = useMemo(
    () =>
      new Map(
        (attack.data ?? [])
          .filter((item) => item.kind === "tactic")
          .map((item) => [`${item.framework_code} ${item.code}`, item.ordinal]),
      ),
    [attack.data],
  );

  const [previewId, setPreviewId] = useState<string | null>(null);
  const columns = useMemo(() => threatColumns(setPreviewId, programId), [programId]);
  // The preview is the table's, so opening or stepping through it never rebuilds the columns.
  const tablePreview = useMemo(
    () => ({ onPreview: (row: ThreatRow) => setPreviewId(row.id), activeId: previewId }),
    [previewId],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    preview: tablePreview,
    label: "ATT&CK techniques",
    pinnable: false,
    hideable: false,
  });
  const displayed = useDisplayedRecords(table);
  const preview = rows.find((row) => row.id === previewId);

  // Most controls counter no technique the appendices name: the Section waits for the read.
  if (links.data === undefined && !links.isError) return null;
  // A control neither appendix names has no Section; a refresh of that answer that failed is
  // still said, by the page's alert.
  if (links.data !== undefined && !techniques.length)
    return links.isError ? <ReportFailures queries={[links]} /> : null;
  // The techniques read whole without the program's risks: when that count cannot be read, the
  // rows stay, the Risks column says so and the failure is handed to the page's alert.
  const riskReads: QueryStatus[] = programId ? programRisks.queries : [];
  const uncounted = riskReads.filter((read) => read.isError && read.data === undefined);
  const queries: QueryStatus[] = [
    links,
    attack,
    approaches,
    ...riskReads.filter((read) => !uncounted.includes(read)),
  ];
  return (
    <Section
      title="ATT&CK techniques"
      count={links.data ? techniques.length : undefined}
      countMax={9999}
      description="The ATT&CK techniques this control counters, with the mitigations, approaches and effects, from NIST SP 800-160 Vol. 2 Rev. 1, Appendices F (ATT&CK for Enterprise) and G (ATT&CK for ICS)."
    >
      <ReportFailures queries={uncounted} />
      <ProductCollection
        compact
        keepQuestion={false}
        table={table}
        queries={queries}
        noun={techniqueNoun}
        // A technique has no page: its row opens its preview, as its name does.
        onRowClick={(row) => setPreviewId(row.id)}
        filters={
          <>
            {matrices > 1 && <DataTable.Filter table={table} column="matrix" />}
            <DataTable.Filter table={table} column="tactics" />
            <DataTable.Filter table={table} column="effects" />
          </>
        }
        empty={{
          title: "No ATT&CK techniques",
          description: "Appendices F and G print this control against no technique.",
          icon: <Crosshair />,
        }}
      />
      {preview && (
        <RecordPreviewPanel
          title={preview.name}
          label="ATT&CK technique preview"
          defaultWidth={640}
          onClose={() => setPreviewId(null)}
          navigation={
            <RecordPreviewActions
              table="framework_items"
              record={{ id: preview.id }}
              rows={displayed}
              onSelect={(row) => setPreviewId(row.id)}
            />
          }
        >
          <CounteredTechniquePreview
            key={preview.id}
            technique={preview}
            tacticOrder={tacticOrder}
            catalogRevisionId={catalogRevisionId}
            programId={programId}
          />
        </RecordPreviewPanel>
      )}
    </Section>
  );
}
