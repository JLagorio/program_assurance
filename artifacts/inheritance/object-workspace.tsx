import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, FileCheck2, Layers3, Plus } from "lucide-react";
import {
  Badge,
  Box,
  Button,
  Count,
  Grid,
  Indicator,
  Inline,
  PageHeader,
  ProgressStacked,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@ledger/design-system";
import type { AssuranceObject, ControlDefinition, ObjectControl, Program } from "./assurance-model";

export type ObjectWorkspaceProps = {
  object: AssuranceObject;
  objects: AssuranceObject[];
  controls: ControlDefinition[];
  programs: Program[];
  onOpenObject: (id: string) => void;
  onOpenProgram: (id: string) => void;
  onUseInProgram: (id: string) => void;
};

function Outcome({ status }: { status: ObjectControl["status"] }) {
  return (
    <Indicator
      tone={status === "Satisfied" ? "success" : status === "Partial" ? "warning" : "neutral"}
    >
      {status}
    </Indicator>
  );
}

export function ObjectWorkspace({
  object,
  objects,
  controls,
  programs,
  onOpenObject,
  onOpenProgram,
  onUseInProgram,
}: ObjectWorkspaceProps) {
  const [tab, setTab] = useState("controls");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    setTab("controls");
    setFilter("all");
    setSelectedId(null);
  }, [object.id]);
  const isProfile = object.kind === "Organizational profile" || object.kind === "Overlay";
  const applicable = object.controls.filter((control) => control.applicability === "Applicable");
  const satisfied = applicable.filter((control) => control.status === "Satisfied").length;
  const partial = applicable.filter((control) => control.status === "Partial").length;
  const notAssessed = applicable.filter((control) => control.status === "Not assessed").length;
  const excluded = object.controls.length - applicable.length;
  const selectedControl = object.controls.find((control) => control.id === selectedId);
  const definition = (id: string) => controls.find((control) => control.id === id);
  const base = objects.find((item) => item.id === object.baseProfileId);
  const scopedConsumers = programs.filter((program) => object.consumers.includes(program.id));
  const filteredControls = object.controls.filter(
    (control) =>
      filter === "all" ||
      (filter === "applicable" && control.applicability === "Applicable") ||
      (filter === "satisfied" && control.status === "Satisfied") ||
      (filter === "work" && ["Partial", "Not assessed"].includes(control.status)) ||
      (filter === "excluded" && control.applicability === "Not applicable"),
  );

  function evidenceTable(ids?: string[]) {
    const evidence = ids
      ? object.evidence.filter((item) => ids.includes(item.id))
      : object.evidence;
    return evidence.length ? (
      <Table label={`${object.name} evidence records`} style={{ minWidth: 580 }} density="compact">
        <thead>
          <tr>
            <Table.Header width={125}>Evidence</Table.Header>
            <Table.Header width={270}>Artifact / scope</Table.Header>
            <Table.Header width={100}>Type</Table.Header>
            <Table.Header width={105}>Recorded</Table.Header>
          </tr>
        </thead>
        <tbody>
          {evidence.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell>
                <Text size="small" weight="medium">
                  {item.id}
                </Text>
              </Table.Cell>
              <Table.Cell className="whitespace-normal py-150">
                <Stack space="space.050">
                  <Text weight="medium">{item.title}</Text>
                  <Text as="p" size="small" color="color.text.subtle">
                    {item.scope}
                  </Text>
                </Stack>
              </Table.Cell>
              <Table.Cell className="whitespace-normal">
                <Text size="small">{item.kind}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text size="small">{item.date}</Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    ) : (
      <Text as="p" size="small" color="color.text.subtle">
        No evidence linked
      </Text>
    );
  }

  function requirementTable(ids?: string[]) {
    const requirements = ids
      ? object.requirements.filter((item) => ids.includes(item.id))
      : object.requirements;
    return requirements.length ? (
      <Table
        label={`${object.name} requirement records`}
        style={{ minWidth: 590 }}
        density="compact"
      >
        <thead>
          <tr>
            <Table.Header width={135}>Requirement</Table.Header>
            <Table.Header width={270}>Statement / mappings</Table.Header>
            <Table.Header width={105}>Verification</Table.Header>
            <Table.Header width={90}>Evidence</Table.Header>
          </tr>
        </thead>
        <tbody>
          {requirements.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell>
                <Text size="small" weight="medium">
                  {item.id}
                </Text>
              </Table.Cell>
              <Table.Cell className="whitespace-normal py-150">
                <Stack space="space.075">
                  <Text as="p">{item.title}</Text>
                  <Inline space="space.050" shouldWrap>
                    {item.controlIds.length ? (
                      item.controlIds.map((id) => (
                        <Button
                          key={id}
                          variant="link"
                          size="xsmall"
                          onClick={() => {
                            setSelectedId(id);
                            setTab("controls");
                          }}
                        >
                          {id}
                        </Button>
                      ))
                    ) : (
                      <Text size="small" color="color.text.subtle">
                        Standalone
                      </Text>
                    )}
                  </Inline>
                </Stack>
              </Table.Cell>
              <Table.Cell>
                <Indicator tone={item.status === "Verified" ? "success" : "warning"}>
                  {item.status}
                </Indicator>
              </Table.Cell>
              <Table.Cell>
                <Button variant="link" size="small" onClick={() => setTab("evidence")}>
                  {item.evidenceIds.length} linked
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    ) : (
      <Text as="p" size="small" color="color.text.subtle">
        No requirements linked
      </Text>
    );
  }

  function controlDetail(control: ObjectControl) {
    const controlDefinition = definition(control.id);
    return (
      <Stack space="space.300" className="min-w-0">
        <Inline space="space.100" spread="space-between" alignBlock="center" shouldWrap>
          <Button variant="link" iconBefore={<ArrowLeft />} onClick={() => setSelectedId(null)}>
            All controls
          </Button>
          <Outcome status={control.status} />
        </Inline>
        <Section title={`${control.id} · ${controlDefinition?.title ?? "Control record"}`}>
          <Inline space="space.150" shouldWrap className="pt-150">
            <Badge variant="secondary">{control.applicability}</Badge>
            <Text size="small" color="color.text.subtle">
              Scope · {object.name} {object.version}
            </Text>
          </Inline>
          <Text as="p" className="pt-150">
            {controlDefinition?.objective}
          </Text>
        </Section>
        <Grid
          templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }}
          gap="space.300"
          alignItems="start"
        >
          <Section title="Implementation">
            <Stack space="space.150" className="pt-150">
              <Text as="p">{control.implementation}</Text>
              <Stack space="space.050">
                <Text size="small" weight="medium">
                  Remaining responsibility
                </Text>
                <Text as="p" size="small" color="color.text.subtle">
                  {control.responsibility}
                </Text>
              </Stack>
            </Stack>
          </Section>
          <Section title="Assessment">
            <Stack space="space.150" className="pt-150">
              <Text as="p" size="small" color="color.text.subtle">
                {object.assessments.filter((assessment) => assessment.result === "Complete").length
                  ? `${object.assessments
                      .filter((assessment) => assessment.result === "Complete")
                      .map((assessment) => assessment.id)
                      .join(", ")}`
                  : "No completed assessments"}
              </Text>
              <Button
                variant="link"
                iconAfter={<ArrowRight />}
                onClick={() => setTab("assessments")}
              >
                View assessments
              </Button>
            </Stack>
          </Section>
        </Grid>
        {control.contributions.length > 0 && (
          <Section
            title={isProfile ? "Profile references" : "Product references"}
            count={control.contributions.length}
          >
            <Stack space="space.150" className="pt-150">
              {control.contributions.map((contribution, index) => {
                const source = objects.find((item) => item.id === contribution.objectId);
                const sourceControl = source?.controls.find(
                  (item) => item.id === contribution.controlId,
                );
                return (
                  <Box
                    key={`${contribution.objectId}-${index}`}
                    padding="space.150"
                    className="bg-surface-sunken rounded-medium"
                  >
                    <Stack space="space.100">
                      <Inline space="space.100" alignBlock="center" shouldWrap>
                        <Layers3 aria-hidden className="size-icon-small icon-subtle" />
                        <Button variant="link" onClick={() => onOpenObject(contribution.objectId)}>
                          {source?.name ?? contribution.objectId}
                        </Button>
                        <Badge variant="secondary" size="small">
                          {source?.version}
                        </Badge>
                        <Text size="small">{contribution.controlId}</Text>
                        {sourceControl && <Outcome status={sourceControl.status} />}
                      </Inline>
                      <Text as="p" size="small">
                        {contribution.note}
                      </Text>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Section>
        )}
        <Section title="Linked requirements" count={control.requirementIds.length}>
          <Box paddingBlockStart="space.150" className="min-w-0">
            {requirementTable(control.requirementIds)}
          </Box>
        </Section>
        <Section title="Supporting evidence" count={control.evidenceIds.length}>
          <Box paddingBlockStart="space.150" className="min-w-0">
            {evidenceTable(control.evidenceIds)}
          </Box>
        </Section>
      </Stack>
    );
  }

  return (
    <Stack space="space.300" className="min-w-0" data-assurance-object={object.id}>
      <PageHeader
        eyebrow={`${isProfile ? "Organizational profiles" : "Product catalog"} / ${object.kind}`}
        title={object.name}
      />
      <Inline space="space.100" shouldWrap spread="space-between" alignBlock="center">
        <Inline space="space.100" shouldWrap alignBlock="center">
          <Badge variant="secondary">{object.version}</Badge>
          <Indicator tone="information">Published</Indicator>
          <Text size="small" color="color.text.subtle">
            Owner · {object.owner}
          </Text>
        </Inline>
        <Button variant="primary" iconBefore={<Plus />} onClick={() => onUseInProgram(object.id)}>
          Use in program
        </Button>
      </Inline>
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <Box className="overflow-x-auto">
          <TabsList
            variant="line"
            aria-label="Object assurance workspace"
            className="justify-start"
          >
            <TabsTrigger value="controls">
              Controls <Count value={object.controls.length} />
            </TabsTrigger>
            <TabsTrigger value="requirements">
              Requirements <Count value={object.requirements.length} />
            </TabsTrigger>
            <TabsTrigger value="evidence">
              Evidence <Count value={object.evidence.length} />
            </TabsTrigger>
            <TabsTrigger value="assessments">
              Assessments <Count value={object.assessments.length} />
            </TabsTrigger>
            <TabsTrigger value="consumers">
              Consumers <Count value={scopedConsumers.length} />
            </TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
        </Box>
        <TabsContent value="controls" className="pt-300">
          {selectedControl ? (
            controlDetail(selectedControl)
          ) : (
            <Stack space="space.200" className="min-w-0">
              <Section title="Control coverage" count={applicable.length}>
                <Stack space="space.150" className="pt-150">
                  <ProgressStacked
                    label={`${object.name} applicable control outcomes`}
                    segments={[
                      {
                        key: "satisfied",
                        value: satisfied,
                        tone: "success",
                        title: `${satisfied} satisfied`,
                      },
                      {
                        key: "partial",
                        value: partial,
                        tone: "warning",
                        title: `${partial} partial`,
                      },
                      {
                        key: "not-assessed",
                        value: notAssessed,
                        tone: "neutral",
                        appearance: "hatched",
                        title: `${notAssessed} not assessed`,
                      },
                    ]}
                  />
                  <Inline space="space.200" shouldWrap>
                    <Indicator tone="success">{satisfied} satisfied</Indicator>
                    <Indicator tone="warning">{partial} partial</Indicator>
                    <Indicator tone="neutral">{notAssessed} not assessed</Indicator>
                    <Text size="small" color="color.text.subtle">
                      {excluded} not applicable
                    </Text>
                  </Inline>
                </Stack>
              </Section>
              <Inline space="space.100" shouldWrap spread="space-between" alignBlock="center">
                <Select
                  items={[
                    { value: "all", label: "All controls" },
                    { value: "applicable", label: "Applicable" },
                    { value: "satisfied", label: "Satisfied" },
                    { value: "work", label: "Partial / not assessed" },
                    { value: "excluded", label: "Not applicable" },
                  ]}
                  value={filter}
                  onValueChange={(value) => setFilter(String(value))}
                >
                  <SelectTrigger aria-label="Filter object controls">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All controls</SelectItem>
                    <SelectItem value="applicable">Applicable</SelectItem>
                    <SelectItem value="satisfied">Satisfied</SelectItem>
                    <SelectItem value="work">Partial / not assessed</SelectItem>
                    <SelectItem value="excluded">Not applicable</SelectItem>
                  </SelectContent>
                </Select>
              </Inline>
              <Table
                label={`${object.name} control coverage`}
                density="compact"
                style={{ minWidth: 665 }}
              >
                <thead>
                  <tr>
                    <Table.Header width={205}>Control</Table.Header>
                    <Table.Header width={245}>Implementation</Table.Header>
                    <Table.Header width={140}>Outcome</Table.Header>
                    <Table.Header width={75}>Evidence</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {filteredControls.map((control) => (
                    <Table.Row key={control.id}>
                      <Table.Cell className="whitespace-normal py-150">
                        <Stack space="space.050">
                          <Button
                            variant="link"
                            size="small"
                            onClick={() => setSelectedId(control.id)}
                            className="w-fit"
                            aria-label={`Open ${object.name} ${control.id}`}
                          >
                            {control.id}
                          </Button>
                          <Text as="p" size="small">
                            {definition(control.id)?.title ?? control.id}
                          </Text>
                        </Stack>
                      </Table.Cell>
                      <Table.Cell className="whitespace-normal py-150">
                        <Text as="p" size="small" className="line-clamp-2">
                          {control.implementation}
                        </Text>
                        {control.contributions.length > 0 && (
                          <Text as="p" size="small" color="color.text.subtle" className="pt-050">
                            {control.contributions.length} referenced{" "}
                            {control.contributions.length === 1 ? "object" : "objects"}
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Outcome status={control.status} />
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small">{control.evidenceIds.length} linked</Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
              {!filteredControls.length && (
                <Text as="p" size="small" color="color.text.subtle">
                  No matching controls
                </Text>
              )}
            </Stack>
          )}
        </TabsContent>
        <TabsContent value="requirements" className="pt-300">
          <Section title="Requirements" count={object.requirements.length}>
            <Box paddingBlockStart="space.150" className="min-w-0">
              {requirementTable()}
            </Box>
          </Section>
        </TabsContent>
        <TabsContent value="evidence" className="pt-300">
          <Section title="Evidence" count={object.evidence.length}>
            <Box paddingBlockStart="space.150" className="min-w-0">
              {evidenceTable()}
            </Box>
          </Section>
        </TabsContent>
        <TabsContent value="assessments" className="pt-300">
          <Stack space="space.300" className="min-w-0">
            <Section title="Assessment history" count={object.assessments.length}>
              <Stack space="space.200" className="pt-150">
                {object.assessments.map((assessment) => (
                  <Box
                    key={assessment.id}
                    padding="space.200"
                    className="bg-surface-sunken rounded-medium"
                  >
                    <Stack space="space.150">
                      <Inline
                        space="space.100"
                        spread="space-between"
                        alignBlock="center"
                        shouldWrap
                      >
                        <Inline space="space.100" alignBlock="center">
                          <FileCheck2 aria-hidden className="size-icon-small icon-subtle" />
                          <Text weight="medium">{assessment.id}</Text>
                        </Inline>
                        <Indicator
                          tone={assessment.result === "Complete" ? "information" : "warning"}
                        >
                          {assessment.result}
                        </Indicator>
                      </Inline>
                      <Grid
                        templateColumns={{
                          base: "minmax(0, 1fr)",
                          md: "repeat(2, minmax(0, 1fr))",
                        }}
                        gap="space.200"
                      >
                        <Stack space="space.050">
                          <Text size="small" color="color.text.subtle">
                            Assessor / date
                          </Text>
                          <Text as="p" size="small">
                            {assessment.assessor} · {assessment.date}
                          </Text>
                        </Stack>
                        <Stack space="space.050">
                          <Text size="small" color="color.text.subtle">
                            Scope
                          </Text>
                          <Text as="p" size="small">
                            {assessment.scope}
                          </Text>
                        </Stack>
                      </Grid>
                      <Text as="p">{assessment.note}</Text>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Section>
            <Section title="Outcomes">
              <Stack space="space.150" className="pt-150">
                <Inline space="space.200" shouldWrap>
                  <Indicator tone="success">{satisfied} satisfied</Indicator>
                  <Indicator tone="warning">{partial} partial</Indicator>
                  <Indicator tone="neutral">{notAssessed} not assessed</Indicator>
                </Inline>
                <Button
                  variant="link"
                  iconAfter={<ArrowRight />}
                  onClick={() => {
                    setTab("controls");
                    setSelectedId(null);
                  }}
                >
                  View controls
                </Button>
              </Stack>
            </Section>
          </Stack>
        </TabsContent>
        <TabsContent value="consumers" className="pt-300">
          <Stack space="space.300" className="min-w-0">
            <Section title="Program consumers" count={scopedConsumers.length}>
              <Box paddingBlockStart="space.150" className="min-w-0">
                <Table label={`${object.name} program consumers`} style={{ minWidth: 570 }}>
                  <thead>
                    <tr>
                      <Table.Header width={200}>Program</Table.Header>
                      <Table.Header width={95}>Version</Table.Header>
                      <Table.Header width={300}>Context</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedConsumers.map((program) => (
                      <Table.Row key={program.id}>
                        <Table.Cell>
                          <Button variant="link" onClick={() => onOpenProgram(program.id)}>
                            {program.name}
                          </Button>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge variant="secondary">{object.version}</Badge>
                        </Table.Cell>
                        <Table.Cell className="whitespace-normal py-150">
                          <Text as="p" size="small">
                            {program.context}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              </Box>
              {!scopedConsumers.length && (
                <Text as="p" size="small" color="color.text.subtle" className="pt-150">
                  No program consumers
                </Text>
              )}
            </Section>
          </Stack>
        </TabsContent>
        <TabsContent value="details" className="pt-300">
          <Stack space="space.300">
            {base && (
              <Inline space="space.100" shouldWrap className="pt-150" alignBlock="center">
                <Text size="small" color="color.text.subtle">
                  Base profile
                </Text>
                <Button variant="link" onClick={() => onOpenObject(base.id)}>
                  {base.name} {base.version}
                </Button>
              </Inline>
            )}
            <Section title="Conditions" count={object.conditions.length}>
              <Stack as="ul" space="space.100" className="pt-150">
                {object.conditions.map((condition) => (
                  <Text as="li" key={condition} size="small">
                    {condition}
                  </Text>
                ))}
              </Stack>
            </Section>
          </Stack>
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
