import { useMemo, useState } from "react";
import { Check, Pencil, Send, X } from "lucide-react";

import {
  Badge,
  Button,
  Dot,
  Field,
  Input,
  Mono,
  Modal,
  Section,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/components/app/ui";
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
  "Parameter set": "info",
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
  const [deciding, setDeciding] = useState<null | "approve" | "changes">(null);
  const [note, setNote] = useState("");

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
      "info",
    );
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
      <div className="space-y-7">
        {/* ------------------------------------------------ approval banner */}
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-subtle px-3.5 py-2.5">
          <Badge tone={approvalTone[state]}>{state}</Badge>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">
            {state === "Approved"
              ? `Approved by ${decision?.by ?? "—"} on ${decision?.at ?? "—"}${decision?.note ? ` · ${decision.note}` : ""}`
              : state === "Changes requested"
                ? `${decision?.by ?? "PM"} requested changes${decision?.note ? ` · ${decision.note}` : ""}`
                : state === "Pending PM approval"
                  ? `Awaiting ${programOwner} (PM) — engineering should not baseline until the scope is approved`
                  : "Draft scope — submit to the program manager before engineering begins"}
          </span>
          {state === "Pending PM approval" ? (
            <span className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setDeciding("changes")}>
                <X className="size-3.5" /> Request changes
              </Button>
              <Button variant="primary" onClick={() => setDeciding("approve")}>
                <Check className="size-3.5" /> Approve scope
              </Button>
            </span>
          ) : (
            <Button variant="primary" onClick={() => setSubmitting(true)}>
              <Send className="size-3.5" /> Submit for approval
            </Button>
          )}
        </div>

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
            >
              <Pencil className="size-3.5" /> Edit parameters
            </Button>
          }
        >
          <dl className="grid grid-cols-2 gap-x-8 pt-1 lg:grid-cols-4">
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
              <div
                key={k}
                className="flex items-baseline justify-between gap-3 border-b border-border/70 py-[7px]"
              >
                <dt className="truncate text-[12.5px] text-muted-foreground">{k}</dt>
                <dd className="truncate text-[12.5px] font-medium">{v}</dd>
              </div>
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
                <Th className="w-[164px]">Overlay ID</Th>
                <Th className="w-[232px]">Name</Th>
                <Th className="w-[212px]">Authority</Th>
                <Th>Trigger</Th>
                <Th className="w-[76px] text-right">Δ ctrl</Th>
              </tr>
            </thead>
            <tbody>
              {result.overlays.map((o) => {
                const delta =
                  o.controls.filter((c) => c.action === "Added").length -
                  o.controls.filter((c) => c.action === "Tailored out").length;
                return (
                  <Tr key={o.id}>
                    <Td className="w-[164px]">
                      <Mono>{o.id}</Mono>
                    </Td>
                    <Td className="w-[232px] truncate font-medium">{o.name}</Td>
                    <Td className="w-[212px] truncate text-muted-foreground">{o.authority}</Td>
                    <Td className="truncate text-muted-foreground">{o.trigger}</Td>
                    <Td className="tnum w-[76px] text-right">
                      {delta > 0 ? `+${delta}` : delta}
                    </Td>
                  </Tr>
                );
              })}
              {result.overlays.length === 0 ? (
                <Tr>
                  <Td className="text-muted-foreground" colSpan={5}>
                    No overlays apply — the stock baseline stands.
                  </Td>
                </Tr>
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
                <Th className="w-[96px]">Control</Th>
                <Th className="w-[292px]">Title</Th>
                <Th className="w-[132px]">Action</Th>
                <Th className="w-[188px]">Overlay</Th>
                <Th>Rationale</Th>
              </tr>
            </thead>
            <tbody>
              {result.overlays.flatMap((o) =>
                o.controls.map((c) => (
                  <Tr key={`${o.id}-${c.id}`}>
                    <Td className="w-[96px]">
                      <Mono>{c.id}</Mono>
                    </Td>
                    <Td className="w-[292px] truncate font-medium">{c.title}</Td>
                    <Td className="w-[132px]">
                      <Badge tone={actionTone[c.action]}>{c.action}</Badge>
                    </Td>
                    <Td className="w-[188px] truncate text-muted-foreground">{o.name}</Td>
                    <Td className="truncate text-muted-foreground">{c.rationale}</Td>
                  </Tr>
                )),
              )}
            </tbody>
          </Table>
        </Section>

        {/* -------------------------------------------------------- history */}
        <Section title="Scope history">
          <ol className="pt-1">
            {history.map((e, i) => (
              <li
                key={`${e.at}-${i}`}
                className="flex gap-3 border-b border-border/70 py-2.5 last:border-0"
              >
                <span className="mt-1.5">
                  <Dot tone={e.tone} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{e.text}</span>
                <span className="shrink-0 text-[12px] text-muted-foreground">{e.actor}</span>
                <span className="tnum w-[104px] shrink-0 text-right text-[12px] text-muted-foreground">
                  {e.at}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {/* ------------------------------------------------ parameters modal */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        width="lg"
        title="System parameters"
        description="The engine recomputes the baseline and overlays as you type."
        aside={<ScopePreview params={draft} />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveParams}>
              Save and recompute
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {(["confidentiality", "integrity", "availability"] as const).map((k) => (
              <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
                <Select
                  value={draft[k]}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value as ImpactLevel })}
                >
                  {impactLevels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="System class">
              <Select
                value={draft.systemClass}
                onChange={(e) =>
                  setDraft({ ...draft, systemClass: e.target.value as SystemClass })
                }
              >
                {systemClasses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Hosting">
              <Select
                value={draft.hosting}
                onChange={(e) => setDraft({ ...draft, hosting: e.target.value as Hosting })}
              >
                {hostingOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Classification">
              <Select
                value={draft.classification}
                onChange={(e) =>
                  setDraft({ ...draft, classification: e.target.value as Classification })
                }
              >
                {classifications.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Connectivity">
              <Select
                value={draft.connectivity}
                onChange={(e) =>
                  setDraft({ ...draft, connectivity: e.target.value as Connectivity })
                }
              >
                {connectivityOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-5 border-t border-border pt-3">
            {(
              [
                ["handlesPii", "Stores or processes PII"],
                ["crossDomain", "Crosses security domains"],
                ["safetyCritical", "Safety-critical function"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-[12.5px]">
                <input
                  type="checkbox"
                  className="size-3.5 accent-[oklch(0.55_0.19_255)]"
                  checked={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* --------------------------------------------------- submit modal */}
      <Modal
        open={submitting}
        onClose={() => setSubmitting(false)}
        title="Submit scope for PM approval"
        description={`${programId} · ${result.total} controls · ${result.overlays.length} overlays`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSubmitting(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit}>
              Send for approval
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Approver">
            <Input defaultValue={`${programOwner} (PM)`} readOnly />
          </Field>
          <Field
            label="Message"
            hint="Shown on the shared scope approvals dashboard."
          >
            <Textarea placeholder="Tailored scope reflects the DDIL tactical profile agreed at the SRR working group." />
          </Field>
        </div>
      </Modal>

      {/* -------------------------------------------------- decision modal */}
      <Modal
        open={deciding !== null}
        onClose={() => setDeciding(null)}
        title={deciding === "approve" ? "Approve compliance scope" : "Request changes"}
        description={`${programId} · ${result.total} controls · ${result.overlays.length} overlays`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              variant={deciding === "approve" ? "primary" : "danger"}
              onClick={() => decide(deciding ?? "approve")}
            >
              {deciding === "approve" ? "Approve scope" : "Request changes"}
            </Button>
          </>
        }
      >
        <Field
          label={deciding === "approve" ? "Approval note" : "What needs to change?"}
          hint={
            deciding === "approve"
              ? "Recorded against the authorization package."
              : "Returned to the systems security engineer."
          }
        >
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}

function ScopePreview({ params }: { params: SystemParameters }) {
  const r = computeTailoring(params);
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Derived scope
      </div>
      <dl className="mt-2">
        {[
          ["Baseline", r.baselineLabel.replace("NIST SP 800-53 Rev. 5 — ", "Rev. 5 ")],
          ["Baseline controls", String(r.baselineCount)],
          ["Overlay additions", `+${r.added.length}`],
          ["Tailored out", `−${r.removed.length}`],
          ["Parameters set", String(r.parameterized.length)],
          ["Controls in scope", String(r.total)],
        ].map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-3 border-b border-border/70 py-[5px] last:border-0"
          >
            <dt className="text-[12.5px] text-muted-foreground">{k}</dt>
            <dd className="tnum text-[12.5px] font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Overlays
      </div>
      <ul className="mt-1.5 space-y-1">
        {r.overlays.map((o) => (
          <li key={o.id} className="flex items-center gap-2 text-[12.5px]">
            <Dot tone="info" />
            <span className="truncate">{o.name}</span>
          </li>
        ))}
        {r.overlays.length === 0 ? (
          <li className="text-[12.5px] text-muted-foreground">None</li>
        ) : null}
      </ul>
    </div>
  );
}
