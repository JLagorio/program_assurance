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
  Button,
  Field,
  FilterChip,
  ToggleGroup,
  Table,
  Textarea,
  Toolbar,
  Id,
  NativeSelect,
} from "@/ds/primitives";
import { Empty } from "@/ds/patterns";
import { Block } from "@/ds/shapes";
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
  hollow: "border border-dashed border-border-strong bg-transparent",
  empty: "bg-muted",
  partial: "bg-muted",
  full: "bg-muted-foreground/60",
  broken: "bg-legacy-danger",
  suspect: "bg-legacy-warning",
  unknown: "bg-transparent text-muted-foreground/55",
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
      <span
        className="inline-flex items-center gap-px"
        role="img"
        aria-label={stages.map((s) => `${s.label}: ${s.state}`).join(", ")}
      >
        {stages.map((s) => (
          <span
            key={s.key}
            title={`${s.label} · ${s.note}`}
            className={cn("relative block h-2 w-5 overflow-hidden rounded-[2px]", segment[s.state])}
            style={segmentStyle(s.state)}
          >
            {s.state === "partial" ? (
              <span
                className="absolute inset-y-0 left-0 bg-muted-foreground/60"
                style={{ width: `${Math.round(s.fill * 100)}%` }}
              />
            ) : null}
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-1">
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
                "relative block h-2.5 w-full overflow-hidden rounded-[3px]",
                segment[s.state],
              )}
              style={segmentStyle(s.state)}
            >
              {s.state === "partial" ? (
                <span
                  className="absolute inset-y-0 left-0 bg-muted-foreground/60"
                  style={{ width: `${Math.round(s.fill * 100)}%` }}
                />
              ) : null}
            </span>
            <span
              className={cn(
                "mt-1.5 block truncate border-b-2 pb-0.5 text-11 transition-colors",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground group-hover/stage:text-foreground",
              )}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
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
    <div className="rounded-md border border-border bg-card">
      <div className="grid grid-cols-3 divide-y divide-border md:grid-cols-6 md:divide-x md:divide-y-0">
        {funnel.map((f) => {
          const isActive = active === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onSelect(isActive ? null : f.key)}
              aria-pressed={isActive}
              className={cn(
                "px-4 py-3 text-left transition-colors",
                isActive ? "bg-muted" : "hover:bg-surface-hover",
              )}
            >
              <div className="text-12 text-muted-foreground">{f.label}</div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="tnum text-20 font-semibold tracking-[-0.02em]">{f.reached}</span>
                <span className="tnum text-12 text-muted-foreground">of {total}</span>
              </div>
              <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-muted-foreground/60"
                  style={{ width: `${total ? Math.round((f.reached / total) * 100) : 0}%` }}
                />
              </div>
              <div className="mt-1.5 flex min-h-4 flex-wrap gap-x-3 text-11">
                {f.note ? <span className="tnum text-muted-foreground">{f.note}</span> : null}
                {f.stuck ? (
                  <span className="tnum text-muted-foreground">{f.stuck} stuck</span>
                ) : null}
                {f.unknown ? (
                  <span className="tnum inline-flex items-center gap-1 text-muted-foreground">
                    <span
                      className="inline-block size-2 rounded-[2px] text-muted-foreground/55"
                      style={hatch}
                    />
                    {f.unknown} unknown
                  </span>
                ) : null}
                {f.broken ? <span className="tnum text-legacy-danger">{f.broken} broken</span> : null}
                {f.suspect ? <span className="tnum text-legacy-warning">{f.suspect} suspect</span> : null}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-12 text-muted-foreground">
        <span className="tnum">
          <span className="text-foreground">{through}</span> through every stage
        </span>
        <span className="tnum">
          <span className="text-foreground">{unknown}</span> unknown
        </span>
        <span className="tnum">{hollow} tailored out</span>
        <span className="ml-auto">Click a stage to see what is stuck before it</span>
      </div>
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
    <div
      className={cn(
        "grid items-center gap-3 border-b border-border px-2 pb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/80",
        narrow ? rowGrid.narrow : rowGrid.wide,
      )}
    >
      <span>Control</span>
      <span>Title</span>
      <span>Path</span>
      {narrow ? null : <span>Owner</span>}
      {narrow ? null : <span>Next</span>}
    </div>
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
        "group/row grid h-10 w-full items-center gap-3 border-b border-border-legacy-subtle px-2 text-left text-13 transition-colors",
        narrow ? rowGrid.narrow : rowGrid.wide,
        active ? "bg-primary-soft" : "hover:bg-surface-hover",
        c.hollow ? "text-muted-foreground" : null,
      )}
    >
      <Id
        className={cn(
          "text-muted-foreground transition-colors duration-100",
          active ? "text-primary" : "group-hover/row:text-primary",
        )}
      >
        {c.id}
      </Id>
      <span className="truncate">{c.title}</span>
      <StageStrip stages={c.stages} />
      {narrow ? null : (
        <span className={cn("truncate", !c.owner ? "text-muted-foreground" : null)}>
          {ownerLabel(c)}
        </span>
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
  if (muted) return <span className="truncate text-muted-foreground">{c.next}</span>;
  const tone: Record<Bucket, string> = {
    other: "text-legacy-danger",
    invalidated: "text-legacy-danger",
    suspect: "text-legacy-warning",
    unknown: "text-muted-foreground",
    through: "",
    hollow: "text-muted-foreground",
    selected: "text-muted-foreground",
    allocated: "text-muted-foreground",
    implemented: "text-muted-foreground",
    evidenced: "text-muted-foreground",
    assessed: "text-muted-foreground",
    current: "text-muted-foreground",
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
    hollow: "border border-dashed border-border-strong",
    empty: "bg-muted-foreground/30",
    partial: "bg-muted-foreground/60",
    full: "bg-muted-foreground/80",
    broken: "bg-legacy-danger",
    suspect: "bg-legacy-warning",
    unknown: "text-muted-foreground/70 rounded-[2px]",
  };
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-2 rounded-md px-2 py-1 text-left transition-colors",
        active ? "bg-muted" : "hover:bg-surface-hover",
      )}
    >
      <span
        className={cn(
          "mt-[6px] shrink-0 rounded-full",
          stage.state === "unknown" ? "size-2" : "size-1.5",
          dot[stage.state],
        )}
        style={segmentStyle(stage.state)}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-12 text-foreground">{stage.label}</span>
        </span>
        <span className="block truncate text-[11.5px] text-muted-foreground">{stage.note}</span>
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
    <aside className="rounded-md border border-border bg-card lg:sticky lg:top-4 lg:max-h-[calc(100vh-120px)] lg:self-start lg:overflow-y-auto">
      <div className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-12 text-muted-foreground">
            <Id className="text-foreground">{control.id}</Id>
            <Badge size="xsmall">{control.origination}</Badge>
            {scope ? <span className="truncate">{scope.name}</span> : null}
          </div>
          <div className="mt-0.5 truncate text-[15px] font-medium">{control.title}</div>
        </div>
        <Link
          to="/programs/$programId/controls/$controlId"
          params={{ programId, controlId: control.id }}
          search={{ tab: undefined }}
          className="shrink-0 pt-0.5 text-12 text-primary hover:underline"
        >
          Open record
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="border-b border-border px-4 py-3">
        <StageStrip stages={control.stages} size="lg" active={stage} onSelect={setStage} />
      </div>

      <div className="space-y-px border-b border-border px-2 py-2">
        {control.stages.map((s) => (
          <StageLine
            key={s.key}
            stage={s}
            active={stage === s.key}
            onSelect={() => setStage(s.key)}
          />
        ))}
      </div>

      {/* An unknown has an owner and a resolution path, or it is not an
          unknown — it is a blank. Claiming the control is the first act, and
          it happens where the hole is seen, not on another page. */}
      {work && !work.owner && control.origination !== "Common" ? (
        <div className="border-b border-border px-4 py-3">
          <div className="pb-1.5 text-12 text-muted-foreground">
            Nobody is accountable for {control.id}. Every later action needs an owner first.
          </div>
          <div className="flex items-center gap-2">
            <NativeSelect
              aria-label="Owner"
              value={ownerDraft}
              onChange={(e) => setOwnerDraft(e.target.value)}
              className="h-7 max-w-[260px] text-13"
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
          </div>
        </div>
      ) : null}

      {work && offers.length ? (
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap gap-2">
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
          </div>
          {offers.some((o) => !o.allowed) ? (
            <ul className="mt-2 space-y-0.5 text-[11.5px] text-muted-foreground">
              {offers
                .filter((o) => !o.allowed)
                .map((o) => (
                  <li key={o.def.key} className="truncate">
                    {o.def.label}: {o.blocked}
                  </li>
                ))}
            </ul>
          ) : null}
          {chosen ? (
            <div className="mt-3 space-y-2 rounded-md border border-border bg-legacy-subtle p-3">
              <div className="text-12 text-muted-foreground">
                {chosen.def.label} · {session.name} · {session.role}
              </div>
              {/* An authority-bearing action names its consequence before it
                  is taken. A one-click state change is how a workflow turns
                  into folklore. */}
              <p className="text-13">
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
              {error ? <div className="text-12 text-legacy-danger">{error}</div> : null}
              <div className="flex justify-end gap-2">
                <Button size="small" onClick={() => setPending(null)}>
                  Cancel
                </Button>
                <Button size="small" variant="primary" onClick={fire}>
                  {chosen.def.label}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4 px-4 py-3">
        {stage === "selected" ? (
          <Block title="Selected">
            <dl className="space-y-[3px]">
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
                <ul className="space-y-0.5 text-13">
                  {control.nodes.map((n) => (
                    <li key={n} className="flex items-baseline gap-2">
                      <Link
                        to="/programs/$programId/components/$componentId"
                        params={{ programId, componentId: n }}
                        className="hover:underline"
                      >
                        <Id className="text-primary">{n}</Id>
                      </Link>
                      <span className="truncate text-muted-foreground">{nodeName(n)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-13 text-muted-foreground">Nothing allocated.</p>
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
                <p className="text-13 text-muted-foreground">
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
                  <p className="text-13">{control.responsibleParty}</p>
                  {first.inheritanceReason !== "—" ? (
                    <p className="pt-1 text-12 text-muted-foreground">{first.inheritanceReason}</p>
                  ) : null}
                </Block>
                <Block title="What stays with you">
                  <p
                    className={cn(
                      "text-13",
                      first.consumerResponsibility === "—" ? "text-muted-foreground" : null,
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
                  <span className="tnum">
                    {r.evidence.length ? (
                      r.evidence.length
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
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
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Badge size="xsmall" tone={rowCurrencyTone[r.currency]}>
                      {r.currency}
                    </Badge>
                    <span
                      className="truncate text-12 text-muted-foreground"
                      title={r.currencyReason}
                    >
                      {r.currencyReason}
                    </span>
                  </span>
                )}
              />
            ) : (
              <p className="text-13 text-muted-foreground">
                {owed.some((r) => r.determination !== "Not assessed")
                  ? "All determinations current."
                  : "Nothing assessed yet."}
              </p>
            )}
            <div className="pt-2">
              <Link
                to="/programs/$programId/baseline"
                params={{ programId }}
                className="text-12 text-primary hover:underline"
              >
                Open configuration baseline
              </Link>
            </div>
          </Block>
        ) : null}

        {/* Every derived state can explain itself. This is the bridge in
            words: which scope selected the control, whose claim it stands on,
            why it is allocated where it is, what would take the determination
            away, and who may change any of it. */}
        <Block title="Why is this here?">
          <dl className="space-y-[3px]">
            <DetailRow label="Selected by">
              {control.selectedBy.length ? (
                <ul className="space-y-0.5">
                  {control.selectedBy.map((s) => (
                    <li key={s.scope}>
                      {s.scopeName}
                      <span className="text-muted-foreground">
                        {" · "}
                        {s.objectives.length ? s.objectives.join(", ") : s.source}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground">
                  No scope's categorization selects it. It is here from the legacy matrix.
                </span>
              )}
            </DetailRow>
            <DetailRow label="Stands on">
              {control.origination === "System specific"
                ? "This program's own implementation"
                : `${control.responsibleParty} (${control.origination})`}
              {first.inheritanceReason !== "—" ? (
                <span className="block text-12 text-muted-foreground">
                  {first.inheritanceReason}
                </span>
              ) : null}
            </DetailRow>
            <DetailRow label="Allocated because">
              <span className={first.allocationBasis === "—" ? "text-muted-foreground" : undefined}>
                {first.allocationBasis === "—" ? "No basis recorded" : first.allocationBasis}
              </span>
            </DetailRow>
            <DetailRow label="Verified by">
              {first.method}
              {first.methodBasis !== "—" ? (
                <span className="block text-12 text-muted-foreground">{first.methodBasis}</span>
              ) : null}
            </DetailRow>
            <DetailRow label="Taken away by">
              {stale.length ? (
                <span className="text-legacy-danger">{stale[0]!.currencyReason}</span>
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
                <span className="text-muted-foreground">Nobody, until an owner is assigned</span>
              )}
            </DetailRow>
          </dl>
        </Block>
      </div>
    </aside>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-[92px] shrink-0 text-12 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-13">{children}</dd>
    </div>
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
    <div className="pt-3">
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
          <span className="tnum text-12 text-muted-foreground">
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

      <div
        className={cn(
          "grid gap-6",
          narrow ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_460px]" : "grid-cols-1",
        )}
      >
        <div className="min-w-0">
          {groups.length === 0 ? (
            <Empty title="No controls match" description="Clear a filter or the stage selection." />
          ) : (
            <>
              <BoardHeader narrow={narrow} />
              {groups.map((g) => (
                <section key={g.key}>
                  <div className="flex items-baseline gap-2 px-2 pb-1 pt-4">
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/80">
                      {g.label}
                    </span>
                    <span className="tnum text-11 text-muted-foreground">{g.meta}</span>
                  </div>
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
      </div>
    </div>
  );
}

function lensLabelFor(key: StageKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
