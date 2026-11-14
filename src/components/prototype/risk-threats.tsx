import { useMemo, useRef, useState } from "react";
import { Crosshair, MoreHorizontal, Plus, ShieldCheck } from "lucide-react";
import {
  Absent,
  Button,
  DataTable,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Item,
  KeyValue,
  Prose,
  RecordBrowser,
  Related,
  Section,
  Stack,
  TextLink,
  defineColumns,
  toast,
} from "@ledger/design-system";
import { useConfirmation } from "@/components/app/confirmation";
import { causeText } from "@/components/app/sentence";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import {
  ATTACK_FRAMEWORKS,
  CYBER_RESILIENCY_FRAMEWORK,
  attackAppendix,
  attackMatrix,
  useFramework,
  useFrameworkControlLinks,
  useFrameworkItemLinks,
  useFrameworkItems,
  type ControlLinkScope,
  type Framework,
} from "@/lib/frameworks";
import {
  codedName,
  leastHeldFirst,
  techniqueChoices,
  techniqueDefence,
  useLinkRiskTechniques,
  useRiskThreats,
  useUnlinkRiskTechnique,
  type CounteringApproach,
  type TechniqueChoice,
  type TechniqueControl,
  type ThreatTactic,
} from "@/lib/risk-threats";
import { objectiveWords } from "@/lib/product-records";
import { baselineControlStatuses } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { ObjectiveCount } from "./control-status";
import { ProductCollection } from "./product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  useEndOnHide,
  useOpenRecord,
  useRemovalFocus,
} from "./record-preview";
import { EmptyMessage, QueryState } from "./work-common";

/*
 * The threat a risk concerns, in ATT&CK's words, and what counters it: the techniques the risk
 * names, of ATT&CK for Enterprise or ATT&CK for ICS, and the controls NIST SP 800-160 Vol. 2 Rev. 1
 * prints against them (Appendix F for Enterprise, Appendix G for ICS) with where the risk's program
 * stands on each. A technique has no page of its own: its name opens its preview.
 */

const LINK = "Link ATT&CK technique";
const UNLINK = "Unlink ATT&CK technique";
const techniqueNoun = { one: "ATT&CK technique", other: "ATT&CK techniques" };
const controlNoun = { one: "countering control", other: "countering controls" };
/** Reference data is loaded by a workspace administrator: a reader is never asked to import it. */
const NOT_LOADED = "Reference data is loaded by a workspace administrator.";

/** The framework's items a picker offers. */
const TECHNIQUE_KINDS = ["attack-technique"] as const;
/** What a technique's rows name by code or title: its tactics, its mitigations and the effects. */
const VOCABULARY_KINDS = ["candidate-mitigation", "effect", "mitigation", "tactic"] as const;
const APPROACH_KINDS = ["approach"] as const;
const TACTIC_LINKS = { relation: "tactic" } as const;

const tacticItems = (tactics: readonly ThreatTactic[]) =>
  tactics.map((tactic) => ({ key: tactic.code, label: tactic.title }));
const titleItems = (titles: readonly string[]) =>
  titles.map((title) => ({ key: title, label: title }));
const noApproach = () => <Absent label="No approach named" />;

/* ——— One technique ———————————————————————————————————————————————————————————————————————————— */

/** Where the appendix was transcribed from, and the terms its content is used under. */
function ReferenceSource({ framework }: { framework: Framework }) {
  const source = framework.source_document;
  const address = source.url ?? source.doi;
  const name = source.title ?? framework.title;
  return (
    <Stack space="space.200">
      <KeyValue.Group labelWidth="default">
        <KeyValue label="Source" wrap>
          {address ? (
            <TextLink href={address} newTab>
              {/\.pdf$/i.test(address) ? `${name} (PDF)` : name}
            </TextLink>
          ) : (
            name
          )}
        </KeyValue>
        <KeyValue label="Reference data" wrap>
          {framework.title}
        </KeyValue>
        <KeyValue label="Version">{framework.version}</KeyValue>
        <KeyValue label="Authority" wrap>
          {framework.authority}
        </KeyValue>
        {source.published && (
          <KeyValue label="Published">
            <DateTime value={source.published} format="date" />
          </KeyValue>
        )}
      </KeyValue.Group>
      {framework.rights && <Prose label="Rights">{framework.rights}</Prose>}
      {framework.notes && <Prose label="Notes">{framework.notes}</Prose>}
    </Stack>
  );
}

type DefenceRow = TechniqueControl & { name: string };

/**
 * The controls the appendix prints against one technique, in the catalog's order. A list the
 * reference data defines, read in a preview or inside the picker: no search, sort or column menu.
 * Where the reader is in a program, a control's name opens that program's control record.
 */
function defenceColumns(programId: string | null, mitigationNames: ReadonlyMap<string, string>) {
  return defineColumns<DefenceRow>((c) => [
    c.text("name", {
      header: "Control",
      minWidth: 200,
      priority: 0,
      hideable: false,
      sortable: false,
      cell: programId
        ? (row) => (
            <RecordLink table="controls" record={{ id: row.id, program_id: programId }}>
              {row.name}
            </RecordLink>
          )
        : undefined,
    }),
    c.list("approaches", {
      header: "Approaches",
      priority: 1,
      sortable: false,
      items: (row) => titleItems(row.approaches),
      empty: noApproach,
    }),
    c.list("effects", {
      header: "Effects",
      priority: 2,
      sortable: false,
      items: (row) => titleItems(row.effects),
    }),
    c.list("mitigations", {
      header: "Mitigations",
      priority: 3,
      sortable: false,
      items: (row) =>
        row.mitigations.map((code) => ({ key: code, label: mitigationNames.get(code) ?? code })),
    }),
  ]);
}

/**
 * What its appendix says of one technique: the matrix and the tactics it sits under, the
 * mitigations printed against it, the controls that counter it with their approaches and effects,
 * and, closed until asked for, where the reference data comes from and the terms it is used under.
 * It is the body of the technique's preview, beside a risk, beside a control that counters it and
 * inside the picker.
 */
export function TechniqueDetails({
  code,
  framework: frameworkCode,
  tactics,
  catalogRevisionId,
  programId = null,
}: {
  /** The ATT&CK identifier: "T1190", or "T0819" in ATT&CK for ICS. */
  code: string;
  /** The ATT&CK framework that prints it: Appendix F's for Enterprise, Appendix G's for ICS. */
  framework: string;
  tactics: readonly ThreatTactic[];
  /** The catalog edition whose controls are listed; there is none where the reference data is not loaded. */
  catalogRevisionId: string | null | undefined;
  /** The program the reader is in: a control's name then opens its record there. */
  programId?: string | null | undefined;
}) {
  const open = useOpenRecord();
  const scope = useMemo(
    (): ControlLinkScope | undefined =>
      catalogRevisionId
        ? { itemCodes: [code], relation: "mitigates", catalogRevisionId }
        : undefined,
    [code, catalogRevisionId],
  );
  const links = useFrameworkControlLinks(frameworkCode, scope);
  // Both appendices' words, read once for every preview: Table F-1's effects name the rows of each.
  const attack = useFrameworkItems(ATTACK_FRAMEWORKS, { kinds: VOCABULARY_KINDS });
  const approaches = useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, { kinds: APPROACH_KINDS });
  const framework = useFramework(frameworkCode);
  const appendix = attackAppendix(frameworkCode) ?? "The appendix";
  const defence = useMemo(
    () =>
      techniqueDefence(links.data ?? [], {
        attack: attack.data ?? [],
        approaches: approaches.data ?? [],
      }),
    [links.data, attack.data, approaches.data],
  );
  const mitigationNames = useMemo(
    () =>
      new Map(defence.mitigations.map((mitigation) => [mitigation.code, codedName(mitigation)])),
    [defence.mitigations],
  );
  const rows = useMemo(
    () => defence.controls.map((control) => ({ ...control, name: codedName(control) })),
    [defence.controls],
  );
  const columns = useMemo(
    () => defenceColumns(programId, mitigationNames),
    [programId, mitigationNames],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    // Named for its technique: beside a risk, the page holds a Countering controls table too.
    label: `Controls that counter ${code}`,
    pinnable: false,
    hideable: false,
  });
  return (
    <Stack space="space.250" className="min-w-0">
      <KeyValue.Group labelWidth="default">
        <KeyValue label="Matrix">{attackMatrix(frameworkCode) ?? <Absent />}</KeyValue>
        <KeyValue label="Tactics" wrap>
          {tactics.length ? (
            tactics.map((tactic) => tactic.title).join(", ")
          ) : (
            <Absent label="No tactic named" />
          )}
        </KeyValue>
      </KeyValue.Group>
      {catalogRevisionId ? (
        // The panel is drawn outside the page's region, so it says its own failure, with Retry.
        <QueryState queries={[links, attack, approaches]}>
          <Related
            title="Mitigations"
            count={defence.mitigations.length}
            countMax={9999}
            layout="list"
            size="compact"
            empty="No mitigation printed"
          >
            {defence.mitigations.map((mitigation) => (
              <Item
                key={mitigation.code}
                id={mitigation.code}
                title={mitigation.title}
                meta={mitigation.candidate ? "Candidate mitigation" : "ATT&CK mitigation"}
              />
            ))}
          </Related>
          <Section title="Countering controls" count={rows.length} countMax={9999}>
            <ProductCollection
              compact
              keepQuestion={false}
              search={false}
              sort={false}
              table={table}
              noun={controlNoun}
              {...(programId
                ? {
                    onRowClick: (row: DefenceRow) =>
                      open("controls", { id: row.id, program_id: programId }),
                  }
                : {})}
              empty={{
                title: "No countering controls",
                description: `${appendix} prints no control against this technique.`,
                icon: <ShieldCheck />,
              }}
            />
          </Section>
        </QueryState>
      ) : (
        // No catalog edition to list controls from: the reference data is not there.
        <EmptyMessage compact title="No countering controls" description={NOT_LOADED} />
      )}
      {/* A failure is said in the open, never behind a closed heading. */}
      <Section title="Details" {...(framework.isError ? {} : { isCollapsible: true })}>
        <QueryState query={framework}>
          {framework.data ? (
            <ReferenceSource framework={framework.data} />
          ) : (
            <Absent label="Not available" />
          )}
        </QueryState>
      </Section>
    </Stack>
  );
}

/* ——— A risk's techniques and the controls that counter them ————————————————————————————————— */

type TechniqueRow = {
  /** The technique's item: the row's identity, and the record its preview is of. */
  id: string;
  linkId: string;
  code: string;
  /** Its identifier and name together. */
  name: string;
  /** The framework that prints it, and the matrix a reader tells it by: Enterprise or ICS. */
  framework: string;
  matrix: string | null;
  tactics: ThreatTactic[];
};

type ChoiceRow = TechniqueChoice & { name: string; matrix: string | null };

/**
 * The picker's columns: a technique by its identifier and name, the matrix it belongs to, which
 * tells T0819 Exploit Public-Facing Application (ICS) from T1190 of the same name (Enterprise), and
 * the tactics it sits under.
 */
const choiceColumns = defineColumns<ChoiceRow>((c) => [
  c.text("name", { header: "ATT&CK technique", minWidth: 240, priority: 0, hideable: false }),
  c.text("matrix", { header: "Matrix", width: 120, priority: 1 }),
  c.list("tactics", {
    header: "Tactics",
    width: 280,
    priority: 2,
    items: (row) => tacticItems(row.tactics),
  }),
]);

type Standing = "in_baseline" | "not_selected";

type ControlRow = {
  id: string;
  /** The control's code and title together: titles repeat across families. */
  name: string;
  /** Its place in the catalog: AC-2 before AC-10. */
  place: number;
  /** Its place when what the program does not hold reads first. */
  held: number;
  techniques: string[];
  approaches: CounteringApproach[];
  effects: string[];
  /** Where it stands in the program's control baseline; none when the program records no baseline. */
  baseline: Standing | null;
  requirements: number | null;
  evidenced: number | null;
  /** The assessment objectives the control counts, and those the program's requirements cover. */
  objectives: number | null;
  objectivesMapped: number | null;
};

/**
 * The countering controls' columns. A control's name opens the program's control record. The
 * program's standing stays in a narrow row longest (the baseline beside the name on a phone, then
 * how many of its objectives the program's requirements cover, "3 of 10"); the Baseline column
 * sorts by how much of the control the program holds, which is the order the section opens in.
 */
function controlColumns(
  programId: string | null,
  techniqueNames: ReadonlyMap<string, string>,
  several: boolean,
) {
  return defineColumns<ControlRow>((c) => [
    c.text("name", {
      header: "Control",
      minWidth: 200,
      priority: 0,
      hideable: false,
      sortBy: (row) => row.place,
      cell: (row) => (
        <RecordLink
          table="controls"
          record={{ id: row.id, ...(programId ? { program_id: programId } : {}) }}
        >
          {row.name}
        </RecordLink>
      ),
    }),
    c.list("approaches", {
      header: "Approaches",
      priority: 5,
      searchable: true,
      items: (row) =>
        row.approaches.map((approach) => ({ key: approach.code, label: approach.title })),
      empty: noApproach,
    }),
    c.list("effects", {
      header: "Effects",
      minWidth: 140,
      priority: 6,
      searchable: true,
      items: (row) => titleItems(row.effects),
    }),
    c.status("baseline", {
      header: "Baseline",
      width: 120,
      priority: 1,
      statuses: baselineControlStatuses,
      sortBy: (row) => row.held,
      cell: (row) =>
        row.baseline ? (
          <StatusBadge statuses={baselineControlStatuses} value={row.baseline} size="xsmall" />
        ) : (
          <Absent label="No control baseline recorded" />
        ),
    }),
    // How much of the control the program's requirements cover, objective by objective, as its
    // control status counts them; no standing reads as the requirements' does.
    c.number("objectivesMapped", {
      header: objectiveWords.mapped,
      width: 170,
      priority: 2,
      cell: (row) =>
        row.objectives === null || row.objectivesMapped === null ? (
          <Absent />
        ) : (
          <ObjectiveCount count={row.objectivesMapped} objectives={row.objectives} />
        ),
    }),
    c.number("requirements", { header: "Requirements", width: 130, priority: 3 }),
    c.number("evidenced", { header: "With evidence", width: 130, priority: 4 }),
    // Which technique a control counters is worth a column once the risk names more than one.
    ...(several
      ? [
          c.list("techniques", {
            header: "Techniques",
            priority: 7,
            searchable: true,
            items: (row) =>
              row.techniques.map((code) => ({
                key: code,
                label: techniqueNames.get(code) ?? code,
              })),
          }),
        ]
      : []),
  ]);
}

/**
 * A risk's ATT&CK techniques and the controls that counter them, as two Sections of its Overview.
 * A reader who may write links techniques through the browser, where each can be read before it is
 * chosen, and unlinks one behind a confirmation, from its row or its preview.
 */
export function RiskThreats({
  risk,
}: {
  risk: { id: string; title: string; program_id: string | null };
}) {
  const workspace = useWorkspace();
  const open = useOpenRecord();
  const threats = useRiskThreats(risk.id);
  const data = threats.data;
  const programId = data?.programId ?? risk.program_id;
  const canWrite = workspace.role !== "viewer";
  const [linking, setLinking] = useState(false);
  // The picker reads what it offers as it first opens, and keeps it for its exit and the next time.
  const [opened, setOpened] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // A preview belongs to its tab: it ends when the record's tab hides this collection.
  useEndOnHide(() => setPreviewId(null));
  const link = useLinkRiskTechniques();
  const unlink = useUnlinkRiskTechnique();
  const { confirm, confirmation } = useConfirmation();

  const techniques = useMemo<TechniqueRow[]>(
    () =>
      (data?.techniques ?? []).map((technique) => ({
        id: technique.itemId,
        linkId: technique.linkId,
        code: technique.code,
        name: codedName(technique),
        framework: technique.framework,
        matrix: attackMatrix(technique.framework) ?? null,
        tactics: technique.tactics,
      })),
    [data?.techniques],
  );
  const techniqueNames = useMemo(
    () => new Map(techniques.map((technique) => [technique.code, technique.name])),
    [techniques],
  );
  const controls = useMemo<ControlRow[]>(() => {
    const listed = data?.controls ?? [];
    const order = new Map(leastHeldFirst(listed).map((control, index) => [control.id, index]));
    return listed.map((control, place) => ({
      id: control.id,
      name: codedName(control),
      place,
      held: order.get(control.id) ?? place,
      techniques: control.techniques,
      approaches: control.approaches,
      effects: control.effects,
      baseline:
        control.inBaseline === null ? null : control.inBaseline ? "in_baseline" : "not_selected",
      requirements: control.requirements,
      evidenced: control.evidenced,
      objectives: control.objectives,
      objectivesMapped: control.objectivesMapped,
    }));
  }, [data?.controls]);

  const focus = useRemovalFocus(techniques);
  async function unlinkTechnique(row: TechniqueRow) {
    const removed = await confirm({
      title: `${UNLINK}?`,
      description: `${risk.title} will no longer name ${row.name}. The controls that counter only this technique leave the risk's countering controls.`,
      confirmLabel: UNLINK,
      variant: "danger",
      failureTitle: "The ATT&CK technique was not unlinked",
      action: () => {
        focus.removed(row.id);
        return unlink.mutateAsync({ linkId: row.linkId });
      },
    });
    if (!removed) return;
    setPreviewId((current) => (current === row.id ? null : current));
    toast.add({
      type: "success",
      title: "ATT&CK technique unlinked",
      description: `${row.name} is no longer linked to this risk.`,
    });
  }
  // The row menu calls the current render's unlink, so the columns need not change with it.
  const unlinkRow = useRef<(row: TechniqueRow) => void>(() => {});
  unlinkRow.current = (row) => void unlinkTechnique(row);
  const techniqueColumns = useMemo(
    () =>
      defineColumns<TechniqueRow>((c) => [
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
              onPreview={() => setPreviewId(row.id)}
            >
              {row.name}
            </RecordLink>
          ),
        }),
        c.list("tactics", {
          header: "Tactics",
          width: 280,
          priority: 1,
          items: (row) => tacticItems(row.tactics),
        }),
        c.text("matrix", { header: "Matrix", width: 110, priority: 2 }),
        ...(canWrite
          ? [
              c.actions((row: TechniqueRow) => [
                { label: UNLINK, tone: "danger" as const, onSelect: () => unlinkRow.current(row) },
              ]),
            ]
          : []),
      ]),
    [canWrite],
  );
  // The preview is the table's, so opening or stepping through it never rebuilds the columns.
  const tablePreview = useMemo(
    () => ({ onPreview: (row: TechniqueRow) => setPreviewId(row.id), activeId: previewId }),
    [previewId],
  );
  const techniqueTable = useCollectionTable({
    columns: techniqueColumns,
    data: techniques,
    getRowId: (row) => row.id,
    preview: tablePreview,
    label: "ATT&CK techniques",
    pinnable: false,
    hideable: false,
  });
  const displayed = useDisplayedRecords(techniqueTable);
  const preview = techniques.find((row) => row.id === previewId);

  const several = techniques.length > 1;
  const countering = useMemo(
    () => controlColumns(programId, techniqueNames, several),
    [programId, techniqueNames, several],
  );
  const controlTable = useCollectionTable({
    columns: countering,
    data: controls,
    getRowId: (row) => row.id,
    label: "Countering controls",
    // What the program does not hold reads first; the Baseline heading says the order and turns it.
    initialState: { sorting: [{ id: "baseline", desc: false }] },
  });

  // What the picker offers: every technique of either appendix the risk does not name yet.
  const offered = useFrameworkItems(ATTACK_FRAMEWORKS, {
    kinds: TECHNIQUE_KINDS,
    enabled: opened,
  });
  const tacticLinks = useFrameworkItemLinks(ATTACK_FRAMEWORKS, TACTIC_LINKS, { enabled: opened });
  const vocabulary = useFrameworkItems(ATTACK_FRAMEWORKS, {
    kinds: VOCABULARY_KINDS,
    enabled: opened,
  });
  const choices = useMemo<ChoiceRow[]>(() => {
    const named = new Set(
      techniques.map((technique) => `${technique.framework} ${technique.code}`),
    );
    return techniqueChoices(
      offered.data ?? [],
      tacticLinks.data ?? [],
      (vocabulary.data ?? []).filter((item) => item.kind === "tactic"),
    )
      .filter((choice) => !named.has(`${choice.framework} ${choice.code}`))
      .map((choice) => ({
        ...choice,
        name: codedName(choice),
        matrix: attackMatrix(choice.framework) ?? null,
      }));
  }, [offered.data, tacticLinks.data, vocabulary.data, techniques]);
  const choiceQueries = [offered, tacticLinks, vocabulary];
  const choiceState = choiceQueries.some((query) => query.isError)
    ? "error"
    : choiceQueries.some((query) => query.data === undefined)
      ? "loading"
      : "ready";

  /**
   * The first techniques replace an empty state, and the button in it that opened the picker, with
   * a toolbar's: once the closing dialog has let go of focus and it has nowhere to be, it goes to
   * the toolbar's Link ATT&CK technique.
   */
  function focusActionWhenLost() {
    let tries = 0;
    const settle = () => {
      const active = document.activeElement;
      const target = focus.target.current;
      if ((!active || active === document.body) && target?.isConnected) {
        target.focus();
        if (document.activeElement === target) return;
      }
      if (tries++ < 120) requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
  }
  async function linkChosen(chosen: ChoiceRow[]) {
    const first = techniques.length === 0;
    try {
      await link.mutateAsync({ riskId: risk.id, itemIds: chosen.map((choice) => choice.id) });
    } catch (cause) {
      // The browser keeps the choice and says this; a technique the risk names is passed over.
      throw new Error(
        `${causeText(cause, "The ATT&CK techniques could not be linked.")} Your choice is kept; linking it again will not name a technique twice.`,
      );
    }
    toast.add({
      type: "success",
      title:
        chosen.length === 1
          ? "ATT&CK technique linked"
          : `${chosen.length} ATT&CK techniques linked`,
      description: chosen.map((choice) => choice.name).join("; "),
    });
    if (first) focusActionWhenLost();
  }
  function beginLinking() {
    setPreviewId(null);
    setOpened(true);
    setLinking(true);
  }

  // The action keeps its place while the risk's techniques load: the picker leaves out the ones the
  // risk names, so it waits for them. A workspace without the reference data has nothing to link.
  const linkable = canWrite && data?.loaded !== false;
  const waiting = data
    ? undefined
    : threats.isError
      ? "The risk's ATT&CK techniques could not be loaded. Retry loading them first."
      : "The risk's ATT&CK techniques are still loading.";
  const linkAction = (takesFocus: boolean) =>
    linkable ? (
      <Button
        // An unlink takes its row and the menu that asked; focus comes back here.
        {...(takesFocus
          ? {
              ref: (node: HTMLButtonElement | null) => {
                focus.target.current = node;
              },
            }
          : {})}
        size="small"
        variant="secondary"
        iconBefore={<Plus />}
        disabledReason={waiting}
        onClick={beginLinking}
      >
        {LINK}
      </Button>
    ) : undefined;
  const loaded = data?.loaded !== false;
  return (
    <>
      <Section
        title="ATT&CK techniques"
        count={data ? data.totals.techniques : undefined}
        countMax={9999}
      >
        <ProductCollection
          compact
          keepQuestion={false}
          search={false}
          table={techniqueTable}
          queries={[threats]}
          noun={techniqueNoun}
          // A technique has no page: its row opens its preview, as its name does.
          onRowClick={(row) => setPreviewId(row.id)}
          action={linkAction(true)}
          empty={
            loaded
              ? {
                  title: "No ATT&CK techniques linked",
                  description: canWrite
                    ? "Link the techniques this risk concerns."
                    : "This risk names no ATT&CK technique.",
                  icon: <Crosshair />,
                  action: linkAction(true),
                }
              : {
                  title: "ATT&CK techniques are not loaded",
                  description: NOT_LOADED,
                  icon: <Crosshair />,
                }
          }
        />
        {canWrite && (
          // Mounted while the tab is, so the browser plays its exit; each opening starts afresh.
          <RecordBrowser
            open={linking}
            title={LINK}
            description="Find, read and choose the ATT&CK techniques this risk concerns."
            records={choices}
            columns={choiceColumns}
            filters={["matrix", "tactics"]}
            previewColumn="name"
            searchPlaceholder="Find ATT&CK techniques"
            recordTitle={(row) => row.name}
            state={choiceState}
            error="The ATT&CK techniques could not be loaded."
            onRetry={() => {
              for (const query of choiceQueries) if (query.isError) void query.refetch();
            }}
            empty={
              offered.data?.length
                ? {
                    illustration: "done",
                    title: "Every ATT&CK technique is linked",
                    description:
                      "This risk already names every technique the reference data holds.",
                  }
                : {
                    illustration: "shield",
                    title: "No ATT&CK techniques loaded",
                    description: NOT_LOADED,
                  }
            }
            renderPreview={(row) => (
              <TechniqueDetails
                key={row.id}
                code={row.code}
                framework={row.framework}
                tactics={row.tactics}
                catalogRevisionId={data?.catalogRevisionId}
              />
            )}
            context={<KeyValue label="Risk">{risk.title}</KeyValue>}
            onClose={() => setLinking(false)}
            onConfirm={linkChosen}
            confirmLabel={LINK}
          />
        )}
        {preview && !linking && (
          <RecordPreviewPanel
            title={preview.name}
            label="ATT&CK technique preview"
            defaultWidth={640}
            onClose={() => setPreviewId(null)}
            recordActions={
              canWrite ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <IconButton
                        size="small"
                        variant="subtle"
                        label="ATT&CK technique actions"
                        icon={<MoreHorizontal />}
                      />
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="danger"
                      onClick={() => void unlinkTechnique(preview)}
                    >
                      {UNLINK}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : undefined
            }
            navigation={
              <RecordPreviewActions
                table="framework_items"
                record={{ id: preview.id }}
                rows={displayed}
                onSelect={(row) => setPreviewId(row.id)}
              />
            }
          >
            <TechniqueDetails
              key={preview.id}
              code={preview.code}
              framework={preview.framework}
              tactics={preview.tactics}
              catalogRevisionId={data?.catalogRevisionId}
              programId={programId}
            />
          </RecordPreviewPanel>
        )}
        {confirmation}
      </Section>
      <Section
        title="Countering controls"
        count={data ? data.totals.controls : undefined}
        countMax={9999}
      >
        <ProductCollection
          compact
          keepQuestion={false}
          table={controlTable}
          queries={[threats]}
          noun={controlNoun}
          onRowClick={(row) =>
            open("controls", { id: row.id, ...(programId ? { program_id: programId } : {}) })
          }
          filters={
            <>
              <DataTable.Filter table={controlTable} column="baseline" />
              {several && <DataTable.Filter table={controlTable} column="techniques" />}
            </>
          }
          empty={
            techniques.length
              ? {
                  title: "No countering controls",
                  description: "Appendices F and G print no control against these techniques.",
                  icon: <ShieldCheck />,
                }
              : {
                  title: "No countering controls",
                  description: loaded
                    ? "The controls that counter a technique appear once this risk names one."
                    : NOT_LOADED,
                  icon: <ShieldCheck />,
                  action: linkAction(false),
                }
          }
        />
      </Section>
    </>
  );
}
