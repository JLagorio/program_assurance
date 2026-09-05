import { useMemo, useState } from "react";
import { Check, Pencil, Send, X } from "lucide-react";

import {
  AlertDialog,
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  Dot,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  NativeSelect,
  Section,
  Stack,
  Table,
  Textarea,
  Timeline,
  toast,
  useRequired,
  Eyebrow,
} from "@ledger/design-system";
import {
  approvalTone,
  classifications,
  computeTailoring,
  connectivityOptions,
  defaultParameters,
  hostingOptions,
  impactLevels,
  scopeApprovals,
  scopeHistory,
  systemClasses,
  type ApprovalState,
  type Classification,
  type Connectivity,
  type Hosting,
  type ScopeEvent,
  type SystemClass,
  type SystemParameters,
} from "@/lib/tailoring";
import type { ImpactLevel } from "@/lib/grc-data";

const actionTone = {
  Added: "success",
  "Tailored out": "danger",
  "Parameter set": "information",
} as const;

function now() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function TailoringSection({
  programId,
  programOwner,
}: {
  programId: string;
  programOwner: string;
}) {
  const [params, setParams] = useState<SystemParameters>(defaultParameters);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SystemParameters>(defaultParameters);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [deciding, setDeciding] = useState<null | "approve" | "changes">(null);
  const [note, setNote] = useState("");
  const req = useRequired({ message: submitting && message, note: deciding === "changes" && note });

  const seed = scopeApprovals.find((a) => a.programId === programId);
  const [state, setState] = useState<ApprovalState>(seed?.state ?? "Draft");
  const [decision, setDecision] = useState<{ by: string; at: string; note: string | null } | null>(
    seed?.decidedBy ? { by: seed.decidedBy, at: seed.decided!, note: seed.note } : null,
  );
  const [history, setHistory] = useState<ScopeEvent[]>(scopeHistory[programId] ?? []);

  const result = useMemo(() => computeTailoring(params), [params]);

  function log(text: string, actor: string, tone: ScopeEvent["tone"]) {
    setHistory((h) => [{ at: now(), actor, text, tone }, ...h]);
  }

  function saveParams() {
    setParams(draft);
    setEditing(false);
    setState("Draft");
    setDecision(null);
    log("System parameters updated — scope recomputed", "Sarah Chen (SSE)", "neutral");
  }

  function submit() {
    setSubmitting(false);
    setState("Pending PM approval");
    log(
      `Submitted tailored scope for PM approval — ${result.total} controls, ${result.overlays.length} overlays`,
      "Sarah Chen (SSE)",
      "information",
    );
    toast.success("Scope sent for PM approval", {
      description: `${programId} · ${result.total} controls · ${result.overlays.length} overlays`,
    });
  }

  function decide(kind: "approve" | "changes") {
    const approved = kind === "approve";
    setState(approved ? "Approved" : "Changes requested");
    setDecision({ by: `${programOwner} (PM)`, at: now(), note: note || null });
    log(
      approved
        ? `Compliance scope approved — engineering may baseline ${result.total} controls`
        : `Changes requested on tailored scope${note ? ` — ${note}` : ""}`,
      `${programOwner} (PM)`,
      approved ? "success" : "danger",
    );
    setDeciding(null);
    setNote("");
  }

  return (
    <>
      <Stack space="space.300">
        {/* ------------------------------------------------ approval banner */}
        <Inline
          className="rounded-medium border border-default bg-surface-sunken px-150 py-100"
          space="space.150"
          alignBlock="center"
          shouldWrap
        >
          <Badge tone={approvalTone[state]}>{state}</Badge>
          <span className="min-w-0 flex-1 truncate font-body-small text-subtle">
            {state === "Approved"
              ? `Approved by ${decision?.by ?? "—"} on ${decision?.at ?? "—"}${decision?.note ? ` · ${decision.note}` : ""}`
              : state === "Changes requested"
                ? `${decision?.by ?? "PM"} requested changes${decision?.note ? ` · ${decision.note}` : ""}`
                : state === "Pending PM approval"
                  ? `Awaiting ${programOwner} (PM) — engineering should not baseline until the scope is approved`
                  : "Draft scope — submit to the program manager before engineering begins"}
          </span>
          {state === "Pending PM approval" ? (
            <Inline as="span" space="space.100" alignBlock="center">
              <Button variant="secondary" onClick={() => setDeciding("changes")} iconBefore={<X />}>
                Request changes
              </Button>
              <Button
                variant="primary"
                onClick={() => setDeciding("approve")}
                iconBefore={<Check />}
              >
                Approve scope
              </Button>
            </Inline>
          ) : (
            <Button variant="primary" onClick={() => setSubmitting(true)} iconBefore={<Send />}>
              Submit for approval
            </Button>
          )}
        </Inline>

        {/* --------------------------------------------- system parameters */}
        <Section
          title="System parameters"
          description="Inputs the engine uses to derive the baseline and DoD overlays."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(params);
                setEditing(true);
              }}
              iconBefore={<Pencil />}
            >
              Edit parameters
            </Button>
          }
        >
          <dl className="grid grid-cols-2 gap-x-400 pt-050 lg:grid-cols-4">
            {[
              ["Confidentiality", params.confidentiality],
              ["Integrity", params.integrity],
              ["Availability", params.availability],
              ["High-water mark", result.impact],
              ["System class", params.systemClass],
              ["Hosting", params.hosting],
              ["Classification", params.classification],
              ["Connectivity", params.connectivity],
              ["Handles PII", params.handlesPii ? "Yes" : "No"],
              ["Cross domain", params.crossDomain ? "Yes" : "No"],
              ["Safety critical", params.safetyCritical ? "Yes" : "No"],
              ["Baseline", result.baselineLabel.replace("NIST SP 800-53 Rev. 5 — ", "")],
            ].map(([k, v]) => (
              <Inline
                key={k}
                className="border-b border-default py-075"
                space="space.150"
                alignBlock="baseline"
                spread="space-between"
              >
                <dt className="truncate font-body-small text-subtle">{k}</dt>
                <dd className="truncate font-body-small font-medium">{v}</dd>
              </Inline>
            ))}
          </dl>
        </Section>

        {/* ------------------------------------------------------ overlays */}
        <Section
          title="Selected overlays"
          description={`${result.overlays.length} overlays triggered by the parameters above.`}
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={164}>Overlay ID</Table.Header>
                <Table.Header width={232}>Name</Table.Header>
                <Table.Header width={212}>Authority</Table.Header>
                <Table.Header>Trigger</Table.Header>
                <Table.Header className="text-right" width={76}>
                  Δ ctrl
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {result.overlays.map((o) => {
                const delta =
                  o.controls.filter((c) => c.action === "Added").length -
                  o.controls.filter((c) => c.action === "Tailored out").length;
                return (
                  <Table.Row key={o.id}>
                    <Table.Cell width={164}>
                      <Id>{o.id}</Id>
                    </Table.Cell>
                    <Table.Cell className="truncate" width={232}>
                      {o.name}
                    </Table.Cell>
                    <Table.Cell className="truncate" width={212}>
                      {o.authority}
                    </Table.Cell>
                    <Table.Cell className="truncate">{o.trigger}</Table.Cell>
                    <Table.Cell className="tabular-nums text-right" width={76}>
                      {delta > 0 ? `+${delta}` : delta}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
              {result.overlays.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    No overlays apply — the stock baseline stands.
                  </Table.Cell>
                </Table.Row>
              ) : null}
            </tbody>
          </Table>
        </Section>

        {/* --------------------------------------------------- control delta */}
        <Section
          title="Tailoring actions"
          description={`${result.baselineCount} baseline controls · +${result.added.length} added · −${result.removed.length} tailored out · ${result.total} in scope.`}
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={96}>Control</Table.Header>
                <Table.Header width={292}>Title</Table.Header>
                <Table.Header width={132}>Action</Table.Header>
                <Table.Header width={188}>Overlay</Table.Header>
                <Table.Header>Rationale</Table.Header>
              </tr>
            </thead>
            <tbody>
              {result.overlays.flatMap((o) =>
                o.controls.map((c) => (
                  <Table.Row key={`${o.id}-${c.id}`}>
                    <Table.Cell width={96}>
                      <Id>{c.id}</Id>
                    </Table.Cell>
                    <Table.Cell className="truncate" width={292}>
                      {c.title}
                    </Table.Cell>
                    <Table.Cell width={132}>
                      <Badge tone={actionTone[c.action]}>{c.action}</Badge>
                    </Table.Cell>
                    <Table.Cell className="truncate" width={188}>
                      {o.name}
                    </Table.Cell>
                    <Table.Cell className="truncate">{c.rationale}</Table.Cell>
                  </Table.Row>
                )),
              )}
            </tbody>
          </Table>
        </Section>

        {/* -------------------------------------------------------- history */}
        <Section title="Scope history">
          <Timeline className="pt-100">
            {history.map((e, i) => (
              <Timeline.Item
                key={`${e.at}-${i}`}
                tone={e.tone}
                title={e.text}
                meta={e.actor}
                time={e.at}
              />
            ))}
          </Timeline>
        </Section>
      </Stack>

      {/* ------------------------------------------------ parameters modal */}
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        width="large"
        title="System parameters"
        description="The engine recomputes the baseline and overlays as you type."
        aside={<ScopePreview params={draft} />}
        footer={
          <>
            <Button variant="subtle" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveParams}>
              Save and recompute
            </Button>
          </>
        }
      >
        <Stack space="space.150">
          <Grid gap="space.150" templateColumns="repeat(3, minmax(0, 1fr))">
            {(["confidentiality", "integrity", "availability"] as const).map((k) => (
              <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
                <NativeSelect
                  value={draft[k]}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value as ImpactLevel })}
                >
                  {impactLevels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </NativeSelect>
              </Field>
            ))}
          </Grid>
          <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
            <Field label="System class">
              <NativeSelect
                value={draft.systemClass}
                onChange={(e) => setDraft({ ...draft, systemClass: e.target.value as SystemClass })}
              >
                {systemClasses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Hosting">
              <NativeSelect
                value={draft.hosting}
                onChange={(e) => setDraft({ ...draft, hosting: e.target.value as Hosting })}
              >
                {hostingOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
          </Grid>
          <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
            <Field label="Classification">
              <NativeSelect
                value={draft.classification}
                onChange={(e) =>
                  setDraft({ ...draft, classification: e.target.value as Classification })
                }
              >
                {classifications.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Connectivity">
              <NativeSelect
                value={draft.connectivity}
                onChange={(e) =>
                  setDraft({ ...draft, connectivity: e.target.value as Connectivity })
                }
              >
                {connectivityOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
          </Grid>
          <Inline
            className="border-t border-default pt-150"
            space="space.250"
            alignBlock="center"
            shouldWrap
          >
            {(
              [
                ["handlesPii", "Stores or processes PII"],
                ["crossDomain", "Crosses security domains"],
                ["safetyCritical", "Safety-critical function"],
              ] as const
            ).map(([key, label]) => (
              <Checkbox
                key={key}
                checked={draft[key]}
                onCheckedChange={(v) => setDraft({ ...draft, [key]: v === true })}
              >
                {label}
              </Checkbox>
            ))}
          </Inline>
        </Stack>
      </Dialog>

      {/* --------------------------------------------------- submit modal */}
      <AlertDialog
        open={submitting}
        onClose={() => setSubmitting(false)}
        onConfirm={() => {
          if (!req.check()) return;
          submit();
        }}
        title="Submit scope for PM approval"
        description={`${programId} · ${result.total} controls · ${result.overlays.length} overlays. The PM sees the tailored scope on the approvals dashboard and every stage below Categorize locks until they decide.`}
        confirmLabel="Send for approval"
      >
        <Stack space="space.150">
          <Field label="Approver">
            <Input defaultValue={`${programOwner} (PM)`} readOnly />
          </Field>
          <Field
            label="Message"
            hint="Shown on the shared scope approvals dashboard."
            isRequired
            error={req.errorFor("message")}
          >
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tailored scope reflects the DDIL tactical profile agreed at the SRR working group."
            />
          </Field>
        </Stack>
      </AlertDialog>

      {/* -------------------------------------------------- decision modal */}
      <Dialog
        open={deciding !== null}
        onClose={() => setDeciding(null)}
        title={deciding === "approve" ? "Approve compliance scope" : "Request changes"}
        description={`${programId} · ${result.total} controls · ${result.overlays.length} overlays`}
        footer={
          <>
            <Button variant="subtle" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              variant={deciding === "approve" ? "primary" : "danger"}
              onClick={() => {
                if (!req.check()) return;
                decide(deciding ?? "approve");
              }}
            >
              {deciding === "approve" ? "Approve scope" : "Request changes"}
            </Button>
          </>
        }
      >
        <Field
          isRequired={deciding === "changes"}
          error={req.errorFor("note")}
          label={deciding === "approve" ? "Approval note" : "What needs to change?"}
          hint={
            deciding === "approve"
              ? "Recorded against the authorization package."
              : "Returned to the systems security engineer."
          }
        >
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Dialog>
    </>
  );
}

function ScopePreview({ params }: { params: SystemParameters }) {
  const r = computeTailoring(params);
  return (
    <div>
      <Eyebrow>Derived scope</Eyebrow>
      <dl className="pt-100">
        {[
          ["Baseline", r.baselineLabel.replace("NIST SP 800-53 Rev. 5 — ", "Rev. 5 ")],
          ["Baseline controls", String(r.baselineCount)],
          ["Overlay additions", `+${r.added.length}`],
          ["Tailored out", `−${r.removed.length}`],
          ["Parameters set", String(r.parameterized.length)],
          ["Controls in scope", String(r.total)],
        ].map(([k, v]) => (
          <Inline
            key={k}
            className="border-b border-default py-050 last:border-0"
            space="space.150"
            alignBlock="baseline"
            spread="space-between"
          >
            <dt className="font-body-small text-subtle">{k}</dt>
            <dd className="tabular-nums font-body-small font-medium">{v}</dd>
          </Inline>
        ))}
      </dl>
      <Box className="font-heading-xxsmall uppercase text-subtle" paddingBlockStart="space.150">
        Overlays
      </Box>
      <Stack className="pt-075" as="ul" space="space.050">
        {r.overlays.map((o) => (
          <Inline
            key={o.id}
            className="font-body-small"
            as="li"
            space="space.100"
            alignBlock="center"
          >
            <Dot tone="information" />
            <span className="truncate">{o.name}</span>
          </Inline>
        ))}
        {r.overlays.length === 0 ? <li className="font-body-small text-subtle">None</li> : null}
      </Stack>
    </div>
  );
}
