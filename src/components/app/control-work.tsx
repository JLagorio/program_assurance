import { AddEvidenceDialog, EvidencePreview } from "@/components/app/program-evidence";
import { descendantsOf, nodeById } from "@/lib/composition";
import { availableControlEvidence, controlEvidence } from "@/lib/control-evidence";
import {
  activityFor,
  addComment,
  assessmentStates,
  assessmentTone,
  assignOwner,
  commentsFor,
  currentSession,
  gatesFor,
  implementationStates,
  implementationTone,
  linkEvidence,
  offersFor,
  perform,
  setDeterminationNote,
  setNarrative,
  workForProgram,
  type ControlWork,
  type WorkContext,
} from "@/lib/control-work";
import { linkArtifact, useEvidenceVersion, type EvidenceLink } from "@/lib/evidence-catalog";
import { controlRequirementsInElement } from "@/lib/program-controls";
import { useRecordForm } from "@/lib/record-form";
import { scopeById } from "@/lib/scopes";
import {
  ActionBar,
  ActionBarAction,
  Badge,
  Box,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldLabel,
  Grid,
  IconButton,
  Inline,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  Textarea,
  TextLink,
} from "@ledger/design-system";
import { cn } from "@ledger/design-system/cn";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useCallback, useId, useState, type SetStateAction } from "react";

/**
 * The control work surface.
 *
 * Rebuilt on the shapes in `shapes.tsx` after an audit found this screen was
 * nineteen stacked Sections carrying 194 words of explanatory prose. The rule
 * here: the work is expanded, the reference is collapsed, the facts are in the
 * Inspector, and nothing carries a description.
 */

/* ------------------------------------------------------------- Action bar */

export function ControlActionBar({
  work,
  context,
  title,
  scopeName,
  crumbs,
  tabs,
  onChange,
}: {
  work: ControlWork;
  context: WorkContext;
  title: string;
  scopeName: string;
  crumbs?: React.ReactNode;
  tabs?: React.ReactNode;
  onChange: () => void;
}) {
  const fieldId = useId();

  const session = currentSession();
  const offers = offersFor(work, context, session.role);
  const [pending, setPending] = useState<string | null>(null);
  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      note: "",
    },
    (value) => ({ note: chosen?.def.note === "required" && value.note }),
  );
  const { note } = values;
  const setNote = useCallback(
    (value: SetStateAction<typeof note>) => setValue("note", value),
    [setValue],
  );
  const [error, setError] = useState<string | null>(null);

  const chosen = offers.find((o) => o.def.key === pending);

  const actions: ActionBarAction[] = offers.map((o) => ({
    label: o.def.label,
    primary:
      o.allowed && (o.def.key === "implement" || o.def.key === "submit" || o.def.key === "satisfy"),
    blocked: o.blocked,
    onSelect: () => {
      setPending(o.def.key);
      setNote("");
      setError(null);
    },
  }));

  const fire = () => {
    return form.handleSubmit({
      save: () => {
        if (!pending) return;
        const result = perform(work.id, pending, context, note);
        if (!result.ok) return setError(result.reason);
        setPending(null);
        setNote("");
        onChange();
      },
    });
  };

  return (
    <>
      <ActionBar
        crumbs={crumbs}
        tabs={tabs}
        id={work.control}
        title={title}
        context={`${scopeName} · ${work.owner ?? "unassigned"}`}
        states={[
          {
            label: "Implementation",
            value: work.implementationRecorded === false ? "Unrecorded" : work.implementation,
            tone:
              work.implementationRecorded === false
                ? "neutral"
                : implementationTone[work.implementation],
          },
          {
            label: "Assessment",
            value: work.assessment,
            tone: assessmentTone[work.assessment],
          },
          ...(work.submitted
            ? [{ label: "Status", value: "With the assessor", tone: "information" as const }]
            : []),
        ]}
        actions={actions}
      />

      <Dialog
        open={pending !== null}
        onOpenChange={(next) => {
          if (!next) {
            setPending(null);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>{chosen?.def.label ?? "Confirm"}</DialogTitle>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <form
              id={formId + "-1"}
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void fire();
              }}
            >
              <Grid gap="space.150">
                <Box
                  className="rounded-large border border-default bg-surface-sunken font-body-small"
                  paddingInline="space.150"
                  paddingBlock="space.100"
                >
                  {session.name} · {session.role}
                </Box>
                <form.Field name="note">
                  {(field) => {
                    const fieldError1 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError1)}>
                        <FieldLabel id={`${fieldId}-field-1-label`} htmlFor={`${fieldId}-field-1`}>
                          {chosen?.def.note === "required" ? "Reason (required)" : "Note"}
                          {chosen?.def.note === "required" ? (
                            <span aria-hidden="true" className="text-danger">
                              {" "}
                              *
                            </span>
                          ) : null}
                        </FieldLabel>
                        <Textarea
                          id={`${fieldId}-field-1`}
                          aria-labelledby={`${fieldId}-field-1-label`}
                          aria-required={chosen?.def.note === "required"}
                          aria-invalid={Boolean(fieldError1)}
                          aria-describedby={fieldError1 ? `${fieldId}-field-1-message` : undefined}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                        {fieldError1 ? (
                          <FieldError id={`${fieldId}-field-1-message`}>{fieldError1}</FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
              </Grid>
            </form>
          </Box>
          <DialogFooter>
            <>
              {error ? <span className="mr-auto font-body-small text-danger">{error}</span> : null}
              <Button onClick={() => setPending(null)}>Cancel</Button>
              <Button
                variant="primary"
                type="submit"
                form={formId + "-1"}
                disabled={form.state.isSubmitting}
              >
                {chosen?.def.label ?? "Confirm"}
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* --------------------------------------------------------------- Gate list */

/** Compact enough for the Inspector: a dot, a label, and what is missing. */
export function GateList({ work, context }: { work: ControlWork; context: WorkContext }) {
  return (
    <Stack as="ul" space="space.050">
      {gatesFor(work, context).map((g) => (
        <Inline key={g.key} title={g.detail} as="li" space="space.100" alignBlock="baseline">
          <Box paddingBlockStart="space.050">
            <span
              className={cn(
                "shrink-0 rounded-full",
                g.met ? "bg-success-bold" : "bg-warning-bold",
                "size-075",
              )}
            />
          </Box>
          <span className="min-w-0 flex-1">
            <span className="block font-body-small">{g.label}</span>
            {!g.met ? (
              <span className="block truncate font-body-xsmall text-subtle">{g.detail}</span>
            ) : null}
          </span>
        </Inline>
      ))}
    </Stack>
  );
}

/* --------------------------------------------------------------- Narrative */

export function Narrative({
  work,
  onChange,
  elementId,
}: {
  work: ControlWork;
  onChange: () => void;
  elementId?: string | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(work.narrative);
  const [error, setError] = useState("");
  const element = scopeById.get(work.scope)?.element;
  const componentIds = new Set(
    element ? [element, ...descendantsOf(element).map((node) => node.id)] : [],
  );
  const contributions = work.componentId
    ? []
    : workForProgram(work.program).filter(
        (item) =>
          item.control === work.control && item.componentId && componentIds.has(item.componentId),
      );

  if (editing) {
    return (
      <div>
        <Textarea
          aria-label="Implementation statement"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="How this system satisfies the control, in terms an assessor can verify."
          style={{ minHeight: 132 }}
        />
        <Inline className="pt-100" space="space.100">
          <Button
            variant="primary"
            size="small"
            onClick={() => {
              try {
                setNarrative(work.id, draft);
                setEditing(false);
                setError("");
                onChange();
              } catch (error) {
                setError(
                  error instanceof Error ? error.message : "The statement could not be saved.",
                );
              }
            }}
          >
            Save revision
          </Button>
          <Button size="small" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </Inline>
        {error ? (
          <p role="alert" className="pt-100 font-body-small text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {work.narrative ? (
        <p className="max-w-layout-measure font-body">{work.narrative}</p>
      ) : (
        <p className="font-body text-subtle">Not written.</p>
      )}
      <Button
        className="pt-100"
        size="small"
        onClick={() => {
          setDraft(work.narrative);
          setError("");
          setEditing(true);
        }}
      >
        {work.narrative ? "Revise" : "Write"}
      </Button>
      {contributions.length > 0 && (
        <Box paddingBlockStart="space.200">
          <Table>
            <thead>
              <Table.Row>
                <Table.Header>Component implementation</Table.Header>
                <Table.Header>Requirements</Table.Header>
                <Table.Header>Evidence</Table.Header>
              </Table.Row>
            </thead>
            <tbody>
              {contributions.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <TextLink
                      render={
                        <Link
                          to="/programs/$programId/controls/$controlId"
                          params={{ programId: work.program, controlId: work.control }}
                          search={{ scope: item.scope, element: elementId }}
                        />
                      }
                    >
                      {nodeById.get(item.componentId!)?.name ?? item.componentId}
                    </TextLink>
                  </Table.Cell>
                  <Table.Cell>{item.requirementIds?.length ?? 0}</Table.Cell>
                  <Table.Cell>{item.evidence.length}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Box>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Evidence */

export function EvidenceBlock({
  work,
  onChange,
  elementId,
}: {
  work: ControlWork;
  available?: { id: string; label: string; collected: string }[];
  onChange: () => void;
  elementId?: string | undefined;
}) {
  const fieldId = useId();

  useEvidenceVersion();
  const available = availableControlEvidence(work);
  const rows = controlEvidence(work);
  const requirements = controlRequirementsInElement(
    work.program,
    work.control,
    scopeById.get(work.scope)?.element,
  );
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState("implementation");
  const [artifactId, setArtifactId] = useState("");
  const [error, setError] = useState("");
  const target: EvidenceLink =
    targetId === "implementation"
      ? { kind: "control", id: work.control, scopeId: work.scope }
      : { kind: "requirement", id: targetId, scopeId: work.scope };
  const unlinked = available.filter(
    (artifact) =>
      !artifact.links.some(
        (link) =>
          link.kind === target.kind && link.id === target.id && link.scopeId === target.scopeId,
      ),
  );
  const chooseTarget = (id: string) => {
    setTargetId(id);
    setArtifactId("");
    setError("");
  };
  const link = () => {
    try {
      if (target.kind === "control") linkEvidence(work.id, artifactId);
      else linkArtifact(artifactId, target);
      setPicking(false);
      setArtifactId("");
      onChange();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Evidence could not be linked.");
    }
  };

  const targetIdItems = [
    {
      value: "implementation",
      label: (
        <>
          {work.control}implementation · {scopeById.get(work.scope)?.name}
        </>
      ),
    },
    ...requirements.map((requirement) => ({
      value: requirement.id,
      label: (
        <>
          {requirement.id} · {requirement.text}
        </>
      ),
    })),
  ];
  const artifactIdItems = unlinked.map((artifact) => ({
    value: artifact.id,
    label: `${artifact.id} · ${artifact.label}`,
    keywords: `${artifact.kind} ${artifact.provenance} ${artifact.owner}`,
    meta: artifact.review,
  }));
  return (
    <div>
      {rows.length ? (
        <Table label={`Supporting evidence for ${work.control}`} style={{ minWidth: 640 }}>
          <thead>
            <Table.Row>
              <Table.Header>Artifact</Table.Header>
              <Table.Header width={164}>Supports</Table.Header>
              <Table.Header width={124}>Collected</Table.Header>
              <Table.Header width={132}>Review</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {rows.map(({ artifact, supports }) => {
              return (
                <Table.Row key={artifact.id}>
                  <Table.Cell className="max-w-none whitespace-normal">
                    <TextLink
                      render={<button type="button" onClick={() => setSelectedId(artifact.id)} />}
                    >
                      {artifact.id} · {artifact.label}
                    </TextLink>
                    <span className="block font-body-xsmall text-subtle">
                      {artifact.kind} ·{" "}
                      {artifact.version === "Unrecorded"
                        ? "Version unrecorded"
                        : `v${artifact.version}`}
                      {artifact.url ? "" : " · Reference only"}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="max-w-none whitespace-normal">
                    <Stack space="space.050">
                      {[
                        ...new Map(
                          supports.map((support) => [`${support.kind}:${support.id}`, support]),
                        ).values(),
                      ].map((support) =>
                        support.kind === "control" ? (
                          <span key={`control:${support.id}`}>Implementation</span>
                        ) : (
                          <TextLink
                            key={`requirement:${support.id}:${support.scopeId ?? ""}`}
                            render={
                              <Link
                                to="/programs/$programId/requirements/$requirementId"
                                params={{ programId: work.program, requirementId: support.id }}
                                search={{ element: elementId }}
                              />
                            }
                          >
                            {support.id}
                          </TextLink>
                        ),
                      )}
                    </Stack>
                  </Table.Cell>
                  <Table.Cell>{artifact.collected || "Undated"}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="xsmall"
                      tone={
                        artifact.review === "Accepted"
                          ? "success"
                          : artifact.review === "Needs revision"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {artifact.review}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <p className="font-body text-subtle">No supporting evidence linked.</p>
      )}

      <Inline space="space.100" className="pt-100">
        <Button
          size="small"
          onClick={() => {
            chooseTarget("implementation");
            setPicking(true);
          }}
        >
          Link evidence…
        </Button>
        <Button
          size="small"
          onClick={() => {
            chooseTarget("implementation");
            setAdding(true);
          }}
        >
          Add evidence
        </Button>
      </Inline>
      {adding ? (
        <AddEvidenceDialog
          programId={work.program}
          open
          onClose={() => setAdding(false)}
          initialLink={target}
          onCreated={(artifact) => {
            setSelectedId(artifact.id);
            onChange();
          }}
        />
      ) : null}

      <Dialog
        open={picking}
        onOpenChange={(next) => {
          if (!next) {
            setPicking(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Link evidence</DialogTitle>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Stack space="space.150">
              <Field>
                <FieldLabel id={`${fieldId}-supports-2-label`} htmlFor={`${fieldId}-supports-2`}>
                  {"Supports"}
                </FieldLabel>
                <Select<string>
                  items={targetIdItems}
                  value={targetId}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return chooseTarget(value);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-supports-2`}
                    aria-labelledby={`${fieldId}-supports-2-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-supports-2-label`}>
                    {targetIdItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel id={`${fieldId}-evidence-3-label`} htmlFor={`${fieldId}-evidence-3`}>
                  {"Evidence"}
                </FieldLabel>
                <Combobox<(typeof artifactIdItems)[number]>
                  items={artifactIdItems}

                  isItemEqualToValue={(item, selected) => item.value === selected.value}
                  filter={(item, query) =>
                    [item.label, item.value, "keywords" in item ? item.keywords : ""]
                      .join(" ")
                      .toLocaleLowerCase()
                      .includes(query.toLocaleLowerCase())
                  }
                  value={artifactIdItems.find((item) => item.value === artifactId) ?? null}
                  onValueChange={(item) => setArtifactId(item?.value ?? "")}
                >
                  <ComboboxInput
                    id={`${fieldId}-evidence-3`}
                    aria-labelledby={`${fieldId}-evidence-3-label`}
                    placeholder="Find an existing artifact"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{"No matching evidence in this system scope."}</ComboboxEmpty>
                    <ComboboxList aria-labelledby={`${fieldId}-evidence-3-label`}>
                      {(item) => (
                        <ComboboxItem
                          key={item.value}
                          value={item}
                          disabled={"disabled" in item && Boolean(item.disabled)}
                        >
                          <span className="min-w-0 flex-1">{item.label}</span>
                          {"meta" in item && item.meta ? (
                            <span className="text-subtle font-body-small">{String(item.meta)}</span>
                          ) : null}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
              <Button
                size="small"
                onClick={() => {
                  setPicking(false);
                  setAdding(true);
                }}
              >
                Add a new evidence reference
              </Button>
              {error ? (
                <p role="alert" className="font-body-small text-danger">
                  {error}
                </p>
              ) : null}
            </Stack>
          </Box>
          <DialogFooter>
            <>
              <Button onClick={() => setPicking(false)}>Cancel</Button>
              <Button variant="primary" disabled={!artifactId} onClick={link}>
                Link evidence
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedId ? (
        <EvidencePreview
          programId={work.program}
          evidenceId={selectedId}
          elementId={elementId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ Determination */

export function Determination({ work, onChange }: { work: ControlWork; onChange: () => void }) {
  const session = currentSession();
  const [draft, setDraft] = useState(work.determinationNote);

  if (session.role !== "Assessor") {
    return work.determinationNote ? (
      <p className="max-w-layout-measure font-body">{work.determinationNote}</p>
    ) : (
      <p className="font-body text-subtle">None recorded. Assessor only.</p>
    );
  }

  return (
    <div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="What was examined, what was found, what it supports."
        style={{ minHeight: 92 }}
      />
      <Button
        className="pt-100"
        size="small"
        onClick={() => {
          setDeterminationNote(work.id, draft);
          onChange();
        }}
      >
        Save
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- Comments */

export function Comments({ work, onChange }: { work: ControlWork; onChange: () => void }) {
  const [body, setBody] = useState("");
  const thread = commentsFor(work.id);
  const session = currentSession();

  return (
    <div>
      {thread.length ? (
        <ul className="divide-y">
          {thread.map((c) => (
            <Box key={c.id} as="li" paddingBlock="space.100">
              <Inline space="space.100" alignBlock="baseline" shouldWrap>
                <span className="font-body font-medium">{c.author}</span>
                <Badge variant="secondary" tone="neutral" size="xsmall">
                  {c.role}
                </Badge>
                <span className="font-body-xsmall text-subtle">{c.at}</span>
              </Inline>
              <p className="pt-050 max-w-layout-measure font-body">{c.body}</p>
            </Box>
          ))}
        </ul>
      ) : null}
      <Textarea
        aria-label={`Reply as ${session.name}`}
        className="pt-100"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={`Reply as ${session.name}`}
      />
      <Button
        className="pt-100"
        size="small"
        onClick={() => {
          addComment(work.id, body);
          setBody("");
          onChange();
        }}
      >
        Comment
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- History */

export function History({ work }: { work: ControlWork }) {
  const events = activityFor(work.id);
  if (!events.length) return <p className="font-body text-subtle">Nothing yet.</p>;
  return (
    <Table>
      <tbody>
        {events.map((e) => (
          <Table.Row key={e.id}>
            <Table.Cell width={108}>{e.at}</Table.Cell>
            <Table.Cell className="truncate" width={140}>
              {e.actor}
            </Table.Cell>
            <Table.Cell className="truncate" width={200}>
              {e.summary}
            </Table.Cell>
            <Table.Cell className="truncate" title={e.note}>
              {e.note ?? "—"}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/* ------------------------------------------------------- Axis edit controls */

/** The two axes as Inspector controls, each refusing what its gates forbid. */
export function AxisControls({ work, context }: { work: ControlWork; context: WorkContext }) {
  const fieldId = useId();

  const session = currentSession();
  const canAssess = session.role === "Assessor";
  const implementationItems = [
    ...(work.implementationRecorded === false
      ? [
          {
            value: "Unrecorded",
            label: "Unrecorded",
          },
        ]
      : []),
    ...implementationStates.map((s) => ({ value: s, label: s })),
  ];
  const assessmentItems = assessmentStates.map((s) => ({ value: s, label: s }));
  return (
    <Stack space="space.100">
      <Field>
        <FieldLabel
          id={`${fieldId}-implementation-4-label`}
          htmlFor={`${fieldId}-implementation-4`}
        >
          {"Implementation"}
        </FieldLabel>
        <Select<string>
          items={implementationItems}
          value={work.implementationRecorded === false ? "Unrecorded" : work.implementation}
          disabled
        >
          <SelectTrigger
            id={`${fieldId}-implementation-4`}
            className="w-full"
            aria-label="Implementation"
            title="Changed through the actions above, so the gates apply"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent aria-labelledby={`${fieldId}-implementation-4-label`}>
            {implementationItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel id={`${fieldId}-assessment-5-label`} htmlFor={`${fieldId}-assessment-5`}>
          {"Assessment"}
        </FieldLabel>
        <Select<string> items={assessmentItems} value={work.assessment} disabled>
          <SelectTrigger
            id={`${fieldId}-assessment-5`}
            className="w-full"
            aria-label="Assessment"
            title={canAssess ? "Changed through the actions above" : "Assessor only"}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent aria-labelledby={`${fieldId}-assessment-5-label`}>
            {assessmentItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Section title="Gates">
        <GateList work={work} context={context} />
      </Section>
    </Stack>
  );
}

/* --------------------------------------------------------- Header actions */

/**
 * The record header's actions: Assign to me while nobody has it, the state
 * machine's primary verb, the rest in a menu. Every verb is confirmed with the
 * reason it asks for, as the action bar did.
 */
export function ControlActions({
  work,
  context,
  onChange,
  extra,
}: {
  work: ControlWork;
  context: WorkContext;
  onChange: () => void;
  extra?: React.ReactNode;
}) {
  const fieldId = useId();

  const session = currentSession();
  const offers = offersFor(work, context, session.role);
  const [pending, setPending] = useState<string | null>(null);
  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      note: "",
    },
    (value) => ({ note: chosen?.def.note === "required" && value.note }),
  );
  const { note } = values;
  const setNote = useCallback(
    (value: SetStateAction<typeof note>) => setValue("note", value),
    [setValue],
  );
  const [error, setError] = useState<string | null>(null);
  const chosen = offers.find((o) => o.def.key === pending);

  const primary =
    offers.find((o) => o.allowed && ["implement", "submit", "satisfy"].includes(o.def.key)) ??
    offers.find((o) => o.allowed);
  const rest = offers.filter((o) => o !== primary);

  const start = (key: string) => {
    setPending(key);
    setNote("");
    setError(null);
  };

  const fire = () => {
    return form.handleSubmit({
      save: () => {
        if (!pending) return;
        const result = perform(work.id, pending, context, note);
        if (!result.ok) return setError(result.reason);
        setPending(null);
        setNote("");
        onChange();
      },
    });
  };

  return (
    <>
      {extra}
      {!work.owner ? (
        <Button
          size="small"
          onClick={() => {
            assignOwner(work.id, session.name);
            onChange();
          }}
        >
          Assign to me
        </Button>
      ) : null}
      {primary ? (
        <Button size="small" variant="primary" onClick={() => start(primary.def.key)}>
          {primary.def.label}
        </Button>
      ) : null}
      {rest.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton
                label="More actions"
                variant="secondary"
                size="small"
                icon={<MoreHorizontal />}
              />
            }
          />
          <DropdownMenuContent align="end" style={{ width: 260 }}>
            {rest.map((o) => (
              <DropdownMenuItem
                key={o.def.key}
                className="h-auto py-075"
                disabled={!o.allowed}
                onClick={() => {
                  start(o.def.key);
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block">{o.def.label}</span>
                  {o.blocked ? (
                    <span className="block font-body-xsmall text-subtle">{o.blocked}</span>
                  ) : null}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <Dialog
        open={pending !== null}
        onOpenChange={(next) => {
          if (!next) {
            setPending(null);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>{chosen?.def.label ?? "Confirm"}</DialogTitle>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <form
              id={formId + "-2"}
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void fire();
              }}
            >
              <Grid gap="space.150">
                <Box
                  className="rounded-large border border-default bg-surface-sunken font-body-small"
                  paddingInline="space.150"
                  paddingBlock="space.100"
                >
                  {session.name} · {session.role}
                </Box>
                <form.Field name="note">
                  {(field) => {
                    const fieldError6 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError6)}>
                        <FieldLabel id={`${fieldId}-field-6-label`} htmlFor={`${fieldId}-field-6`}>
                          {chosen?.def.note === "required" ? "Reason (required)" : "Note"}
                          {chosen?.def.note === "required" ? (
                            <span aria-hidden="true" className="text-danger">
                              {" "}
                              *
                            </span>
                          ) : null}
                        </FieldLabel>
                        <Textarea
                          id={`${fieldId}-field-6`}
                          aria-labelledby={`${fieldId}-field-6-label`}
                          aria-required={chosen?.def.note === "required"}
                          aria-invalid={Boolean(fieldError6)}
                          aria-describedby={fieldError6 ? `${fieldId}-field-6-message` : undefined}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                        {fieldError6 ? (
                          <FieldError id={`${fieldId}-field-6-message`}>{fieldError6}</FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
              </Grid>
            </form>
          </Box>
          <DialogFooter>
            <>
              {error ? <span className="mr-auto font-body-small text-danger">{error}</span> : null}
              <Button onClick={() => setPending(null)}>Cancel</Button>
              <Button
                variant="primary"
                type="submit"
                form={formId + "-2"}
                disabled={form.state.isSubmitting}
              >
                {chosen?.def.label ?? "Confirm"}
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
