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
import { type ImpactLevel } from "@/lib/grc-data";
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
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Count,
  Field,
  FieldDescription,
  FieldLabel,
  Gates,
  Grid,
  Id,
  Indicator,
  Inline,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Switch,
  Table,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@ledger/design-system";
import { ChevronDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { TailorControlsSheet } from "./tailor-picker";

/**
 * One scope's categorization and tailoring, edited in place.
 *
 * The same pane serves the create flow (a draft scope that is not registered
 * yet) and the change flow (a draft revision on a scope that is). Everything
 * it edits is the `§5.3` decision record: the triad and environment, one
 * decision per overlay, and one decision per hand-tailored control — each
 * carrying its rationale where it disagrees with the engine.
 */

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
  const fieldId = useId();

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

  const systemClassItems = systemClasses.map((c) => ({ value: c, label: c }));
  const hostingItems = hostingOptions.map((c) => ({ value: c, label: c }));
  return (
    <Stack space="space.050">
      {show("categorization") ? (
        <Section
          title="Categorization"
          count={`CNSSI 1253 · ${triadLabel(p)}`}
          action={
            inherits && !readOnly ? (
              <label className="inline-flex items-center gap-100 font-body text-default">
                <Switch checked={inherits.on} onCheckedChange={inherits.onToggle} />
                <span className="select-none">Inherits program categorization</span>
              </label>
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
                    <Badge variant="secondary" size="xsmall" tone={impactTone[value]}>
                      {value}
                    </Badge>
                  ) : (
                    <ToggleGroup
                      aria-label={`${o} impact`}
                      size="sm"
                      value={[value]}
                      onValueChange={([next]) => {
                        if (next !== undefined)
                          setParameters({ [key]: next } as Partial<SystemParameters>);
                      }}
                    >
                      {impactLevels.map((l) => (
                        <ToggleGroupItem key={l} value={l}>
                          {l}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                </Inline>
              );
            })}
          </div>
          {below.length > 0 ? (
            <Box paddingBlockStart="space.150">
              <Field>
                <FieldLabel
                  id={`${fieldId}-separation-basis-1-label`}
                  htmlFor={`${fieldId}-separation-basis-1`}
                >
                  {"Separation basis"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-separation-basis-1`}
                  aria-labelledby={`${fieldId}-separation-basis-1-label`}
                  aria-describedby={`${fieldId}-separation-basis-1-message`}
                  value={draft.separationBasis}
                  onChange={(e) => onChange({ separationBasis: e.target.value })}
                  disabled={readOnly}
                  placeholder="Loss of this element degrades but does not halt the mission because…"
                />
                <FieldDescription id={`${fieldId}-separation-basis-1-message`}>
                  {"A lower categorization is earned with a demonstrated boundary, not asserted."}
                </FieldDescription>
              </Field>
            </Box>
          ) : null}
        </Section>
      ) : null}

      {show("environment") ? (
        <Section title="Environment">
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
              <Grid
                gap="space.150"
                templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
              >
                <Field>
                  <FieldLabel
                    id={`${fieldId}-system-class-2-label`}
                    htmlFor={`${fieldId}-system-class-2`}
                  >
                    {"System class"}
                  </FieldLabel>
                  <Select<string>
                    items={systemClassItems}
                    value={p.systemClass}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return setParameters({
                        systemClass: value as SystemParameters["systemClass"],
                      });
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-system-class-2`}
                      className="w-full"
                      aria-label="System class"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-system-class-2-label`}>
                      {systemClassItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-hosting-3-label`} htmlFor={`${fieldId}-hosting-3`}>
                    {"Hosting"}
                  </FieldLabel>
                  <Select<string>
                    items={hostingItems}
                    value={p.hosting}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return setParameters({ hosting: value as SystemParameters["hosting"] });
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-hosting-3`}
                      className="w-full"
                      aria-label="Hosting"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-hosting-3-label`}>
                      {hostingItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-classification-4-label`}
                    htmlFor={`${fieldId}-classification-4`}
                  >
                    {"Classification"}
                  </FieldLabel>
                  <Select<SystemParameters["classification"]>
                    value={p.classification}
                    onValueChange={(value) => {
                      if (value !== null) setParameters({ classification: value });
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-classification-4`}
                      className="w-full"
                      aria-label="Classification"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      aria-labelledby={`${fieldId}-classification-4-label`}
                      align="start"
                      alignItemWithTrigger={false}
                    >
                      {classifications.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-connectivity-5-label`}
                    htmlFor={`${fieldId}-connectivity-5`}
                  >
                    {"Connectivity"}
                  </FieldLabel>
                  <Select<SystemParameters["connectivity"]>
                    value={p.connectivity}
                    onValueChange={(value) => {
                      if (value !== null) setParameters({ connectivity: value });
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-connectivity-5`}
                      className="w-full"
                      aria-label="Connectivity"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      aria-labelledby={`${fieldId}-connectivity-5-label`}
                      align="start"
                      alignItemWithTrigger={false}
                    >
                      {connectivityOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Grid>
              <Inline space="space.300" rowSpace="space.100" shouldWrap>
                <label className="inline-flex items-center gap-100 font-body text-default">
                  <Checkbox
                    checked={p.handlesPii}
                    onCheckedChange={(handlesPii) => setParameters({ handlesPii })}
                  />
                  <span className="select-none">Handles PII</span>
                </label>
                <label className="inline-flex items-center gap-100 font-body text-default">
                  <Checkbox
                    checked={p.crossDomain}
                    onCheckedChange={(crossDomain) => setParameters({ crossDomain })}
                  />
                  <span className="select-none">Cross-domain</span>
                </label>
                <label className="inline-flex items-center gap-100 font-body text-default">
                  <Checkbox
                    checked={p.safetyCritical}
                    onCheckedChange={(safetyCritical) => setParameters({ safetyCritical })}
                  />
                  <span className="select-none">Safety-critical</span>
                </label>
              </Inline>
            </Stack>
          )}
        </Section>
      ) : null}

      {show("overlays") ? (
        <Section title="Overlays" count={`${applied} of ${options.length} applied`}>
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
                const fieldHint6 = d.rationale.trim() ? undefined : "Needs a reason before submit";
                return [
                  <Table.Row key={d.overlay}>
                    <Table.Cell>
                      <Switch
                        aria-label={`Apply ${overlay.name}`}
                        checked={d.applied}
                        disabled={readOnly}
                        onCheckedChange={(checked) =>
                          onChange({
                            overlays: decideOverlay(draft.overlays, d.overlay, {
                              applied: checked,
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
                        <Field>
                          <FieldLabel
                            id={`${fieldId}-field-6-${`${d.overlay}-why`}-label`}
                            htmlFor={`${fieldId}-field-6-${`${d.overlay}-why`}`}
                          >
                            {d.applied
                              ? "Why apply an overlay the parameters do not call for"
                              : "Why decline a recommended overlay"}
                          </FieldLabel>
                          <Textarea
                            id={`${fieldId}-field-6-${`${d.overlay}-why`}`}
                            aria-labelledby={`${fieldId}-field-6-${`${d.overlay}-why`}-label`}
                            aria-describedby={
                              fieldHint6
                                ? `${fieldId}-field-6-${`${d.overlay}-why`}-message`
                                : undefined
                            }
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
                          {fieldHint6 ? (
                            <FieldDescription
                              id={`${fieldId}-field-6-${`${d.overlay}-why`}-message`}
                            >
                              {fieldHint6}
                            </FieldDescription>
                          ) : null}
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
        </Section>
      ) : null}

      {show("controls") ? (
        <Collapsible className="border-t border-default" defaultOpen={draft.tailoring.length > 0}>
          <h3>
            <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
              Individual controls{" "}
              {draft.tailoring.length > 0 ? <Count value={draft.tailoring.length} /> : null}
              <ChevronDown
                aria-hidden="true"
                className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
              />
            </CollapsibleTrigger>
          </h3>
          <CollapsibleContent>
            <Box paddingBlockEnd="space.200">
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
                      const fieldHint7 = t.rationale.trim()
                        ? undefined
                        : "Needs a reason before submit";
                      return [
                        <Table.Row key={t.control}>
                          <Table.Cell>
                            <Id>{t.control}</Id>
                          </Table.Cell>
                          <Table.Cell className="truncate">{control?.title ?? "—"}</Table.Cell>
                          <Table.Cell>
                            <Badge
                              variant="secondary"
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
                              <Select<TailoringSource>
                                items={tailoringSources}
                                value={t.source}
                                onValueChange={(value) => {
                                  if (value !== null) patchDecision(t.control, { source: value });
                                }}
                              >
                                <SelectTrigger className="w-full" aria-label="Decision source">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent
                                  aria-label="Decision source"
                                  align="start"
                                  alignItemWithTrigger={false}
                                >
                                  {tailoringSources.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                      {s.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
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
                              <Field>
                                <FieldLabel
                                  id={`${fieldId}-field-7-${`${t.control}-why`}-label`}
                                  htmlFor={`${fieldId}-field-7-${`${t.control}-why`}`}
                                >
                                  {t.decision === "excluded"
                                    ? "Why this scope does not owe it"
                                    : "Why this scope owes it after all"}
                                </FieldLabel>
                                <Textarea
                                  id={`${fieldId}-field-7-${`${t.control}-why`}`}
                                  aria-labelledby={`${fieldId}-field-7-${`${t.control}-why`}-label`}
                                  aria-describedby={
                                    fieldHint7
                                      ? `${fieldId}-field-7-${`${t.control}-why`}-message`
                                      : undefined
                                  }
                                  value={t.rationale}
                                  onChange={(e) =>
                                    patchDecision(t.control, { rationale: e.target.value })
                                  }
                                  placeholder="Why this scope does not owe it, or why it owes it after all…"
                                  style={{ minHeight: 48 }}
                                />
                                {fieldHint7 ? (
                                  <FieldDescription
                                    id={`${fieldId}-field-7-${`${t.control}-why`}-message`}
                                  >
                                    {fieldHint7}
                                  </FieldDescription>
                                ) : null}
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
            </Box>
          </CollapsibleContent>
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
            <Badge variant="secondary" size="xsmall" tone={impactTone[set.triad[o]]}>
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
    <Gates>
      {gates.map((g) => (
        <Gates.Item key={g.key} met={g.met} label={g.label} reason={g.detail} />
      ))}
    </Gates>
  );
}

/** Hook-free helper for callers that want the "disagrees" count without the pane. */
export function useContestedCount(draft: RevisionDraft): number {
  const [n] = useState(() => contestedOverlays(draft.overlays).length);
  return n;
}
