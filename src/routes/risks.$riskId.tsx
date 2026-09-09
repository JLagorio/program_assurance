import { UnavailableAction } from "@/components/app/unavailable-action";
import { useRecordForm } from "@/lib/record-form";
import { addRiskTreatment, treatmentsForRisk, useRisksVersion } from "@/lib/risk-store";
import {
  Badge,
  Box,
  Button,
  buttonVariants,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  Field,
  Grid,
  IconButton,
  Id,
  Inline,
  Inspector,
  KeyValue,
  NativeSelect,
  Section,
  Stack,
  Table,
  Textarea,
  TextLink,
  Timeline,
  toast,
} from "@ledger/design-system";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, MoreHorizontal, Paperclip } from "lucide-react";
import { useCallback, useId, useState, type SetStateAction } from "react";

import { Shell } from "@/components/app/shell";
import { risks, riskStatusTone } from "@/lib/grc-data";

export const Route = createFileRoute("/risks/$riskId")({
  loader: ({ params }) => {
    const risk = risks.find((r) => r.id.toLowerCase() === params.riskId.toLowerCase());
    return risk;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.id ?? "Risk"} — Equinox GRC` },
      {
        name: "description",
        content:
          loaderData?.summary ??
          "Risk detail with scoring, treatment plan, linked controls, evidence, and full activity history.",
      },
      { property: "og:title", content: `${loaderData?.id ?? "Risk"} — Equinox GRC` },
      {
        property: "og:description",
        content:
          loaderData?.summary ?? "Risk detail, treatment plan, linked controls and evidence.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RiskDetail,
});

const timeline = [
  {
    tone: "danger" as const,
    title: "Escalated to critical",
    time: "Aug 27, 09:41",
    actor: "Linus Aarto",
  },
  {
    tone: "information" as const,
    title: "Evidence attached — scanner output",
    time: "Aug 26, 16:12",
    actor: "Continuous monitor",
  },
  {
    tone: "warning" as const,
    title: "Treatment plan revised",
    time: "Aug 20, 10:02",
    actor: "Sarah Chen",
  },
  {
    tone: "neutral" as const,
    title: "Risk opened from pentest finding",
    time: "Aug 12, 08:30",
    actor: "Whitcombe LLP",
  },
];

const linkedEvidence = [
  { name: "burp_export_idor_v1.json", size: "412 KB", added: "Aug 26" },
  { name: "exports_authz_patch.diff", size: "8 KB", added: "Aug 24" },
  { name: "tenant_scope_test_run.log", size: "1.2 MB", added: "Aug 24" },
];

function RiskDetail() {
  useRisksVersion();
  const treatmentFormId = useId();
  const { riskId } = Route.useParams();
  const risk = risks.find((item) => item.id.toLowerCase() === riskId.toLowerCase());
  const [treating, setTreating] = useState(false);
  const { form, values, setValue, formRef } = useRecordForm(
    {
      plan: "",
      due: "",
      action: "Mitigate",
      assignee: risk?.owner ?? "Sarah Chen",
    },
    (value) => ({ plan: value.plan, due: value.due }),
  );
  const { plan, due, action, assignee } = values;
  const setPlan = useCallback(
    (value: SetStateAction<typeof plan>) => setValue("plan", value),
    [setValue],
  );

  const setAssignee = useCallback(
    (value: SetStateAction<typeof assignee>) => setValue("assignee", value),
    [setValue],
  );

  const [saveError, setSaveError] = useState("");

  if (!risk)
    return (
      <Shell>
        <Empty
          title="Risk not found"
          description="The record may be stored in another browser."
          action={
            <Link to="/risks" className={buttonVariants({ variant: "secondary" })}>
              Back to risks
            </Link>
          }
        />
      </Shell>
    );
  const savedTreatments = treatmentsForRisk(risk.id);
  const saveTreatment = () => {
    return form.handleSubmit({
      save: () => {
        try {
          addRiskTreatment({ riskId: risk.id, action, plan, assignee, due });
          setTreating(false);
          setPlan("");
          setSaveError("");
          toast.success("Treatment recorded", { description: "Saved in this browser." });
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "Treatment could not be saved.");
        }
      },
    });
  };

  return (
    <Shell>
      <Stack className="animate-rise" space="space.250">
        <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
          <Inline className="min-w-0" space="space.100" alignBlock="center" shouldWrap>
            <Link
              to="/risks"
              aria-label="Back to risks"
              className="text-subtle transition-colors hover:text-default"
            >
              <ChevronLeft className="size-icon-medium" />
            </Link>
            <h1 className="truncate font-heading-small font-semibold">{risk.title}</h1>
            <Badge variant="secondary" tone={riskStatusTone[risk.status]}>
              {risk.status}
            </Badge>
            <Inline
              className="min-w-0 font-body-small text-subtle"
              as="span"
              space="space.100"
              alignBlock="center"
            >
              <Id>{risk.id}</Id>
              <span className="text-subtlest">·</span>
              <span className="truncate">
                {risk.framework} {risk.control}
              </span>
              <span className="text-subtlest">·</span>
              <span className="truncate">Owned by {risk.owner}</span>
            </Inline>
          </Inline>
          <Inline space="space.100" alignBlock="center">
            <UnavailableAction
              reason="Reassignment is not available in this view."
              variant="secondary"
            >
              Reassign
            </UnavailableAction>
            <Button
              variant="primary"
              onClick={() => {
                setAssignee(risk.owner);
                setTreating(true);
              }}
            >
              Add treatment
            </Button>
            <IconButton
              label="More risk actions unavailable"
              variant="secondary"
              icon={<MoreHorizontal />}
              disabled
              title="No additional risk actions are available."
            />
          </Inline>
        </Inline>

        <Box className="border-t border-default" paddingBlockStart="space.250">
          <div className="grid gap-400 lg:grid-cols-main-rail lg:gap-0">
            <Stack space="space.300" className="lg:pe-300">
              {savedTreatments.length ? (
                <Section title="Treatment plans">
                  <Stack space="space.150">
                    {savedTreatments.map((item) => (
                      <div key={item.id}>
                        <p className="font-medium">
                          {item.action} · {item.assignee} · due {item.due}
                        </p>
                        <p>{item.plan}</p>
                      </div>
                    ))}
                  </Stack>
                </Section>
              ) : null}
              <Section title="Summary">
                <p className="pt-100 font-body">{risk.summary}</p>
              </Section>

              <Section
                title="Linked evidence"
                action={
                  <UnavailableAction
                    reason="Evidence storage is not connected. Attachments are unavailable."
                    variant="secondary"
                    size="small"
                    iconBefore={<Paperclip />}
                  >
                    Attach
                  </UnavailableAction>
                }
              >
                <Table>
                  <thead>
                    <tr>
                      <Table.Header>File</Table.Header>
                      <Table.Header className="w-1000">Size</Table.Header>
                      <Table.Header className="text-right w-1000">Added</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedEvidence.map((file) => (
                      <Table.Row key={file.name}>
                        <Table.Id id={file.name} />
                        <Table.Cell className="tabular-nums">{file.size}</Table.Cell>
                        <Table.Cell className="text-right">{file.added}</Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              </Section>

              <Section title="Activity">
                <Timeline className="pt-150">
                  {timeline.map((event) => (
                    <Timeline.Item
                      key={event.title}
                      tone={event.tone}
                      title={event.title}
                      meta={event.actor}
                      time={event.time}
                    />
                  ))}
                </Timeline>
              </Section>
            </Stack>
            <aside className="border-t border-default pt-300 lg:border-s lg:border-t-0 lg:ps-300 lg:pt-0">
              <Inspector.Group title="Properties">
                <KeyValue label="Risk ID">
                  <Id>{risk.id}</Id>
                </KeyValue>
                <KeyValue label="Owner">{risk.owner}</KeyValue>
                <KeyValue label="Team">{risk.team}</KeyValue>
                <KeyValue label="Treatment">{risk.treatment}</KeyValue>
                <KeyValue label="Framework">
                  {risk.framework} · {risk.control}
                </KeyValue>
              </Inspector.Group>

              <Inspector.Group title="Dates">
                <KeyValue label="Opened">{risk.opened}</KeyValue>
                <KeyValue label="Target date">{risk.due}</KeyValue>
                <KeyValue label="Last updated">{risk.updated}</KeyValue>
              </Inspector.Group>

              <Inspector.Group title="Control coverage">
                <p className="font-body-small text-subtle">
                  Maps to one failing control. Closing it requires two consecutive passing runs.
                </p>
                <TextLink size="small" className="pt-075 inline-block">
                  <Link to="/controls">View {risk.control}</Link>
                </TextLink>
              </Inspector.Group>
            </aside>
          </div>
        </Box>
      </Stack>

      <Dialog
        open={treating}
        onOpenChange={(next) => {
          if (!next) {
            setTreating(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Add treatment</DialogTitle>
            <DialogDescription>{`Recorded against ${risk.id} and saved in this browser.`}</DialogDescription>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <form
              id={treatmentFormId}
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                saveTreatment();
              }}
            >
              <Stack space="space.150">
                {saveError ? (
                  <p role="alert" className="text-danger">
                    {saveError}
                  </p>
                ) : null}
                <form.Field name="action">
                  {(field) => (
                    <Field
                      label="Action"
                      error={
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? field.state.meta.errors.join(" ")
                          : undefined
                      }
                    >
                      <NativeSelect
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        name={field.name}
                        onBlur={field.handleBlur}
                      >
                        {["Mitigate", "Accept", "Transfer", "Avoid"].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </NativeSelect>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="plan">
                  {(field) => (
                    <Field
                      label="Plan"
                      hint="Include the control change and how it will be verified."
                      isRequired
                      error={
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? field.state.meta.errors.join(" ")
                          : undefined
                      }
                    >
                      <Textarea
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enforce tenant scoping in the export resolver and add a regression test."
                        name={field.name}
                        onBlur={field.handleBlur}
                      />
                    </Field>
                  )}
                </form.Field>
                <Grid
                  gap="space.150"
                  templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                >
                  <form.Field name="assignee">
                    {(field) => (
                      <Field
                        label="Assignee"
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? field.state.meta.errors.join(" ")
                            : undefined
                        }
                      >
                        <NativeSelect
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          name={field.name}
                          onBlur={field.handleBlur}
                        >
                          {["Sarah Chen", "Linus Aarto", "Marcus Ryde", "Priya Raghavan"].map(
                            (o) => (
                              <option key={o}>{o}</option>
                            ),
                          )}
                        </NativeSelect>
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="due">
                    {(field) => (
                      <Field
                        label="Due date"
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? field.state.meta.errors.join(" ")
                            : undefined
                        }
                      >
                        <DatePicker
                          value={field.state.value}
                          onChange={field.handleChange}
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                </Grid>
              </Stack>
            </form>
          </Box>
          <DialogFooter>
            <>
              <Button variant="subtle" onClick={() => setTreating(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                form={treatmentFormId}
                disabled={form.state.isSubmitting}
              >
                Add treatment
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
