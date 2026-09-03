/**
 * The control board: the SCTM as a working surface rather than an artifact.
 *
 * A funnel across the top says how far the baseline has gotten along the
 * canonical path. Every row below is one control, and the row IS its pipeline:
 * six segments, filled, empty, hatched or broken. Colour appears only where the
 * strip breaks; a control that is through carries no words at all, because
 * Satisfied is the absence of a badge. Selecting a row opens the control's work
 * beside the board, with the same six stages as the editor's spine — click a
 * stage, work that stage — and ends with why the control is here at all.
 *
 * Presentation over `buildBoard`. The only stores touched are the ones the
 * existing control record already writes to, through the same components.
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import { nodeById } from "@/lib/composition";
import { Determination, EvidenceBlock, GateList, Narrative } from "@/components/app/control-work";
import { ControlRequirementTable } from "@/components/app/requirements";
import {
  Badge,
  Block,
  Box,
  Button,
  Empty,
  Field,
  FilterChip,
  Grid,
  Id,
  Inline,
  NativeSelect,
  Stack,
  Table,
  Textarea,
  ToggleGroup,
  Toolbar,
} from "@ledger/design-system";
import {
  buildBoard,
  groupBoard,
  lensLabels,
  stageKeys,
  type BoardControl,
  type FunnelStage,
  type Lens,
  type Stage,
  type StageKey,
  type Bucket,
} from "@/lib/control-board";
import {
  assignOwner,
  currentSession,
  offersFor,
  perform,
  preferredScope,
  useWorkVersion,
  workFor,
  type ControlWork,
  type WorkContext,
} from "@/lib/control-work";
import { evidenceCatalog } from "@/lib/evidence-catalog";
import { peopleForProgram } from "@/lib/people";
import { allocationsFor, requirementsForControl } from "@/lib/requirements";
import { determinationTone, rowCurrencyTone, useControlText, useSctm } from "@/lib/sctm";
import { controlSetFor, scopesForProgram } from "@/lib/scopes";
import { cn } from "@/lib/utils";

/* ── Stage strip ─────────────────────────────────────────────────────────── */

const segment: Record<Stage["state"], string> = {
  hollow: "border border-dashed border-bold bg-transparent",
  empty: "bg-neutral",
  partial: "bg-neutral",
  full: "bg-neutral-bold",
  broken: "bg-danger-bold",
  suspect: "bg-warning-bold",
  unknown: "bg-transparent text-subtlest",
};

/**
 * Unknown is hatched, never a flat grey: it reads as a hole in the record, not
 * as a neutral outcome. Drawn in currentColor so the tone class decides how
 * loud it is.
 */
const hatch: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(135deg, transparent 0 2px, currentColor 2px 3px)",
};

function segmentStyle(state: Stage["state"]): CSSProperties | undefined {
  return state === "unknown" ? hatch : undefined;
}

/**
 * Six segments, one per stage. Neutral fill graded by how much of the control
 * is through the stage; red where it broke; dashed where nothing is owed.
 */
export function StageStrip({
  stages,
  size = "sm",
  active,
  onSelect,
}: {
  stages: Stage[];
  size?: "sm" | "lg";
  active?: StageKey | null;
  onSelect?: (key: StageKey) => void;
}) {
  if (size === "sm") {
    return (
      <Inline
        role="img"
        aria-label={stages.map((s) => `${s.label}: ${s.state}`).join(", ")}
        as="span"
        display="inline-flex"
        space="space.025"
        alignBlock="center"
      >
        {stages.map((s) => (
          <span
            key={s.key}
            title={`${s.label} · ${s.note}`}
            className={cn(
              "relative block h-100 w-250 overflow-hidden rounded-xsmall",
              segment[s.state],
            )}
            style={segmentStyle(s.state)}
          >
            {s.state === "partial" ? (
              <span
                className="absolute inset-y-0 left-0 bg-neutral-bold"
                style={{ width: `${Math.round(s.fill * 100)}%` }}
              />
            ) : null}
          </span>
        ))}
      </Inline>
    );
  }

  return (
    <Grid gap="space.050" templateColumns="repeat(6, minmax(0, 1fr))">
      {stages.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            type="button"
            onClick={onSelect ? () => onSelect(s.key) : undefined}
            aria-pressed={isActive}
            title={s.note}
            className="group/stage min-w-0 text-left"
          >
            <span
              className={cn(
                "relative block h-100 w-full overflow-hidden rounded-small",
                segment[s.state],
              )}
              style={segmentStyle(s.state)}
            >
              {s.state === "partial" ? (
                <span
                  className="absolute inset-y-0 left-0 bg-neutral-bold"
                  style={{ width: `${Math.round(s.fill * 100)}%` }}
                />
              ) : null}
            </span>
            <Box
              className={cn(
                "pt-075 block truncate border-b font-body-xsmall transition-colors",
                isActive
                  ? "border-bold text-default"
                  : "border-transparent text-subtle group-hover/stage:text-default",
              )}
              as="span"
              paddingBlockEnd="space.025"
            >
              {s.label}
            </Box>
          </button>
        );
      })}
    </Grid>
  );
}

/* ── Funnel ──────────────────────────────────────────────────────────────── */

/**
 * Six counts over one denominator. Click a stage to see the controls stuck
 * before it; click again to clear. This is the program's coverage — how far
 * along the path the baseline has gotten — and it is computed from the same
 * rows as the board, so it cannot disagree with them.
 */
export function Funnel({
  funnel,
  total,
  hollow,
  through,
  unknown,
  active,
  onSelect,
}: {
  funnel: FunnelStage[];
  total: number;
  hollow: number;
  through: number;
  unknown: number;
  active: StageKey | null;
  onSelect: (key: StageKey | null) => void;
}) {
  return (
    <div className="rounded-medium border border-default bg-surface">
      <Grid
        className="divide-y md:divide-x md:divide-y-0"
        templateColumns={{ base: "repeat(3, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" }}
      >
        {funnel.map((f) => {
          const isActive = active === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onSelect(isActive ? null : f.key)}
              aria-pressed={isActive}
              className={cn(
                "px-200 py-150 text-left transition-colors",
                isActive ? "bg-neutral" : "hover:bg-surface-hovered",
              )}
            >
              <div className="font-body-small text-subtle">{f.label}</div>
              <Inline className="pt-025" space="space.075" alignBlock="baseline">
                <span className="tabular-nums font-heading-small font-semibold">{f.reached}</span>
                <span className="tabular-nums font-body-small text-subtle">of {total}</span>
              </Inline>
              <Box paddingBlockStart="space.100">
                <div
                  className="w-full overflow-hidden rounded-full bg-neutral"
                  style={{ height: 3 }}
                >
                  <div
                    className="h-full bg-neutral-bold"
                    style={{ width: `${total ? Math.round((f.reached / total) * 100) : 0}%` }}
                  />
                </div>
              </Box>
              <Inline className="pt-075 font-body-xsmall min-h-200" space="space.150" shouldWrap>
                {f.note ? <span className="tabular-nums text-subtle">{f.note}</span> : null}
                {f.stuck ? <span className="tabular-nums text-subtle">{f.stuck} stuck</span> : null}
                {f.unknown ? (
                  <Inline
                    className="tabular-nums text-subtle"
                    as="span"
                    display="inline-flex"
                    space="space.050"
                    alignBlock="center"
                  >
                    <span
                      className="inline-block size-100 rounded-xsmall text-subtlest"
                      style={hatch}
                    />
                    {f.unknown} unknown
                  </Inline>
                ) : null}
                {f.broken ? (
                  <span className="tabular-nums text-danger">{f.broken} broken</span>
                ) : null}
                {f.suspect ? (
                  <span className="tabular-nums text-warning">{f.suspect} suspect</span>
                ) : null}
              </Inline>
            </button>
          );
        })}
      </Grid>
      <Inline
        className="border-t border-default px-200 py-100 font-body-small text-subtle"
        space="space.200"
        alignBlock="center"
      >
        <span className="tabular-nums">
          <span className="text-default">{through}</span> through every stage
        </span>
        <span className="tabular-nums">
          <span className="text-default">{unknown}</span> unknown
        </span>
        <span className="tabular-nums">{hollow} tailored out</span>
        <span className="ml-auto">Click a stage to see what is stuck before it</span>
      </Inline>
    </div>
  );
}

/* ── Rows ────────────────────────────────────────────────────────────────── */

const rowGrid = {
  wide: "grid-cols-[84px_minmax(0,1fr)_128px_150px_160px]",
  narrow: "grid-cols-[84px_minmax(0,1fr)_128px]",
};

function ownerLabel(c: BoardControl): string {
  if (c.owner) return c.owner;
  if (c.origination === "Common") return c.responsibleParty;
  return "Unassigned";
}

function BoardHeader({ narrow }: { narrow: boolean }) {
  return (
    <Grid
      className={cn(
        "border-b border-default px-100 pb-075 font-heading-xxsmall uppercase text-subtlest",
        narrow ? rowGrid.narrow : rowGrid.wide,
      )}
      gap="space.150"
      alignItems="center"
    >
      <span>Control</span>
      <span>Title</span>
      <span>Path</span>
      {narrow ? null : <span>Owner</span>}
      {narrow ? null : <span>Next</span>}
    </Grid>
  );
}

function BoardRow({
  control,
  active,
  narrow,
  muted,
  onSelect,
}: {
  control: BoardControl;
  active: boolean;
  narrow: boolean;
  /** Whether this row's colour has been spent by the badge budget. */
  muted: boolean;
  onSelect: () => void;
}) {
  const c = control;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group/row grid h-row w-full items-center gap-150 border-b border-default px-100 text-left font-body transition-colors",
        narrow ? rowGrid.narrow : rowGrid.wide,
        active ? "bg-selected" : "hover:bg-surface-hovered",
        c.hollow ? "text-subtle" : null,
      )}
    >
      <Id
        className={cn(
          "text-subtle transition-colors duration-fast",
          active ? "text-brand" : "group-hover/row:text-brand",
        )}
      >
        {c.id}
      </Id>
      <span className="truncate">{c.title}</span>
      <StageStrip stages={c.stages} />
      {narrow ? null : (
        <span className={cn("truncate", !c.owner ? "text-subtle" : null)}>{ownerLabel(c)}</span>
      )}
      {narrow ? null : <NextCell control={c} muted={muted} />}
    </button>
  );
}

/**
 * The badge budget: a control that is through says nothing, an ask is muted
 * text, and only a break carries colour. The strip already encodes the state,
 * so this cell never repeats it as a second coloured element.
 */
function NextCell({ control: c, muted }: { control: BoardControl; muted: boolean }) {
  if (c.bucket === "through") return <span aria-label="Through" />;
  if (muted) return <span className="truncate text-subtle">{c.next}</span>;
  const tone: Record<Bucket, string> = {
    other: "text-danger",
    invalidated: "text-danger",
    suspect: "text-warning",
    unknown: "text-subtle",
    through: "",
    hollow: "text-subtle",
    selected: "text-subtle",
    allocated: "text-subtle",
    implemented: "text-subtle",
    evidenced: "text-subtle",
    assessed: "text-subtle",
    current: "text-subtle",
  };
  return <span className={cn("truncate", tone[c.bucket])}>{c.next}</span>;
}

/* ── Detail ──────────────────────────────────────────────────────────────── */

function StageLine({
  stage,
  active,
  onSelect,
}: {
  stage: Stage;
  active: boolean;
  onSelect: () => void;
}) {
  const dot: Record<Stage["state"], string> = {
    hollow: "border border-dashed border-bold",
    empty: "bg-neutral-bold",
    partial: "bg-neutral-bold",
    full: "bg-neutral-bold",
    broken: "bg-danger-bold",
    suspect: "bg-warning-bold",
    unknown: "text-subtlest rounded-xsmall",
  };
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-100 rounded-medium px-100 py-050 text-left transition-colors",
        active ? "bg-neutral" : "hover:bg-surface-hovered",
      )}
    >
      <Box paddingBlockStart="space.075">
        <span
          className={cn(
            "shrink-0 rounded-full",
            stage.state === "unknown" ? "size-100" : "size-075",
            dot[stage.state],
          )}
          style={segmentStyle(stage.state)}
        />
      </Box>
      <span className="min-w-0 flex-1">
        <Inline as="span" space="space.100" alignBlock="baseline">
          <span className="font-body-small text-default">{stage.label}</span>
        </Inline>
        <span className="block truncate font-body-xsmall text-subtle">{stage.note}</span>
      </span>
    </button>
  );
}

function BoardDetail({
  control,
  programId,
  onClose,
}: {
  control: BoardControl;
  programId: string;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<StageKey>(control.stuckAt ?? "assessed");
  const scopes = useMemo(() => scopesForProgram(programId), [programId]);
  const scopeId = useMemo(
    () =>
      preferredScope(
        programId,
        control.id,
        scopes.map((s) => s.id),
      ),
    [programId, control.id, scopes],
  );
  const scope = scopes.find((s) => s.id === scopeId) ?? null;
  const inScopes = useMemo(
    () =>
      scopes.filter((s) => controlSetFor(s.id)?.controls.some((c) => c.control.id === control.id)),
    [scopes, control.id],
  );

  const workVersion = useWorkVersion();
  const [, tick] = useState(0);
  const refresh = () => tick((n) => n + 1);
  const work = useMemo(
    () => (scopeId ? workFor(programId, scopeId, control.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, scopeId, control.id, workVersion],
  );
  const derived = useMemo(
    () => requirementsForControl(control.id, programId),
    [control.id, programId],
  );
  const context: WorkContext = useMemo(() => {
    const allocated = derived.reduce((n, r) => n + allocationsFor(r.id).length, 0);
    return {
      contributors: allocated,
      contributorDetail: allocated
        ? `${derived.length} requirements, ${allocated} allocations`
        : "No allocated requirement",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived, workVersion]);

  const session = currentSession();
  const offers = work ? offersFor(work, context, session.role) : [];
  const people = useMemo(() => peopleForProgram(programId).map((p) => p.name), [programId]);
  const [ownerDraft, setOwnerDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const chosen = offers.find((o) => o.def.key === pending);

  const fire = () => {
    if (!work || !pending) return;
    const result = perform(work.id, pending, context, note);
    if (!result.ok) return setError(result.reason);
    setPending(null);
    setNote("");
    setError(null);
    refresh();
  };

  const owed = control.rows.filter((r) => r.determination !== "Not applicable");
  const stale = owed.filter((r) => r.currency !== "Current");
  const first = owed[0] ?? control.rows[0]!;
  const whoCanChange = [...new Set(offers.flatMap((o) => o.def.roles))];

  return (
    <aside className="rounded-medium border border-default bg-surface lg:sticky-rail lg:overflow-y-auto">
      <Inline
        className="border-b border-default px-200 py-150"
        space="space.150"
        alignBlock="start"
      >
        <div className="min-w-0 flex-1">
          <Inline className="font-body-small text-subtle" space="space.100" alignBlock="center">
            <Id className="text-default">{control.id}</Id>
            <Badge size="xsmall">{control.origination}</Badge>
            {scope ? <span className="truncate">{scope.name}</span> : null}
          </Inline>
          <Box className="truncate font-body-large font-medium" paddingBlockStart="space.025">
            {control.title}
          </Box>
        </div>
        <Link
          to="/programs/$programId/controls/$controlId"
          params={{ programId, controlId: control.id }}
          search={{ tab: undefined }}
          className="shrink-0 pt-025 font-body-small text-brand hover:underline"
        >
          Open record
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex shrink-0 items-center justify-center rounded-small text-subtle hover:bg-neutral-subtle-hovered hover:text-default size-300"
        >
          <X className="size-icon-medium" />
        </button>
      </Inline>

      <Box className="border-b border-default" paddingInline="space.200" paddingBlock="space.150">
        <StageStrip stages={control.stages} size="lg" active={stage} onSelect={setStage} />
      </Box>

      <Stack className="border-b border-default px-100 py-100" space="space.025">
        {control.stages.map((s) => (
          <StageLine
            key={s.key}
            stage={s}
            active={stage === s.key}
            onSelect={() => setStage(s.key)}
          />
        ))}
      </Stack>

      {/* An unknown has an owner and a resolution path, or it is not an
          unknown — it is a blank. Claiming the control is the first act, and
          it happens where the hole is seen, not on another page. */}
      {work && !work.owner && control.origination !== "Common" ? (
        <Box className="border-b border-default" paddingInline="space.200" paddingBlock="space.150">
          <Box className="font-body-small text-subtle" paddingBlockEnd="space.075">
            Nobody is accountable for {control.id}. Every later action needs an owner first.
          </Box>
          <Inline space="space.100" alignBlock="center">
            <NativeSelect
              aria-label="Owner"
              value={ownerDraft}
              onChange={(e) => setOwnerDraft(e.target.value)}
              className="h-control-small font-body"
              style={{ maxWidth: 260 }}
            >
              <option value="">Choose a person</option>
              {people.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </NativeSelect>
            <Button
              size="small"
              variant="primary"
              disabled={!ownerDraft}
              onClick={() => {
                assignOwner(work.id, ownerDraft);
                setOwnerDraft("");
                refresh();
              }}
            >
              Assign owner
            </Button>
          </Inline>
        </Box>
      ) : null}

      {work && offers.length ? (
        <Box className="border-b border-default" paddingInline="space.200" paddingBlock="space.150">
          <Inline space="space.100" shouldWrap>
            {offers.map((o) => (
              <Button
                key={o.def.key}
                size="small"
                variant={
                  o.allowed &&
                  (o.def.key === "implement" || o.def.key === "submit" || o.def.key === "satisfy")
                    ? "primary"
                    : "secondary"
                }
                disabled={!o.allowed}
                title={o.blocked ?? undefined}
                onClick={() => {
                  setPending(o.def.key);
                  setNote("");
                  setError(null);
                }}
              >
                {o.def.label}
              </Button>
            ))}
          </Inline>
          {offers.some((o) => !o.allowed) ? (
            <Stack className="pt-100 font-body-xsmall text-subtle" as="ul" space="space.025">
              {offers
                .filter((o) => !o.allowed)
                .map((o) => (
                  <li key={o.def.key} className="truncate">
                    {o.def.label}: {o.blocked}
                  </li>
                ))}
            </Stack>
          ) : null}
          {chosen ? (
            <Box paddingBlockStart="space.150">
              <Stack
                className="rounded-medium border border-default bg-surface-sunken p-150"
                space="space.100"
              >
                <div className="font-body-small text-subtle">
                  {chosen.def.label} · {session.name} · {session.role}
                </div>
                {/* An authority-bearing action names its consequence before it
                  is taken. A one-click state change is how a workflow turns
                  into folklore. */}
                <p className="font-body">
                  {consequenceOf(
                    chosen.def.key,
                    work!,
                    control,
                    context,
                    scope?.name ?? "this scope",
                  )}
                </p>
                <Field label={chosen.def.note === "required" ? "Reason (required)" : "Note"}>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                </Field>
                {error ? <div className="font-body-small text-danger">{error}</div> : null}
                <Inline space="space.100" alignInline="end">
                  <Button size="small" onClick={() => setPending(null)}>
                    Cancel
                  </Button>
                  <Button size="small" variant="primary" onClick={fire}>
                    {chosen.def.label}
                  </Button>
                </Inline>
              </Stack>
            </Box>
          ) : null}
        </Box>
      ) : null}

      <Stack className="px-200 py-150" space="space.200">
        {stage === "selected" ? (
          <Block title="Selected">
            <dl className="space-y-050">
              <DetailRow label="Origination">{control.origination}</DetailRow>
              <DetailRow label="Responsible">{control.responsibleParty}</DetailRow>
              <DetailRow label="Scopes">
                {inScopes.length ? inScopes.map((s) => s.name).join(", ") : "None"}
              </DetailRow>
              <DetailRow label="Rows">
                {owed.length} owed · {control.rows.length - owed.length} not applicable
              </DetailRow>
            </dl>
          </Block>
        ) : null}

        {stage === "allocated" ? (
          <>
            <Block title="Allocated to" count={control.nodes.length}>
              {control.nodes.length ? (
                <Stack className="font-body" as="ul" space="space.025">
                  {control.nodes.map((n) => (
                    <Inline key={n} as="li" space="space.100" alignBlock="baseline">
                      <Link
                        to="/programs/$programId/components/$componentId"
                        params={{ programId, componentId: n }}
                        className="hover:underline"
                      >
                        <Id className="text-brand">{n}</Id>
                      </Link>
                      <span className="truncate text-subtle">{nodeName(n)}</span>
                    </Inline>
                  ))}
                </Stack>
              ) : (
                <p className="font-body text-subtle">Nothing allocated.</p>
              )}
            </Block>
            <Block title="Requirements" count={derived.length}>
              {derived.length ? (
                <ControlRequirementTable
                  requirements={derived}
                  programId={programId}
                  controlId={control.id}
                  allocationCount={(id: string) => allocationsFor(id).length}
                />
              ) : (
                <p className="font-body text-subtle">
                  No requirement derived from this control yet.
                </p>
              )}
            </Block>
          </>
        ) : null}

        {stage === "implemented" ? (
          <>
            {/* Inherited is not locally implemented. Anything inherited shows
                the provider's half and the half that stays with the program in
                the same view, so a reader never mistakes the first for both. */}
            {control.origination !== "System specific" ? (
              <>
                <Block title="What the provider gives">
                  <p className="font-body">{control.responsibleParty}</p>
                  {first.inheritanceReason !== "—" ? (
                    <p className="pt-050 font-body-small text-subtle">{first.inheritanceReason}</p>
                  ) : null}
                </Block>
                <Block title="What stays with you">
                  <p
                    className={cn(
                      "font-body",
                      first.consumerResponsibility === "—" ? "text-subtle" : null,
                    )}
                  >
                    {first.consumerResponsibility === "—"
                      ? control.origination === "Common"
                        ? "Nothing. The provider's determination is reused, not copied — see why it is here."
                        : "Not stated. A hybrid control without a stated consumer half is an unknown."
                      : first.consumerResponsibility}
                  </p>
                </Block>
              </>
            ) : null}
            {work && control.origination !== "Common" ? (
              <>
                <Block title="Implementation statement">
                  <Narrative work={work} onChange={refresh} />
                </Block>
                <Block title="Gates">
                  <GateList work={work} context={context} />
                </Block>
              </>
            ) : null}
          </>
        ) : null}

        {stage === "evidenced" ? (
          <>
            {work ? (
              <Block title="Evidence" count={work.evidence.length}>
                <EvidenceBlock work={work} available={evidenceCatalog} onChange={refresh} />
              </Block>
            ) : null}
            <Block title="On the matrix" count={owed.filter((r) => r.evidence.length).length}>
              <RowTable
                rows={owed}
                cell={(r) => (
                  <span className="tabular-nums">
                    {r.evidence.length ? r.evidence.length : <span className="text-subtle">0</span>}
                  </span>
                )}
              />
            </Block>
          </>
        ) : null}

        {stage === "assessed" ? (
          <>
            {work ? (
              <Block title="Determination">
                <Determination work={work} onChange={refresh} />
              </Block>
            ) : null}
            <Block title="By requirement" count={owed.length}>
              <RowTable
                rows={owed}
                cell={(r) => (
                  <Badge size="xsmall" tone={determinationTone[r.determination]}>
                    {r.determination}
                  </Badge>
                )}
              />
            </Block>
          </>
        ) : null}

        {stage === "current" ? (
          <Block title="Currency" count={stale.length || null}>
            {stale.length ? (
              <RowTable
                rows={stale}
                cell={(r) => (
                  <Inline className="min-w-0" as="span" space="space.075" alignBlock="center">
                    <Badge size="xsmall" tone={rowCurrencyTone[r.currency]}>
                      {r.currency}
                    </Badge>
                    <span className="truncate font-body-small text-subtle" title={r.currencyReason}>
                      {r.currencyReason}
                    </span>
                  </Inline>
                )}
              />
            ) : (
              <p className="font-body text-subtle">
                {owed.some((r) => r.determination !== "Not assessed")
                  ? "All determinations current."
                  : "Nothing assessed yet."}
              </p>
            )}
            <Box paddingBlockStart="space.100">
              <Link
                to="/programs/$programId/baseline"
                params={{ programId }}
                className="font-body-small text-brand hover:underline"
              >
                Open configuration baseline
              </Link>
            </Box>
          </Block>
        ) : null}

        {/* Every derived state can explain itself. This is the bridge in
            words: which scope selected the control, whose claim it stands on,
            why it is allocated where it is, what would take the determination
            away, and who may change any of it. */}
        <Block title="Why is this here?">
          <dl className="space-y-050">
            <DetailRow label="Selected by">
              {control.selectedBy.length ? (
                <Stack as="ul" space="space.025">
                  {control.selectedBy.map((s) => (
                    <li key={s.scope}>
                      {s.scopeName}
                      <span className="text-subtle">
                        {" · "}
                        {s.objectives.length ? s.objectives.join(", ") : s.source}
                      </span>
                    </li>
                  ))}
                </Stack>
              ) : (
                <span className="text-subtle">
                  No scope's categorization selects it. It is here from the legacy matrix.
                </span>
              )}
            </DetailRow>
            <DetailRow label="Stands on">
              {control.origination === "System specific"
                ? "This program's own implementation"
                : `${control.responsibleParty} (${control.origination})`}
              {first.inheritanceReason !== "—" ? (
                <span className="block font-body-small text-subtle">{first.inheritanceReason}</span>
              ) : null}
            </DetailRow>
            <DetailRow label="Allocated because">
              <span className={first.allocationBasis === "—" ? "text-subtle" : undefined}>
                {first.allocationBasis === "—" ? "No basis recorded" : first.allocationBasis}
              </span>
            </DetailRow>
            <DetailRow label="Verified by">
              {first.method}
              {first.methodBasis !== "—" ? (
                <span className="block font-body-small text-subtle">{first.methodBasis}</span>
              ) : null}
            </DetailRow>
            <DetailRow label="Taken away by">
              {stale.length ? (
                <span className="text-danger">{stale[0]!.currencyReason}</span>
              ) : (
                `A change to ${
                  control.nodes.length ? nodeNames(control.nodes) : "the system as a whole"
                }, a parameter change, or a provider reassessment`
              )}
            </DetailRow>
            <DetailRow label="Changed by">
              {whoCanChange.length ? (
                whoCanChange.join(", ")
              ) : (
                <span className="text-subtle">Nobody, until an owner is assigned</span>
              )}
            </DetailRow>
          </dl>
        </Block>
      </Stack>
    </aside>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Inline space="space.100" alignBlock="baseline">
      <dt className="shrink-0 font-body-small text-subtle" style={{ width: 92 }}>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 font-body">{children}</dd>
    </Inline>
  );
}

function RowTable({
  rows,
  cell,
}: {
  rows: BoardControl["rows"];
  cell: (row: BoardControl["rows"][number]) => ReactNode;
}) {
  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "96px" }} />
        <col />
        <col style={{ width: "132px" }} />
      </colgroup>
      <tbody>
        {rows.map((r) => (
          <Table.Row key={r.key}>
            <Table.Cell className="max-w-none">
              <Id>{r.requirement}</Id>
            </Table.Cell>
            <Table.Cell className="truncate" title={r.statement}>
              {r.statement}
            </Table.Cell>
            <Table.Cell className="max-w-none">{cell(r)}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function nodeName(id: string): string {
  return nodeById.get(id)?.name ?? "";
}

function nodeNames(ids: string[]): string {
  const names = ids.slice(0, 2).map((id) => nodeById.get(id)?.name ?? id);
  return ids.length > 2 ? `${names.join(", ")} and ${ids.length - 2} more` : names.join(" and ");
}

/**
 * What the click legally does, in one sentence, before it is taken. The
 * numbers come from the record so the sentence cannot drift from the gates.
 */
function consequenceOf(
  key: string,
  work: ControlWork,
  control: BoardControl,
  context: WorkContext,
  scopeName: string,
): string {
  const id = control.id;
  const rev = work.narrativeRevision;
  const artifacts = `${work.evidence.length} ${work.evidence.length === 1 ? "artifact" : "artifacts"}`;
  const parts = control.nodes.length ? nodeNames(control.nodes) : "the system as a whole";
  switch (key) {
    case "plan":
      return `Marks ${id} in ${scopeName} as planned. Nothing is claimed yet and nobody is notified.`;
    case "partial":
      return `Claims ${id} is partially implemented. Revision ${rev} of the statement becomes the claim on record.`;
    case "implement":
      return `Claims ${id} is implemented in ${scopeName}, on revision ${rev} of the statement, ${artifacts} and ${context.contributors} ${context.contributors === 1 ? "contributor" : "contributors"}.`;
    case "submit":
      return `Hands ${id} to the assessor. Revision ${rev} and ${artifacts} are what they will judge; any edit after this is a new revision.`;
    case "withdraw":
      return `Takes ${id} back from the assessor. A determination in progress is dropped, not recorded.`;
    case "satisfy":
      return `Records Satisfied for ${id} against the configuration in force. A later change to ${parts} invalidates it.`;
    case "fail":
      return `Records Other than satisfied for ${id}. The program owes a finding and a POA&M item, and ${id} cannot ship until risk is accepted.`;
    case "accept-risk":
      return `Accepts the residual risk on ${id} as the authorizing official. The acceptance carries your name and today's date into the package.`;
    default:
      return `Changes ${id} in ${scopeName}.`;
  }
}

/* ── Board ───────────────────────────────────────────────────────────────── */

const lenses: Lens[] = ["family", "stage", "owner", "component"];

export function ControlBoard({ programId }: { programId: string }) {
  const text = useControlText();
  const sctm = useSctm(programId, text);
  const workVersion = useWorkVersion();
  const board = useMemo(
    () => buildBoard(programId, sctm),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, sctm, workVersion],
  );

  const [lens, setLens] = useState<Lens>("family");
  const [stage, setStage] = useState<StageKey | null>(null);
  const [gapsOnly, setGapsOnly] = useState(false);
  const [unassigned, setUnassigned] = useState(false);
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const session = currentSession();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return board.controls.filter(
      (c) =>
        (stage === null || c.stuckAt === stage) &&
        (!gapsOnly || c.gaps > 0) &&
        (!unassigned || (!c.hollow && !c.owner && c.origination !== "Common")) &&
        (!mine || c.owner === session.name) &&
        (!q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)),
    );
  }, [board.controls, stage, gapsOnly, unassigned, mine, query, session.name]);

  const groups = useMemo(() => groupBoard(filtered, lens), [filtered, lens]);

  // The badge budget: at most a third of a collection may carry colour. Past
  // that a tone says nothing about any one row, so it falls to muted text and
  // the funnel carries the count instead.
  const overBudget = useMemo(() => {
    const limit = filtered.length / 3;
    const count = (tone: BoardControl["nextTone"]) =>
      filtered.filter((c) => c.nextTone === tone && c.bucket !== "through").length;
    return { danger: count("danger") > limit, warning: count("warning") > limit };
  }, [filtered]);
  const selectedControl = selected ? (board.controls.find((c) => c.id === selected) ?? null) : null;
  const narrow = selectedControl !== null;

  return (
    <Box paddingBlockStart="space.150">
      <Funnel
        funnel={board.funnel}
        total={board.total}
        hollow={board.hollow}
        through={board.through}
        unknown={board.unknown}
        active={stage}
        onSelect={setStage}
      />

      <Toolbar
        search={query}
        onSearch={setQuery}
        placeholder="Control or title"
        actions={
          <span className="tabular-nums font-body-small text-subtle">
            {filtered.length} of {board.controls.length} controls
          </span>
        }
      >
        <ToggleGroup
          items={lenses.map((l) => ({ value: l, label: lensLabels[l] }))}
          value={lens}
          onChange={setLens}
        />
        <FilterChip label="Gaps" isActive={gapsOnly} onClick={() => setGapsOnly((v) => !v)} />
        <FilterChip
          label="Unassigned"
          isActive={unassigned}
          onClick={() => setUnassigned((v) => !v)}
        />
        <FilterChip
          label="Mine"
          {...(mine ? { value: session.name } : {})}
          isActive={mine}
          onClick={() => setMine((v) => !v)}
        />
        {stage ? (
          <FilterChip
            label="Stuck at"
            value={stageKeys.includes(stage) ? lensLabelFor(stage) : ""}
            isActive
            onClick={() => setStage(null)}
          />
        ) : null}
      </Toolbar>

      <Grid
        templateColumns={
          narrow ? { base: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 460px" } : "minmax(0, 1fr)"
        }
        gap="space.300"
      >
        <div className="min-w-0">
          {groups.length === 0 ? (
            <Empty title="No controls match" description="Clear a filter or the stage selection." />
          ) : (
            <>
              <BoardHeader narrow={narrow} />
              {groups.map((g) => (
                <section key={g.key}>
                  <Inline className="px-100 pb-050 pt-200" space="space.100" alignBlock="baseline">
                    <span className="font-heading-xxsmall uppercase text-subtlest">{g.label}</span>
                    <span className="tabular-nums font-body-xsmall text-subtle">{g.meta}</span>
                  </Inline>
                  {g.controls.map((c) => (
                    <BoardRow
                      key={`${g.key}:${c.id}`}
                      control={c}
                      active={c.id === selected}
                      narrow={narrow}
                      muted={
                        (c.nextTone === "danger" && overBudget.danger) ||
                        (c.nextTone === "warning" && overBudget.warning)
                      }
                      onSelect={() => setSelected(c.id === selected ? null : c.id)}
                    />
                  ))}
                </section>
              ))}
            </>
          )}
        </div>

        {selectedControl ? (
          <BoardDetail
            key={selectedControl.id}
            control={selectedControl}
            programId={programId}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </Grid>
    </Box>
  );
}

function lensLabelFor(key: StageKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
