/**
 * One scope's categorization and tailoring, edited in place.
 *
 * The same pane serves the create flow (a draft scope that is not registered
 * yet) and the change flow (a draft revision on a scope that is). Everything
 * it edits is the `§5.3` decision record: the triad and environment, one
 * decision per overlay, and one decision per hand-tailored control — each
 * carrying its rationale where it disagrees with the engine.
 */

import { TailorControlsSheet } from "./tailor-picker";
import { useMemo, useState } from "react";

import {
  Badge,
  Block,
  Box,
  Button,
  Checkbox,
  Collapsible,
  Field,
  Grid,
  Id,
  Indicator,
  Inline,
  Select,
  Stack,
  Switch,
  Table,
  Textarea,
  ToggleGroup,
} from "@ledger/design-system";
import {
  contestedOverlays,
  decideOverlay,
  objectivesBelow,
  refreshOverlayDecisions,
  resolveDraft,
  tailoringSources,
  triadLabel,
  type RevisionDraft,
  type RevisionGate,
  type TailoringDecision,
  type TailoringSource,
} from "@/lib/control-set";
import type { ImpactLevel } from "@/lib/grc-data";
import { nistControls } from "@/lib/nist-catalog";
import { objectives, type Objective, type Triad } from "@/lib/scopes";
import {
  classifications,
  connectivityOptions,
  hostingOptions,
  impactLevels,
  overlayById,
  overlayOptions,
  systemClasses,
  type SystemParameters,
} from "@/lib/tailoring";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

const objectiveKey: Record<Objective, keyof SystemParameters> = {
  Confidentiality: "confidentiality",
  Integrity: "integrity",
  Availability: "availability",
};

export type TailoringSection = "categorization" | "environment" | "overlays" | "controls";

const allSections: TailoringSection[] = ["categorization", "environment", "overlays", "controls"];

export function ScopeTailoringPane({
  draft,
  ceiling,
  inherits,
  readOnly = false,
  sections = allSections,
  onChange,
}: {
  draft: RevisionDraft;
  /** Highest sibling categorization per objective; below it needs a separation basis. */
  ceiling: Triad | null;
  /** Create flow only: the scope follows the program default until switched off. */
  inherits?: { on: boolean; onToggle: (on: boolean) => void };
  readOnly?: boolean;
  /** Which blocks to render; the program default shows only the first two. */
  sections?: TailoringSection[];
  onChange: (patch: Partial<RevisionDraft>) => void;
}) {
  const show = (s: TailoringSection) => sections.includes(s);
  const [tailoring, setTailoring] = useState(false);
  const locked = readOnly || (inherits?.on ?? false);
  const p = draft.parameters;
  const below = objectivesBelow(p, ceiling);
  const options = useMemo(() => overlayOptions(p), [p]);
  const set = useMemo(() => resolveDraft(draft), [draft]);
  const applied = draft.overlays.filter((d) => d.applied).length;
  const contested = contestedOverlays(draft.overlays);

  const setParameters = (patch: Partial<SystemParameters>) => {
    const parameters = { ...p, ...patch };
    onChange({ parameters, overlays: refreshOverlayDecisions(parameters, draft.overlays) });
  };

  const inSet = useMemo(() => new Set(set.controls.map((c) => c.control.id)), [set]);
  const decided = useMemo(() => new Set(draft.tailoring.map((t) => t.control)), [draft.tailoring]);

  const patchDecision = (control: string, patch: Partial<TailoringDecision>) =>
    onChange({
      tailoring: draft.tailoring.map((t) => (t.control === control ? { ...t, ...patch } : t)),
    });
  const removeDecision = (control: string) =>
    onChange({ tailoring: draft.tailoring.filter((t) => t.control !== control) });

  return (
    <Stack space="space.050">
      {show("categorization") ? (
        <Block
          title="Categorization"
          count={`CNSSI 1253 · ${triadLabel(p)}`}
          action={
            inherits && !readOnly ? (
              <Switch checked={inherits.on} onCheckedChange={(v) => inherits.onToggle(v === true)}>
                Inherits program categorization
              </Switch>
            ) : null
          }
        >
          <div className="divide-y">
            {objectives.map((o) => {
              const key = objectiveKey[o];
              const value = p[key] as ImpactLevel;
              const isBelow = below.includes(o);
              return (
                <Inline
                  key={o}
                  className="py-100"
                  space="space.200"
                  alignBlock="center"
                  spread="space-between"
                >
                  <div className="min-w-0">
                    <div className="font-body">{o}</div>
                    <div className="font-body-small text-subtle">
                      {ceiling ? (
                        isBelow ? (
                          <Indicator tone="warning">
                            Below the program ceiling ({ceiling[o]})
                          </Indicator>
                        ) : (
                          `Program ceiling ${ceiling[o]}`
                        )
                      ) : (
                        "Selects at its own level; the set is the union"
                      )}
                    </div>
                  </div>
                  {locked ? (
                    <Badge size="xsmall" tone={impactTone[value]}>
                      {value}
                    </Badge>
                  ) : (
                    <ToggleGroup
                      aria-label={`${o} impact`}
                      value={value}
                      onChange={(v) => setParameters({ [key]: v } as Partial<SystemParameters>)}
                      items={impactLevels.map((l) => ({ value: l, label: l }))}
                    />
                  )}
                </Inline>
              );
            })}
          </div>
          {below.length > 0 ? (
            <Box paddingBlockStart="space.150">
              <Field
                label="Separation basis"
                hint="A lower categorization is earned with a demonstrated boundary, not asserted."
              >
                <Textarea
                  value={draft.separationBasis}
                  onChange={(e) => onChange({ separationBasis: e.target.value })}
                  disabled={readOnly}
                  placeholder="Loss of this element degrades but does not halt the mission because…"
                />
              </Field>
            </Box>
          ) : null}
        </Block>
      ) : null}

      {show("environment") ? (
        <Block title="Environment">
          {locked ? (
            <dl className="grid grid-cols-2 gap-x-300 gap-y-050 font-body-small sm:grid-cols-4">
              {(
                [
                  ["Class", p.systemClass],
                  ["Hosting", p.hosting],
                  ["Classification", p.classification],
                  ["Connectivity", p.connectivity],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-body-small text-subtle">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4">
                <dt className="font-body-small text-subtle">Flags</dt>
                <dd>
                  {[
                    p.handlesPii ? "Handles PII" : null,
                    p.crossDomain ? "Cross-domain" : null,
                    p.safetyCritical ? "Safety-critical" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <Stack space="space.150">
              <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
                <Field label="System class">
                  <Select
                    value={p.systemClass}
                    onValueChange={(v) =>
                      setParameters({ systemClass: v as SystemParameters["systemClass"] })
                    }
                    aria-label="System class"
                  >
                    {systemClasses.map((c) => (
                      <Select.Item key={c} value={c}>
                        {c}
                      </Select.Item>
                    ))}
                  </Select>
                </Field>
                <Field label="Hosting">
                  <Select
                    value={p.hosting}
                    onValueChange={(v) =>
                      setParameters({ hosting: v as SystemParameters["hosting"] })
                    }
                    aria-label="Hosting"
                  >
                    {hostingOptions.map((c) => (
                      <Select.Item key={c} value={c}>
                        {c}
                      </Select.Item>
                    ))}
                  </Select>
                </Field>
                <Field label="Classification">
                  <Select
                    value={p.classification}
                    onValueChange={(v) =>
                      setParameters({ classification: v as SystemParameters["classification"] })
                    }
                    aria-label="Classification"
                  >
                    {classifications.map((c) => (
                      <Select.Item key={c} value={c}>
                        {c}
                      </Select.Item>
                    ))}
                  </Select>
                </Field>
                <Field label="Connectivity">
                  <Select
                    value={p.connectivity}
                    onValueChange={(v) =>
                      setParameters({ connectivity: v as SystemParameters["connectivity"] })
                    }
                    aria-label="Connectivity"
                  >
                    {connectivityOptions.map((c) => (
                      <Select.Item key={c} value={c}>
                        {c}
                      </Select.Item>
                    ))}
                  </Select>
                </Field>
              </Grid>
              <Inline space="space.300" rowSpace="space.100" shouldWrap>
                <Checkbox
                  checked={p.handlesPii}
                  onCheckedChange={(v) => setParameters({ handlesPii: v === true })}
                >
                  Handles PII
                </Checkbox>
                <Checkbox
                  checked={p.crossDomain}
                  onCheckedChange={(v) => setParameters({ crossDomain: v === true })}
                >
                  Cross-domain
                </Checkbox>
                <Checkbox
                  checked={p.safetyCritical}
                  onCheckedChange={(v) => setParameters({ safetyCritical: v === true })}
                >
                  Safety-critical
                </Checkbox>
              </Inline>
            </Stack>
          )}
        </Block>
      ) : null}

      {show("overlays") ? (
        <Block title="Overlays" count={`${applied} of ${options.length} applied`}>
          <Table>
            <thead>
              <Table.Row>
                <Table.Header width={44} />
                <Table.Header>Overlay</Table.Header>
                <Table.Header width={150}>Authority</Table.Header>
                <Table.Header width={150}>Engine</Table.Header>
                <Table.Header width={96} className="text-right">
                  Delta
                </Table.Header>
              </Table.Row>
            </thead>
            <tbody>
              {draft.overlays.map((d) => {
                const overlay = overlayById(d.overlay);
                if (!overlay) return null;
                const adds = overlay.controls.filter((c) => c.action === "Added").length;
                const removes = overlay.controls.filter((c) => c.action === "Tailored out").length;
                const params = overlay.controls.filter((c) => c.action === "Parameter set").length;
                const disagrees = d.applied !== d.recommended;
                const option = options.find((o) => o.overlay.id === d.overlay);
                return [
                  <Table.Row key={d.overlay}>
                    <Table.Cell>
                      <Switch
                        aria-label={`Apply ${overlay.name}`}
                        checked={d.applied}
                        disabled={readOnly}
                        onCheckedChange={(v) =>
                          onChange({
                            overlays: decideOverlay(draft.overlays, d.overlay, {
                              applied: v === true,
                            }),
                          })
                        }
                      />
                    </Table.Cell>
                    <Table.Cell className="truncate" title={overlay.trigger}>
                      {overlay.name}
                    </Table.Cell>
                    <Table.Cell className="truncate">{overlay.authority}</Table.Cell>
                    <Table.Cell>
                      <Indicator tone={option?.recommended ? "information" : "neutral"}>
                        {option?.recommended ? "Recommended" : "Not recommended"}
                      </Indicator>
                    </Table.Cell>
                    <Table.Cell className="tabular-nums text-right">
                      {[
                        adds ? `+${adds}` : null,
                        removes ? `−${removes}` : null,
                        params ? `${params} param${params === 1 ? "" : "s"}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </Table.Cell>
                  </Table.Row>,
                  disagrees ? (
                    <Table.Row key={`${d.overlay}-why`}>
                      <Table.Cell />
                      <Table.Cell colSpan={4} className="whitespace-normal py-100 align-top">
                        <Field
                          label={
                            d.applied
                              ? "Why apply an overlay the parameters do not call for"
                              : "Why decline a recommended overlay"
                          }
                          hint={d.rationale.trim() ? undefined : "Needs a reason before submit"}
                        >
                          <Textarea
                            value={d.rationale}
                            disabled={readOnly}
                            onChange={(e) =>
                              onChange({
                                overlays: decideOverlay(draft.overlays, d.overlay, {
                                  rationale: e.target.value,
                                }),
                              })
                            }
                            placeholder={
                              d.applied
                                ? "The system carries the property the trigger describes even though the parameters do not say so…"
                                : "The obligation the overlay adds is met elsewhere in the boundary…"
                            }
                          />
                        </Field>
                      </Table.Cell>
                    </Table.Row>
                  ) : null,
                ];
              })}
            </tbody>
          </Table>
          {contested.length ? (
            <p className="pt-100 font-body-small text-subtle">
              {contested.length} decision{contested.length === 1 ? "" : "s"} disagree
              {contested.length === 1 ? "s" : ""} with the recommendation.
            </p>
          ) : null}
        </Block>
      ) : null}

      {show("controls") ? (
        <Collapsible
          title="Individual controls"
          count={draft.tailoring.length || null}
          defaultOpen={draft.tailoring.length > 0}
        >
          {readOnly ? null : (
            <Inline className="pb-150" space="space.150">
              <Button size="small" variant="secondary" onClick={() => setTailoring(true)}>
                Tailor controls…
              </Button>
              <TailorControlsSheet
                open={tailoring}
                onClose={() => setTailoring(false)}
                inSet={inSet}
                decided={decided}
                onAdd={(ds) => onChange({ tailoring: [...draft.tailoring, ...ds] })}
              />
            </Inline>
          )}
          {draft.tailoring.length ? (
            <Table>
              <thead>
                <Table.Row>
                  <Table.Header width={96}>Control</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header width={110}>Decision</Table.Header>
                  <Table.Header width={190}>Source</Table.Header>
                  <Table.Header width={84} />
                </Table.Row>
              </thead>
              <tbody>
                {draft.tailoring.map((t) => {
                  const control = nistControls.find((c) => c.id === t.control);
                  return [
                    <Table.Row key={t.control}>
                      <Table.Cell>
                        <Id>{t.control}</Id>
                      </Table.Cell>
                      <Table.Cell className="truncate">{control?.title ?? "—"}</Table.Cell>
                      <Table.Cell>
                        <Badge
                          size="xsmall"
                          tone={t.decision === "excluded" ? "danger" : "information"}
                        >
                          {t.decision === "excluded" ? "Tailored out" : "Tailored in"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {readOnly ? (
                          tailoringSources.find((s) => s.value === t.source)?.label
                        ) : (
                          <Select
                            value={t.source}
                            onValueChange={(v) =>
                              patchDecision(t.control, { source: v as TailoringSource })
                            }
                            aria-label="Decision source"
                          >
                            {tailoringSources.map((s) => (
                              <Select.Item key={s.value} value={s.value}>
                                {s.label}
                              </Select.Item>
                            ))}
                          </Select>
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        {readOnly ? null : (
                          <Button
                            variant="subtle"
                            size="xsmall"
                            onClick={() => removeDecision(t.control)}
                          >
                            Undo
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>,
                    <Table.Row key={`${t.control}-why`}>
                      <Table.Cell />
                      <Table.Cell colSpan={4} className="whitespace-normal py-100 align-top">
                        {readOnly ? (
                          <span className="">{t.rationale || "—"}</span>
                        ) : (
                          <Field
                            label={
                              t.decision === "excluded"
                                ? "Why this scope does not owe it"
                                : "Why this scope owes it after all"
                            }
                            hint={t.rationale.trim() ? undefined : "Needs a reason before submit"}
                          >
                            <Textarea
                              value={t.rationale}
                              onChange={(e) =>
                                patchDecision(t.control, { rationale: e.target.value })
                              }
                              placeholder="Why this scope does not owe it, or why it owes it after all…"
                              style={{ minHeight: 48 }}
                            />
                          </Field>
                        )}
                      </Table.Cell>
                    </Table.Row>,
                  ];
                })}
              </tbody>
            </Table>
          ) : (
            <p className="font-body-small text-subtle">
              No control tailored by hand. Overlays already added {set.added.length} and removed{" "}
              {set.removed.length}.
            </p>
          )}
        </Collapsible>
      ) : null}
    </Stack>
  );
}

/* --------------------------------------------------------------- Summary */

/** The numbers a draft resolves to, for an inspector or a review row. */
export function ControlSetSummary({ draft }: { draft: RevisionDraft }) {
  const set = useMemo(() => resolveDraft(draft), [draft]);
  const byHand = draft.tailoring.length;
  return (
    <dl className="space-y-050">
      <SummaryRow label="Controls">
        <span className="tabular-nums font-medium">{set.total}</span>
      </SummaryRow>
      {objectives.map((o) => (
        <SummaryRow key={o} label={o}>
          <Inline as="span" space="space.100" alignBlock="center">
            <Badge size="xsmall" tone={impactTone[set.triad[o]]}>
              {set.triad[o]}
            </Badge>
            <span className="tabular-nums text-subtle">{set.byObjective[o]}</span>
          </Inline>
        </SummaryRow>
      ))}
      <SummaryRow label="Overlays">
        {set.overlays.length ? set.overlays.map((o) => o.name).join(", ") : "None"}
      </SummaryRow>
      <SummaryRow label="Added by overlay">
        <span className="tabular-nums">{set.added.length}</span>
      </SummaryRow>
      <SummaryRow label="Removed">
        <span className="tabular-nums">{set.removed.length}</span>
      </SummaryRow>
      <SummaryRow label="By hand">
        <span className="tabular-nums">{byHand || "—"}</span>
      </SummaryRow>
    </dl>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Inline space="space.100" alignBlock="baseline">
      <dt className="shrink-0 font-body-small text-subtle" style={{ width: 104 }}>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 font-body-small">{children}</dd>
    </Inline>
  );
}

/** The submit gates, each with why it is or is not met. */
export function RevisionGates({ gates }: { gates: RevisionGate[] }) {
  return (
    <Stack as="ul" space="space.050">
      {gates.map((g) => (
        <Inline
          key={g.key}
          className="font-body-small"
          as="li"
          space="space.100"
          alignBlock="baseline"
        >
          <Indicator tone={g.met ? "success" : "warning"}>{g.label}</Indicator>
          <span className="min-w-0 font-body-small text-subtle">{g.detail}</span>
        </Inline>
      ))}
    </Stack>
  );
}

/** Hook-free helper for callers that want the "disagrees" count without the pane. */
export function useContestedCount(draft: RevisionDraft): number {
  const [n] = useState(() => contestedOverlays(draft.overlays).length);
  return n;
}
