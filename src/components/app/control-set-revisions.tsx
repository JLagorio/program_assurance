/**
 * Control-set change management, as pieces that can sit wherever the reader
 * starts: the program's Systems tab (every change across the program), the
 * approver's queue (decide without leaving), and the scope record (the one
 * place a draft is edited).
 *
 * `§5.2` step 7 made concrete. The in-force revision is never edited; a
 * change is a new draft, its delta against the in-force set is computed rather
 * than described, each removed control names the work record it retires, and
 * approval is the one action that touches the live scope. Every action carries
 * its reason when it is blocked and its consequence before it is taken.
 */

import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  Badge,
  Block,
  Button,
  Dialog,
  Field,
  Grid,
  Id,
  Indicator,
  Inline,
  Input,
  Stack,
  Table,
  Textarea,
  Timeline,
  toast,
} from "@ledger/design-system";
import {
  approvalConsequence,
  deltaOf,
  eventTone,
  eventsForScope,
  gatesFor,
  inForceRevision,
  offersFor,
  openRevision,
  openStates,
  proposeBlocked,
  proposeRevision,
  performRevision,
  resolveDraft,
  revisionById,
  revisionTone,
  revisionsForScope,
  siblingCeiling,
  triadLabel,
  updateDraft,
  useControlSetVersion,
  type ControlSetRevision,
  type RevisionActionKey,
  type RevisionDelta,
  type RevisionOffer,
} from "@/lib/control-set";
import { currentSession, useWorkVersion } from "@/lib/control-work";
import { positionOf } from "@/lib/control-work";
import { frameworkById } from "@/lib/frameworks";
import { scopeById } from "@/lib/scopes";

import { RevisionGates, ScopeTailoringPane } from "./scope-tailoring";

/* ------------------------------------------------------------ State strip */

/** In force and proposed — the facts a scope record works under. */
export function RevisionStrip({ scopeId }: { scopeId: string }) {
  useControlSetVersion();
  const inForce = inForceRevision(scopeId);
  const open = openRevision(scopeId);
  return (
    <Inline
      className="font-body-small text-subtle"
      space="space.250"
      rowSpace="space.075"
      alignBlock="center"
      shouldWrap
    >
      <Inline as="span" space="space.075" alignBlock="center">
        In force
        {inForce ? (
          <Badge size="xsmall" tone="success">
            v{inForce.number} · since {inForce.decided}
          </Badge>
        ) : (
          <Badge size="xsmall" tone="neutral">
            None yet
          </Badge>
        )}
      </Inline>
      <Inline as="span" space="space.075" alignBlock="center">
        Proposed
        {open ? (
          <Indicator tone={revisionTone[open.state]}>
            v{open.number} · {open.state}
          </Indicator>
        ) : (
          <Indicator tone="neutral">Nothing open</Indicator>
        )}
      </Inline>
    </Inline>
  );
}

/* -------------------------------------------------------------- Actions */

/**
 * The next moves on one revision for the current role, each disabled with its
 * reason, each confirmed with its consequence. Self-contained so a table row,
 * a sheet footer and a record block all offer exactly the same thing.
 */
export function RevisionActions({
  revision,
  align = "end",
}: {
  revision: ControlSetRevision;
  align?: "start" | "end";
}) {
  const version = useControlSetVersion();
  const workVersion = useWorkVersion();
  const session = currentSession();
  const [acting, setActing] = useState<RevisionOffer | null>(null);
  const [note, setNote] = useState("");

  const inForce = inForceRevision(revision.scope);
  const delta = useMemo(
    () => deltaOf(revision, inForce, revision.scope),
    [revision, inForce, version, workVersion],
  );
  const offers = useMemo(
    () => offersFor(revision, session.role),
    [revision, session.role, version, workVersion],
  );
  const scope = scopeById.get(revision.scope);

  const perform = () => {
    if (!acting) return;
    const result = performRevision(revision.id, acting.def.key, note);
    if (!result.ok) {
      toast.error("Not applied", { description: result.reason });
      return;
    }
    toast.success(acting.def.label, {
      description: `${scope?.name ?? revision.scope} · v${revision.number}`,
    });
    setActing(null);
    setNote("");
  };

  if (offers.length === 0) return null;
  const blocked = offers.find((o) => !o.allowed)?.blocked ?? null;

  return (
    <Stack space="space.050" alignInline={align === "end" ? "end" : "start"}>
      <Inline space="space.100" alignBlock="center">
        {offers.map((o) => (
          <Button
            key={o.def.key}
            size="small"
            variant={
              o.def.tone === "danger"
                ? "danger"
                : o.def.key === "submit" || o.def.key === "approve"
                  ? "primary"
                  : "secondary"
            }
            disabled={!o.allowed}
            title={o.blocked ?? undefined}
            onClick={() => setActing(o)}
          >
            {o.def.label}
          </Button>
        ))}
      </Inline>
      {blocked ? (
        <span className={`font-body-xsmall text-subtle ${align === "end" ? "text-right" : ""}`}>
          {blocked}
        </span>
      ) : null}

      {acting ? (
        acting.def.note === "required" ? (
          <Dialog
            open
            onClose={() => setActing(null)}
            title={acting.def.label}
            description={consequenceFor(acting.def.key, revision, delta)}
            footer={
              <>
                <Button variant="subtle" onClick={() => setActing(null)}>
                  Cancel
                </Button>
                <Button
                  variant={acting.def.tone === "danger" ? "danger" : "primary"}
                  onClick={perform}
                  disabled={!note.trim()}
                >
                  {acting.def.label}
                </Button>
              </>
            }
          >
            <Field label="Reason" hint="Recorded on the revision and in its history.">
              <Textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </Dialog>
        ) : (
          <AlertDialog
            open
            onClose={() => setActing(null)}
            onConfirm={perform}
            title={`${acting.def.label} v${revision.number}?`}
            description={consequenceFor(acting.def.key, revision, delta)}
            confirmLabel={acting.def.label}
            tone={acting.def.tone}
          />
        )
      ) : null}
    </Stack>
  );
}

/** "Propose change" with its reason dialog; disabled with the reason when a revision is already open. */
export function ProposeChange({ scopeId }: { scopeId: string }) {
  useControlSetVersion();
  useWorkVersion();
  const [proposing, setProposing] = useState(false);
  const [reason, setReason] = useState("");
  const session = currentSession();
  const inForce = inForceRevision(scopeId);
  const scope = scopeById.get(scopeId);
  const blocked = proposeBlocked(scopeId, session.role);

  const propose = () => {
    const rev = proposeRevision(scopeId, reason);
    setProposing(false);
    setReason("");
    if (rev) toast.success(`v${rev.number} drafted`, { description: rev.reason });
  };

  return (
    <Stack space="space.050" alignInline="end">
      <Button
        size="small"
        variant="primary"
        disabled={!!blocked}
        title={blocked ?? undefined}
        onClick={() => setProposing(true)}
      >
        Propose change
      </Button>
      {blocked ? <span className="font-body-xsmall text-subtle">{blocked}</span> : null}
      <Dialog
        open={proposing}
        onClose={() => setProposing(false)}
        title="Propose a change"
        description={
          inForce
            ? `Copies v${inForce.number} into a draft you can edit. Nothing changes for ${scope?.name ?? "the scope"} until the draft is approved.`
            : "Starts the first revision for this scope."
        }
        footer={
          <>
            <Button variant="subtle" onClick={() => setProposing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={propose} disabled={!reason.trim()}>
              Draft revision
            </Button>
          </>
        }
      >
        <Field label="What changed" hint="The reason the control set has to move.">
          <Textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="A new interface, a categorization challenge, an overlay revision, a finding…"
          />
        </Field>
      </Dialog>
    </Stack>
  );
}

/* --------------------------------------------------------------- Review */

/**
 * One revision, read or edited: its reason and facts, the gates it has to
 * pass, what it changes and what that costs, and — on the record page — the
 * tailoring pane bound to the draft. `compact` is the sheet: no editor, the
 * gates stacked under the facts.
 */
export function RevisionReview({
  revision,
  programId,
  compact = false,
}: {
  revision: ControlSetRevision;
  programId: string;
  compact?: boolean;
}) {
  const version = useControlSetVersion();
  const workVersion = useWorkVersion();
  const inForce = inForceRevision(revision.scope);
  const isOpen = openStates.includes(revision.state);
  const base = isOpen ? inForce : revision.supersedes ? revisionById(revision.supersedes) : null;
  const ceiling = useMemo(
    () => siblingCeiling(programId, revision.scope),
    [programId, revision.scope, version],
  );
  const gates = useMemo(
    () => (isOpen ? gatesFor(revision, { inForce, ceiling, scopeId: revision.scope }) : []),
    [revision, isOpen, inForce, ceiling, version, workVersion],
  );
  const delta = useMemo(
    () => deltaOf(revision, base, revision.scope),
    [revision, base, version, workVersion],
  );
  const editable =
    !compact && (revision.state === "Draft" || revision.state === "Changes requested");

  return (
    <>
      <Block
        title={`v${revision.number} · ${revision.state}`}
        action={compact ? null : <RevisionActions revision={revision} />}
      >
        <Grid
          gap={compact ? "space.150" : "space.200"}
          templateColumns={compact ? undefined : { lg: "minmax(0, 1fr) 280px" }}
        >
          <Stack space="space.150">
            {editable ? (
              <Field label="Reason for the change">
                <Input
                  value={revision.reason}
                  onChange={(e) => updateDraft(revision.id, { reason: e.target.value })}
                  placeholder="What changed in the system or its environment"
                />
              </Field>
            ) : (
              <p className="font-body">{revision.reason}</p>
            )}
            <dl className="grid grid-cols-2 gap-x-300 gap-y-025 font-body-small sm:grid-cols-4">
              <RevisionFact label="Author">{revision.author}</RevisionFact>
              <RevisionFact label="Created">{revision.created}</RevisionFact>
              <RevisionFact label="Submitted">{revision.submitted ?? "—"}</RevisionFact>
              <RevisionFact label={isOpen ? "Supersedes" : "Decided"}>
                {isOpen
                  ? inForce
                    ? `v${inForce.number}`
                    : "—"
                  : revision.decidedBy
                    ? `${revision.decidedBy.replace(/\s*\(.*\)$/, "")} · ${revision.decided}`
                    : "—"}
              </RevisionFact>
            </dl>
            {revision.state === "Changes requested" && revision.note ? (
              <p className="rounded-medium border border-danger-subtle bg-danger px-150 py-100 font-body-small">
                <span className="font-medium">{revision.decidedBy}:</span> {revision.note}
              </p>
            ) : null}
          </Stack>
          {isOpen ? <RevisionGates gates={gates} /> : null}
        </Grid>
      </Block>

      <DeltaBlock delta={delta} base={base} programId={programId} compact={compact} />

      {compact ? null : (
        <ScopeTailoringPane
          key={`${revision.id}-${revision.state}`}
          draft={revision}
          ceiling={ceiling}
          readOnly={!editable}
          onChange={(patch) => updateDraft(revision.id, patch)}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------- Scope record body */

/** The change block on a scope's Control set tab: the open revision, or the one in force with "Propose change". */
export function ControlSetRevisions({
  programId,
  scopeId,
}: {
  programId: string;
  scopeId: string;
}) {
  useControlSetVersion();
  const inForce = inForceRevision(scopeId);
  const open = openRevision(scopeId);

  if (open) return <RevisionReview revision={open} programId={programId} />;

  return (
    <Block
      title={inForce ? `v${inForce.number} in force` : "No control set yet"}
      action={<ProposeChange scopeId={scopeId} />}
    >
      {inForce ? (
        <InForceSummary rev={inForce} />
      ) : (
        <p className="font-body-small text-subtle">
          Propose the first revision to categorize and tailor this scope.
        </p>
      )}
    </Block>
  );
}

/** Every revision this scope has had, and the event log beneath them. */
export function RevisionHistory({ scopeId }: { scopeId: string }) {
  const version = useControlSetVersion();
  const history = useMemo(() => revisionsForScope(scopeId), [scopeId, version]);
  const events = useMemo(() => eventsForScope(scopeId), [scopeId, version]);
  return (
    <>
      <Block title="Revisions" count={history.length}>
        <Table>
          <colgroup>
            <col style={{ width: "64px" }} />
            <col style={{ width: "150px" }} />
            <col />
            <col style={{ width: "150px" }} />
            <col style={{ width: "112px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "76px" }} />
          </colgroup>
          <thead>
            <Table.Row>
              <Table.Header>Rev</Table.Header>
              <Table.Header>State</Table.Header>
              <Table.Header>Reason</Table.Header>
              <Table.Header>Author</Table.Header>
              <Table.Header>Created</Table.Header>
              <Table.Header>Decided</Table.Header>
              <Table.Header className="text-right">Controls</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {history.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell>
                  <Id>v{r.number}</Id>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="xsmall" tone={revisionTone[r.state]}>
                    {r.state}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="truncate" title={r.reason}>
                  {r.reason}
                </Table.Cell>
                <Table.Cell className="truncate">{r.author}</Table.Cell>
                <Table.Cell className="tabular-nums">{r.created}</Table.Cell>
                <Table.Cell className="truncate">
                  {r.decidedBy ? `${r.decidedBy.replace(/\s*\(.*\)$/, "")} · ${r.decided}` : "—"}
                </Table.Cell>
                <Table.Cell className="tabular-nums text-right">{resolveDraft(r).total}</Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </Block>

      <Block title="History" count={events.length}>
        <Timeline>
          {events.map((e) => (
            <Timeline.Item
              key={e.id}
              tone={eventTone(e.kind)}
              title={e.summary}
              meta={`${e.actor} · ${e.role}`}
              time={e.at}
            >
              {e.note}
            </Timeline.Item>
          ))}
        </Timeline>
      </Block>
    </>
  );
}

/* -------------------------------------------------------------- Pieces */

function consequenceFor(
  key: RevisionActionKey,
  rev: ControlSetRevision,
  delta: RevisionDelta,
): string {
  const scope = scopeById.get(rev.scope)?.name ?? rev.scope;
  switch (key) {
    case "approve":
      return approvalConsequence(rev, delta);
    case "submit":
      return `v${rev.number} goes to the program manager's queue with ${delta.added} added and ${delta.removed} removed. The draft locks until they decide.`;
    case "withdraw":
      return `v${rev.number} leaves the queue and reopens as a draft for ${scope}.`;
    case "request-changes":
      return `v${rev.number} returns to its author with your note; nothing changes for ${scope}.`;
    case "reopen":
      return `v${rev.number} becomes a draft again; the request-for-changes note stays in its history.`;
    case "discard":
      return `v${rev.number} is withdrawn and keeps its number; the revision in force is untouched.`;
  }
}

function RevisionFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-body-small text-subtle">{label}</dt>
      <dd className="truncate">{children}</dd>
    </div>
  );
}

function InForceSummary({ rev }: { rev: ControlSetRevision }) {
  const set = resolveDraft(rev);
  const framework = frameworkById.get(rev.framework);
  return (
    <dl className="grid grid-cols-2 gap-x-300 gap-y-050 font-body-small sm:grid-cols-4">
      <RevisionFact label="Framework">{framework?.name ?? rev.framework}</RevisionFact>
      <RevisionFact label="Categorization">CNSSI 1253 {triadLabel(rev.parameters)}</RevisionFact>
      <RevisionFact label="Controls">{set.total}</RevisionFact>
      <RevisionFact label="Overlays">
        {set.overlays.map((o) => o.name).join(", ") || "None"}
      </RevisionFact>
      <RevisionFact label="Approved by">{rev.decidedBy ?? "—"}</RevisionFact>
      <RevisionFact label="Approved">{rev.decided ?? "—"}</RevisionFact>
      <RevisionFact label="Tailored by hand">{rev.tailoring.length || "—"}</RevisionFact>
      <RevisionFact label="Reason">{rev.reason}</RevisionFact>
    </dl>
  );
}

function DeltaBlock({
  delta,
  base,
  programId,
  compact,
}: {
  delta: RevisionDelta;
  base: ControlSetRevision | null;
  programId: string;
  compact: boolean;
}) {
  const against = base ? `against v${base.number}` : "first revision";
  return (
    <Block
      title="What changes"
      count={delta.empty ? "nothing" : `+${delta.added} −${delta.removed} · ${against}`}
    >
      {delta.triad.length || delta.parameters.length || delta.overlays.length ? (
        <dl className="pb-150 grid gap-x-300 gap-y-050 font-body-small sm:grid-cols-2">
          {delta.triad.map((t) => (
            <Inline key={t.objective} space="space.100" alignBlock="baseline">
              <dt className="shrink-0 text-subtle" style={{ width: 120 }}>
                {t.objective}
              </dt>
              <dd>
                {t.from ?? "—"} → <span className="font-medium">{t.to}</span>
              </dd>
            </Inline>
          ))}
          {delta.parameters.map((p) => (
            <Inline key={p.key} space="space.100" alignBlock="baseline">
              <dt className="shrink-0 text-subtle" style={{ width: 120 }}>
                {p.key}
              </dt>
              <dd>
                {p.from} → <span className="font-medium">{p.to}</span>
              </dd>
            </Inline>
          ))}
          {delta.overlays.map((o) => (
            <Inline
              key={o.overlay.id}
              className="sm:col-span-2"
              space="space.100"
              alignBlock="baseline"
            >
              <dt className="shrink-0 text-subtle" style={{ width: 120 }}>
                Overlay
              </dt>
              <dd>
                <span className="font-medium">{o.overlay.name}</span>{" "}
                {o.to ? "applied" : "no longer applied"}
                {o.rationale ? <span className="text-subtle"> — {o.rationale}</span> : null}
              </dd>
            </Inline>
          ))}
        </dl>
      ) : null}

      {delta.controls.length ? (
        <Table>
          <colgroup>
            <col style={{ width: "96px" }} />
            {compact ? null : <col />}
            <col style={{ width: "96px" }} />
            <col style={{ width: compact ? "140px" : "150px" }} />
            <col style={{ width: compact ? undefined : "320px" }} />
          </colgroup>
          <thead>
            <Table.Row>
              <Table.Header>Control</Table.Header>
              {compact ? null : <Table.Header>Title</Table.Header>}
              <Table.Header>Change</Table.Header>
              <Table.Header>Because</Table.Header>
              <Table.Header>Impact</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {delta.controls.slice(0, 40).map((c) => (
              <Table.Row key={c.control.id}>
                <Table.Cell className="max-w-none">
                  <Link
                    to="/programs/$programId/controls/$controlId"
                    params={{ programId, controlId: c.control.id }}
                    search={{ tab: undefined }}
                    className="hover:underline"
                  >
                    <Id className="text-brand">{c.control.id}</Id>
                  </Link>
                </Table.Cell>
                {compact ? null : <Table.Cell className="truncate">{c.control.title}</Table.Cell>}
                <Table.Cell>
                  <Badge size="xsmall" tone={c.kind === "added" ? "information" : "danger"}>
                    {c.kind === "added" ? "Added" : "Removed"}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="truncate" title={c.rationale ?? undefined}>
                  {c.source}
                </Table.Cell>
                <Table.Cell className="truncate">
                  {c.kind === "removed" ? (
                    c.work ? (
                      <Indicator tone="warning">
                        Retires {c.work.id} · {positionOf(c.work)}
                        {c.work.owner ? ` · ${c.work.owner}` : ""}
                      </Indicator>
                    ) : (
                      <span className="text-subtle">No work started</span>
                    )
                  ) : c.work ? (
                    <Indicator tone="neutral">Already worked · {positionOf(c.work)}</Indicator>
                  ) : (
                    <Indicator tone="information">New obligation · unassigned</Indicator>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="font-body-small text-subtle">
          {delta.empty
            ? "Nothing differs from the revision in force. Change something before submitting."
            : "The selection is unchanged; only parameters or overlay decisions moved."}
        </p>
      )}
      {delta.controls.length > 40 ? (
        <p className="pt-100 font-body-small text-subtle">
          First 40 of {delta.controls.length} shown.
        </p>
      ) : null}
      {delta.retiring.length || delta.opening ? (
        <p className="pt-100 font-body-small">
          {delta.retiring.length
            ? `${delta.retiring.length} work record${delta.retiring.length === 1 ? "" : "s"} would retire; evidence stays on the record. `
            : ""}
          {delta.opening
            ? `${delta.opening} new obligation${delta.opening === 1 ? "" : "s"} open unassigned.`
            : ""}
        </p>
      ) : null}
    </Block>
  );
}
