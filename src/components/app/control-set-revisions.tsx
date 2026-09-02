/**
 * The Revisions tab on a scope record: what is in force, what is proposed,
 * what the proposal changes and what that costs, and who can move it next.
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
  Button,
  Dialog,
  Field,
  Id,
  Indicator,
  Input,
  NativeSelect,
  Table,
  Textarea,
  Timeline,
  toast,
} from "@/ds/primitives";
import { Block } from "@/ds/shapes";
import {
  approvalConsequence,
  deltaOf,
  eventTone,
  eventsForScope,
  gatesFor,
  inForceRevision,
  offersFor,
  openRevision,
  proposeBlocked,
  proposeRevision,
  performRevision,
  resolveDraft,
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
import { currentSession, roles, setSession, useWorkVersion, type Role } from "@/lib/control-work";
import { positionOf } from "@/lib/control-work";
import { frameworkById } from "@/lib/frameworks";
import { scopeById } from "@/lib/scopes";

import { RevisionGates, ScopeTailoringPane } from "./scope-tailoring";

/* ------------------------------------------------------------ State strip */

/** In force, proposed, and who is driving — the facts the tab body works under. */
export function RevisionStrip({ scopeId }: { scopeId: string }) {
  useControlSetVersion();
  useWorkVersion();
  const inForce = inForceRevision(scopeId);
  const open = openRevision(scopeId);
  const session = currentSession();
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        In force
        {inForce ? (
          <Badge size="xs" tone="success">
            v{inForce.number} · since {inForce.decided}
          </Badge>
        ) : (
          <Badge size="xs" tone="neutral">
            None yet
          </Badge>
        )}
      </span>
      <span className="flex items-center gap-1.5">
        Proposed
        {open ? (
          <Indicator tone={revisionTone[open.state]}>
            v{open.number} · {open.state}
          </Indicator>
        ) : (
          <Indicator tone="neutral">Nothing open</Indicator>
        )}
      </span>
      <label className="ml-auto flex items-center gap-1.5">
        Acting as
        <NativeSelect
          aria-label="Role"
          value={session.role}
          onChange={(e) => setSession({ role: e.target.value as Role })}
          className="h-7 w-auto text-[12px]"
        >
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </NativeSelect>
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------- Tab */

export function ControlSetRevisions({
  programId,
  scopeId,
}: {
  programId: string;
  scopeId: string;
}) {
  const version = useControlSetVersion();
  const workVersion = useWorkVersion();
  const scope = scopeById.get(scopeId) ?? null;
  const inForce = inForceRevision(scopeId);
  const open = openRevision(scopeId);
  const session = currentSession();
  const [proposing, setProposing] = useState(false);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState<RevisionOffer | null>(null);
  const [note, setNote] = useState("");

  const history = useMemo(() => revisionsForScope(scopeId), [scopeId, version]);
  const events = useMemo(() => eventsForScope(scopeId), [scopeId, version]);
  const ceiling = useMemo(() => siblingCeiling(programId, scopeId), [programId, scopeId, version]);

  const gates = useMemo(
    () => (open ? gatesFor(open, { inForce, ceiling, scopeId }) : []),
    [open, inForce, ceiling, scopeId, version, workVersion],
  );
  const delta = useMemo(
    () => (open ? deltaOf(open, inForce, scopeId) : null),
    [open, inForce, scopeId, version, workVersion],
  );
  const offers = useMemo(
    () => (open ? offersFor(open, session.role) : []),
    [open, session.role, version, workVersion],
  );

  const propose = () => {
    const rev = proposeRevision(scopeId, reason);
    setProposing(false);
    setReason("");
    if (rev) toast.success(`v${rev.number} drafted`, { description: rev.reason });
  };

  const perform = () => {
    if (!acting || !open) return;
    const result = performRevision(open.id, acting.def.key, note);
    if (!result.ok) {
      toast.error("Not applied", { description: result.reason });
      return;
    }
    toast.success(acting.def.label, {
      description: `${scope?.name ?? scopeId} · v${open.number}`,
    });
    setActing(null);
    setNote("");
  };

  const blockedPropose = proposeBlocked(scopeId, session.role);
  const editable = open?.state === "Draft" || open?.state === "Changes requested";

  return (
    <div className="space-y-1">
      {open && delta ? (
        <>
          <Block
            title={`v${open.number} · ${open.state}`}
            action={
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  {offers.map((o) => (
                    <Button
                      key={o.def.key}
                      size="sm"
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
                </div>
                {offers.some((o) => !o.allowed) ? (
                  <span className="text-[11.5px] text-muted-foreground">
                    {offers.find((o) => !o.allowed)?.blocked}
                  </span>
                ) : null}
              </div>
            }
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-3">
                {editable ? (
                  <Field label="Reason for the change">
                    <Input
                      value={open.reason}
                      onChange={(e) => updateDraft(open.id, { reason: e.target.value })}
                      placeholder="What changed in the system or its environment"
                    />
                  </Field>
                ) : (
                  <p className="text-[13px]">{open.reason}</p>
                )}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[12.5px] sm:grid-cols-4">
                  <RevisionFact label="Author">{open.author}</RevisionFact>
                  <RevisionFact label="Created">{open.created}</RevisionFact>
                  <RevisionFact label="Submitted">{open.submitted ?? "—"}</RevisionFact>
                  <RevisionFact label="Supersedes">
                    {inForce ? `v${inForce.number}` : "—"}
                  </RevisionFact>
                </dl>
                {open.state === "Changes requested" && open.note ? (
                  <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[12.5px]">
                    <span className="font-medium">{open.decidedBy}:</span> {open.note}
                  </p>
                ) : null}
              </div>
              <RevisionGates gates={gates} />
            </div>
          </Block>

          <DeltaBlock delta={delta} inForce={inForce} programId={programId} />

          <ScopeTailoringPane
            key={`${open.id}-${open.state}`}
            draft={open}
            ceiling={ceiling}
            readOnly={!editable}
            onChange={(patch) => updateDraft(open.id, patch)}
          />
        </>
      ) : (
        <Block
          title={inForce ? `v${inForce.number} in force` : "No control set yet"}
          action={
            <Button
              size="sm"
              variant="primary"
              disabled={!!blockedPropose}
              title={blockedPropose ?? undefined}
              onClick={() => setProposing(true)}
            >
              Propose change
            </Button>
          }
        >
          {inForce ? (
            <InForceSummary rev={inForce} />
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              Propose the first revision to categorize and tailor this scope.
            </p>
          )}
          {blockedPropose ? (
            <p className="pt-2 text-[12px] text-muted-foreground">{blockedPropose}</p>
          ) : null}
        </Block>
      )}

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
                  <Badge size="xs" tone={revisionTone[r.state]}>
                    {r.state}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="truncate" title={r.reason}>
                  {r.reason}
                </Table.Cell>
                <Table.Cell className="truncate">{r.author}</Table.Cell>
                <Table.Cell className="tnum">{r.created}</Table.Cell>
                <Table.Cell className="truncate">
                  {r.decidedBy ? `${r.decidedBy.replace(/\s*\(.*\)$/, "")} · ${r.decided}` : "—"}
                </Table.Cell>
                <Table.Cell className="tnum text-right">{resolveDraft(r).total}</Table.Cell>
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
            <Button variant="ghost" onClick={() => setProposing(false)}>
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

      {acting && open && delta ? (
        acting.def.note === "required" ? (
          <Dialog
            open
            onClose={() => setActing(null)}
            title={acting.def.label}
            description={consequenceFor(acting.def.key, open, delta)}
            footer={
              <>
                <Button variant="ghost" onClick={() => setActing(null)}>
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
            title={`${acting.def.label} v${open.number}?`}
            description={consequenceFor(acting.def.key, open, delta)}
            confirmLabel={acting.def.label}
            tone={acting.def.tone}
          />
        )
      ) : null}
    </div>
  );
}

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

/* -------------------------------------------------------------- Pieces */

function RevisionFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="truncate">{children}</dd>
    </div>
  );
}

function InForceSummary({ rev }: { rev: ControlSetRevision }) {
  const set = resolveDraft(rev);
  const framework = frameworkById.get(rev.framework);
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-4">
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
  inForce,
  programId,
}: {
  delta: RevisionDelta;
  inForce: ControlSetRevision | null;
  programId: string;
}) {
  const against = inForce ? `against v${inForce.number}` : "first revision";
  return (
    <Block
      title="What changes"
      count={delta.empty ? "nothing" : `+${delta.added} −${delta.removed} · ${against}`}
    >
      {delta.triad.length || delta.parameters.length || delta.overlays.length ? (
        <dl className="mb-3 grid gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-2">
          {delta.triad.map((t) => (
            <div key={t.objective} className="flex items-baseline gap-2">
              <dt className="w-[120px] shrink-0 text-muted-foreground">{t.objective}</dt>
              <dd>
                {t.from ?? "—"} → <span className="font-medium">{t.to}</span>
              </dd>
            </div>
          ))}
          {delta.parameters.map((p) => (
            <div key={p.key} className="flex items-baseline gap-2">
              <dt className="w-[120px] shrink-0 text-muted-foreground">{p.key}</dt>
              <dd>
                {p.from} → <span className="font-medium">{p.to}</span>
              </dd>
            </div>
          ))}
          {delta.overlays.map((o) => (
            <div key={o.overlay.id} className="flex items-baseline gap-2 sm:col-span-2">
              <dt className="w-[120px] shrink-0 text-muted-foreground">Overlay</dt>
              <dd>
                <span className="font-medium">{o.overlay.name}</span>{" "}
                {o.to ? "applied" : "no longer applied"}
                {o.rationale ? (
                  <span className="text-muted-foreground"> — {o.rationale}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {delta.controls.length ? (
        <Table>
          <colgroup>
            <col style={{ width: "96px" }} />
            <col />
            <col style={{ width: "96px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "320px" }} />
          </colgroup>
          <thead>
            <Table.Row>
              <Table.Header>Control</Table.Header>
              <Table.Header>Title</Table.Header>
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
                    <Id className="text-primary">{c.control.id}</Id>
                  </Link>
                </Table.Cell>
                <Table.Cell className="truncate">{c.control.title}</Table.Cell>
                <Table.Cell>
                  <Badge size="xs" tone={c.kind === "added" ? "info" : "danger"}>
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
                      <span className="text-muted-foreground">No work started</span>
                    )
                  ) : c.work ? (
                    <Indicator tone="neutral">Already worked · {positionOf(c.work)}</Indicator>
                  ) : (
                    <Indicator tone="info">New obligation · unassigned</Indicator>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">
          {delta.empty
            ? "Nothing differs from the revision in force. Change something before submitting."
            : "The selection is unchanged; only parameters or overlay decisions moved."}
        </p>
      )}
      {delta.controls.length > 40 ? (
        <p className="pt-2 text-[12px] text-muted-foreground">
          First 40 of {delta.controls.length} shown.
        </p>
      ) : null}
      {delta.retiring.length || delta.opening ? (
        <p className="pt-2 text-[12.5px]">
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
