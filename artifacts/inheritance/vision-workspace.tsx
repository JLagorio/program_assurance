import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowDown,
  Building2,
  Boxes,
  Cpu,
  FileText,
  GitBranch,
  Layers3,
  Network,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Box,
  Button,
  Checkbox,
  Count,
  Field,
  FieldDescription,
  FieldLabel,
  Grid,
  Heading,
  Id,
  Inline,
  Input,
  PageHeader,
  ProgressStacked,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Shell,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  Tree,
} from "@ledger/design-system";
import {
  sources,
  controls,
  targets as seedTargets,
  contributions,
  updates,
  initialSourceIds,
  initialAssignments,
  type Source,
  type Contribution,
  type Target,
} from "./vision-data";
import { CatalogView, SourceDetailView } from "./vision-catalog";
import { UpdateReviewView } from "./vision-updates";

type View = "library" | "builder" | "matrix" | "work" | "updates";
const views: { id: View; title: string }[] = [
  { id: "library", title: "Master library" },
  { id: "builder", title: "Program builder" },
  { id: "matrix", title: "Inheritance matrix" },
  { id: "work", title: "Control workspace" },
  { id: "updates", title: "Change review" },
];
const sourceById = new Map(sources.map((source) => [source.id, source]));
const categories = ["Organization", "Host platform", "Product"] as const;
const origin = { Organization: "O", "Host platform": "H", Product: "P" };
const sourceIcon = { Organization: Building2, "Host platform": Network, Product: Cpu };
const display = {
  density: "compact" as "compact" | "default",
  matrix: "Source origins" as "Source origins" | "Responsibility",
};

function descendants(targetId: string, targets: Target[]): string[] {
  return [
    targetId,
    ...targets
      .filter((item) => item.parent === targetId)
      .flatMap((item) => descendants(item.id, targets)),
  ];
}
function eligible(contribution: Contribution, targets: Target[]) {
  return [
    ...new Set([
      ...contribution.eligibleTargets,
      ...targets
        .filter(
          (target) =>
            !seedTargets.some((seed) => seed.id === target.id) &&
            (target.sourceId === contribution.sourceId ||
              sourceById.get(contribution.sourceId)?.category === "Organization"),
        )
        .map((target) => target.id),
    ]),
  ];
}
function TargetPicker({
  value,
  targets,
  onChange,
  label = "Program target",
  all = false,
}: {
  value: string;
  targets: Target[];
  onChange: (value: string) => void;
  label?: string;
  all?: boolean;
}) {
  const choices = [
    ...(all ? [{ value: "all", label: "All program elements" }] : []),
    ...targets.map((target) => ({ value: target.id, label: target.name })),
  ];
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={choices}
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger aria-label={label} className="w-full" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function ProductVision() {
  const [view, setView] = useState<View>("matrix");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [compareConsumers, setCompareConsumers] = useState(false);
  const [cart, setCart] = useState(initialSourceIds);
  const [targets, setTargets] = useState(seedTargets);
  const [assignments, setAssignments] = useState<Record<string, string[]>>(initialAssignments);
  const [selectedTarget, setSelectedTarget] = useState("mc1");
  const [controlId, setControlId] = useState("AU-2");
  const [family, setFamily] = useState("All");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [narratives, setNarratives] = useState<Record<string, string>>({
    "AU-2|mc1":
      "Mission Computer 01 uses the approved Aster event list. The product supplies the event capability; the program owns event selection, deployed settings and the end-to-end integration test.",
    "AU-1|mission":
      "The mission subsystem adopts the corporate audit policy. Aster's operating procedure identifies the local audit owner and review cadence.",
  });
  const [completed, setCompleted] = useState<string[]>([]);
  const [adopted, setAdopted] = useState<string[]>([]);
  const [keptUpdates, setKeptUpdates] = useState<string[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<string[]>([]);
  const [instanceParent, setInstanceParent] = useState("mission");
  const [message, setMessage] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSource, setBulkSource] = useState("corp-audit");
  const [bulkTarget, setBulkTarget] = useState("mission");
  const [includeChildren, setIncludeChildren] = useState(true);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [productToAdd, setProductToAdd] = useState("mission-computer");
  const [instanceName, setInstanceName] = useState("Mission Computer 03");
  const [workTab, setWorkTab] = useState("implementation");
  const activeSources = sources.filter((source) => cart.includes(source.id));
  const activeContributions = contributions.filter((row) => cart.includes(row.sourceId));
  const activeUses = activeContributions.flatMap((row) =>
    (assignments[row.id] ?? [])
      .filter((id) => targets.some((target) => target.id === id))
      .map((targetId) => ({ row, targetId })),
  );
  const selectedPairs = new Set(
    activeUses.map(({ row, targetId }) => `${row.controlId}|${targetId}`),
  );
  const activeControlCount = new Set(activeUses.map(({ row }) => row.controlId)).size;
  const selectedControl = controls.find((control) => control.id === controlId) ?? controls[0]!;
  const target = targets.find((item) => item.id === selectedTarget) ?? targets[0]!;
  const controlUses = activeContributions.filter(
    (row) => row.controlId === controlId && eligible(row, targets).includes(selectedTarget),
  );
  const acceptedControlUses = controlUses.filter((row) =>
    (assignments[row.id] ?? []).includes(selectedTarget),
  );
  const narrativeKey = `${controlId}|${selectedTarget}`;
  const reviewedRequirementIds = [
    ...new Set(
      acceptedControlUses.flatMap((row) =>
        sourceById
          .get(row.sourceId)!
          .requirements.filter((requirement) => requirement.controlIds.includes(controlId))
          .map((requirement) => requirement.id),
      ),
    ),
  ];
  const filteredControls = controls.filter(
    (control) => family === "All" || control.family === family,
  );
  const visibleTargets =
    scopeFilter === "all"
      ? targets
      : targets.filter((item) => descendants(scopeFilter, targets).includes(item.id));
  const bulkTargets = (includeChildren ? descendants(bulkTarget, targets) : [bulkTarget]).filter(
    (id) => !excluded.includes(id),
  );
  const bulkRows = contributions.filter(
    (row) =>
      row.sourceId === bulkSource &&
      (family === "All" ||
        controls.find((control) => control.id === row.controlId)?.family === family),
  );
  const bulkPairs = bulkRows.flatMap((row) =>
    bulkTargets
      .filter((id) => eligible(row, targets).includes(id))
      .map((targetId) => ({ row, targetId })),
  );
  const newBulkCount = bulkPairs.filter(
    ({ row, targetId }) =>
      !(assignments[row.id] ?? []).includes(targetId) || !cart.includes(row.sourceId),
  ).length;
  function navigate(next: View) {
    setView(next);
    setSourceId(null);
    setCompareConsumers(false);
    setMessage("");
  }
  function openSource(id: string) {
    setSourceId(id);
    setView("library");
    setCompareConsumers(false);
  }
  function openControl(id: string, targetId: string) {
    setControlId(id);
    setSelectedTarget(targetId);
    setView("work");
    setWorkTab("implementation");
    setMessage("");
  }
  function toggleSource(id: string) {
    setCart((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  }
  function toggleAssignment(row: Contribution, targetId: string, checked: boolean) {
    setAssignments((previous) => ({
      ...previous,
      [row.id]: checked
        ? [...new Set([...(previous[row.id] ?? []), targetId])]
        : (previous[row.id] ?? []).filter((id) => id !== targetId),
    }));
  }
  function applyBulk() {
    const next = { ...assignments };
    for (const { row, targetId } of bulkPairs)
      next[row.id] = [...new Set([...(next[row.id] ?? []), targetId])];
    setAssignments(next);
    setCart((previous) => [...new Set([...previous, bulkSource])]);
    setMessage(
      `${newBulkCount} source uses added to the draft. The selected versions and exact targets are retained; assessment is unchanged.`,
    );
    setBulkOpen(false);
  }
  function addInstance() {
    if (!instanceName.trim()) return;
    if (targets.some((item) => item.name.toLowerCase() === instanceName.trim().toLowerCase())) {
      setMessage("Choose a distinct name for this product instance.");
      return;
    }
    const newTarget: Target = {
      id: `instance-${targets.length + 1}`,
      name: instanceName.trim(),
      short: instanceName.trim(),
      parent: instanceParent,
      kind: "Component",
      sourceId: productToAdd,
    };
    setTargets((previous) => [...previous, newTarget]);
    setCart((previous) => [...new Set([...previous, productToAdd])]);
    const next = { ...assignments };
    for (const row of contributions.filter((item) => item.sourceId === productToAdd))
      next[row.id] = [...new Set([...(next[row.id] ?? []), newTarget.id])];
    setAssignments(next);
    setSelectedTarget(newTarget.id);
    setInstanceName(
      `${sourceById.get(productToAdd)!.name} ${targets.filter((item) => item.sourceId === productToAdd).length + 2}`,
    );
    setMessage(
      `${newTarget.name} added with ${contributions.filter((item) => item.sourceId === productToAdd).length} proposed control contributions. Configure and assess this instance independently.`,
    );
  }
  function versionOf(source: Source) {
    return source.version;
  }
  function OriginSummary() {
    return (
      <Grid
        templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(3,minmax(0,1fr))" }}
        gap="space.200"
      >
        {categories.map((category) => {
          const selected = activeSources.filter((source) => source.category === category);
          const Icon = sourceIcon[category];
          const uses = activeUses.filter(
            ({ row }) => sourceById.get(row.sourceId)!.category === category,
          ).length;
          return (
            <Box
              key={category}
              backgroundColor="elevation.surface.sunken"
              padding="space.200"
              className="rounded-medium"
            >
              <Stack space="space.100">
                <Inline space="space.100" alignBlock="center" spread="space-between">
                  <Inline space="space.075" alignBlock="center">
                    <Icon aria-hidden className="size-icon-medium icon-subtle" />
                    <Text weight="medium">{category}</Text>
                  </Inline>
                  <Count value={selected.length} />
                </Inline>
                <Text size="small" color="color.text.subtle">
                  {uses} source uses ·{" "}
                  {selected
                    .slice(0, 2)
                    .map((source) => source.name)
                    .join(" + ")}
                  {selected.length > 2 ? ` + ${selected.length - 2} more` : ""}
                </Text>
                <Button
                  variant="link"
                  size="small"
                  className="w-fit"
                  onClick={() => {
                    navigate("library");
                  }}
                >
                  Explore sources
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Grid>
    );
  }
  function BulkAssignment() {
    return (
      <Section
        title="Apply an implementation"
        action={
          <Button variant="subtle" size="small" onClick={() => setBulkOpen(false)}>
            Close
          </Button>
        }
      >
        <Stack space="space.200" className="pt-150">
          <Grid
            templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
            gap="space.200"
          >
            <Field>
              <FieldLabel>Source version</FieldLabel>
              <Select
                value={bulkSource}
                items={sources.map((source) => ({
                  value: source.id,
                  label: `${source.name} · ${versionOf(source)}`,
                }))}
                onValueChange={(value) => {
                  if (value) setBulkSource(value);
                }}
              >
                <SelectTrigger aria-label="Bulk source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} · {versionOf(source)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <TargetPicker
              value={bulkTarget}
              targets={targets}
              onChange={(id) => {
                setBulkTarget(id);
                setExcluded([]);
              }}
              label="Apply to element"
            />
          </Grid>
          <Field orientation="horizontal">
            <Checkbox
              id="include-descendants"
              checked={includeChildren}
              onCheckedChange={setIncludeChildren}
            />
            <FieldLabel htmlFor="include-descendants">Include current descendants</FieldLabel>
          </Field>
          <Inline space="space.200" alignBlock="center" shouldWrap>
            {(includeChildren ? descendants(bulkTarget, targets) : [bulkTarget]).map((id) => (
              <Field key={id} orientation="horizontal" className="w-auto">
                <Checkbox
                  id={`bulk-${id}`}
                  checked={!excluded.includes(id)}
                  onCheckedChange={(checked) =>
                    setExcluded((previous) =>
                      checked ? previous.filter((item) => item !== id) : [...previous, id],
                    )
                  }
                />
                <FieldLabel htmlFor={`bulk-${id}`}>
                  {targets.find((item) => item.id === id)!.short}
                </FieldLabel>
              </Field>
            ))}
          </Inline>
          <Inline spread="space-between" space="space.150" alignBlock="center" shouldWrap>
            <Text color="color.text.subtle">
              {family === "All" ? "All selected control families" : `${family} family`} ·{" "}
              {bulkPairs.length} eligible uses · {newBulkCount} additions
            </Text>
            <Button variant="primary" onClick={applyBulk} disabled={!bulkPairs.length}>
              Apply to draft
            </Button>
          </Inline>
        </Stack>
      </Section>
    );
  }
  function MatrixView() {
    return (
      <Stack space="space.300">
        <PageHeader
          eyebrow="Aster / Mission systems / Integration draft 03"
          title="Inheritance workbench"
          description={`${controls.length} controls · ${targets.length} elements · ${activeSources.length} reusable sources`}
        />
        {OriginSummary()}
        <Inline spread="space-between" space="space.200" shouldWrap alignBlock="end">
          <Grid
            templateColumns={{ base: "minmax(0,1fr)", sm: "auto minmax(0,1fr)" }}
            gap="space.150"
            className="min-w-0 w-full sm:w-auto sm:flex-1"
          >
            <Field>
              <FieldLabel>Control family</FieldLabel>
              <Select
                items={[
                  { value: "All", label: "All families" },
                  ...[...new Set(controls.map((control) => control.family))].map((id) => ({
                    value: id,
                    label: id,
                  })),
                ]}
                value={family}
                onValueChange={(value) => {
                  if (value) setFamily(value);
                }}
              >
                <SelectTrigger aria-label="Control family" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All families</SelectItem>
                  {[...new Set(controls.map((control) => control.family))].map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Box className="min-w-0 flex-1">
              <TargetPicker
                value={scopeFilter}
                targets={targets}
                onChange={setScopeFilter}
                all
                label="System scope"
              />
            </Box>
          </Grid>
          <Button
            variant="primary"
            size="small"
            iconBefore={<Plus />}
            onClick={() => setBulkOpen(!bulkOpen)}
          >
            Apply from library
          </Button>
        </Inline>
        {bulkOpen && BulkAssignment()}
        <Stack space="space.100">
          <Inline space="space.200" shouldWrap alignBlock="center">
            <Text size="small" weight="medium">
              SOURCE ORIGINS
            </Text>
            <Text size="small" color="color.text.subtle">
              O Organization · H Host platform · P Product · — Local work remains
            </Text>
          </Inline>
          <Table
            label="Inheritance coverage matrix"
            density={display.density}
            style={{ minWidth: 230 + visibleTargets.length * 76 }}
          >
            <thead>
              <tr>
                <Table.Header width={230} pinned="start">
                  Control / implementation
                </Table.Header>
                {visibleTargets.map((item) => (
                  <Table.Header key={item.id} width={76}>
                    <Text as="span" size="small">
                      {item.short}
                    </Text>
                  </Table.Header>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredControls.map((control) => (
                <Table.Row key={control.id}>
                  <Table.Cell pinned="start">
                    <Stack space="space.025" className="py-050">
                      <Button
                        variant="link"
                        size="small"
                        className="w-fit"
                        onClick={() => openControl(control.id, visibleTargets[0]?.id ?? "system")}
                      >
                        <Id>{control.id}</Id>
                      </Button>
                      <Text size="small" color="color.text.subtle">
                        {control.title}
                      </Text>
                    </Stack>
                  </Table.Cell>
                  {visibleTargets.map((item) => {
                    const uses = activeUses.filter(
                      ({ row, targetId }) => row.controlId === control.id && targetId === item.id,
                    );
                    const origins = categories.filter((category) =>
                      uses.some(({ row }) => sourceById.get(row.sourceId)!.category === category),
                    );
                    const conditional =
                      origins.includes("Host platform") ||
                      uses.some(({ row }) => row.sourceId === "regional-eu");
                    const hasUpdated = uses.some(({ row }) =>
                      updates.some(
                        (update) => update.sourceId === row.sourceId && adopted.includes(update.id),
                      ),
                    );
                    const text =
                      display.matrix === "Source origins"
                        ? origins.map((category) => origin[category]).join(" + ") || "—"
                        : hasUpdated
                          ? "Review"
                          : conditional
                            ? "Conditional"
                            : uses.length
                              ? "Shared"
                              : "Local";
                    return (
                      <Table.Cell key={item.id} className={uses.length ? "bg-brand-subtlest" : ""}>
                        <Button
                          variant="subtle"
                          size="small"
                          className="w-full justify-start"
                          aria-label={`Inspect ${control.id} on ${item.name}: ${text}`}
                          onClick={() => openControl(control.id, item.id)}
                        >
                          <Text
                            size="small"
                            color={
                              hasUpdated
                                ? "color.text.warning"
                                : uses.length
                                  ? "color.text.brand"
                                  : "color.text.subtle"
                            }
                          >
                            {text}
                          </Text>
                          {conditional && (
                            <Text size="xsmall" color="color.text.warning">
                              *
                            </Text>
                          )}
                        </Button>
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              ))}
            </tbody>
          </Table>
          <Inline spread="space-between" space="space.150" shouldWrap>
            <Text size="small" color="color.text.subtle">
              {selectedPairs.size} target-control pairs have source contributions ·{" "}
              {activeUses.length} versioned references
            </Text>
            <Text size="small" color="color.text.subtle">
              * Provider / regional conditions require confirmation · unassessed
            </Text>
          </Inline>
        </Stack>
      </Stack>
    );
  }
  function BuilderView() {
    const productChoices = sources.filter((source) => source.category === "Product");
    const targetUses = activeUses.filter(({ targetId }) => targetId === selectedTarget);
    const depth = (item: Target): number =>
      item.parent ? 1 + depth(targets.find((parent) => parent.id === item.parent)!) : 0;
    const ordered = (parent: string | null): Target[] =>
      targets
        .filter((item) => item.parent === parent)
        .flatMap((item) => [item, ...(collapsedNodes.includes(item.id) ? [] : ordered(item.id))]);
    return (
      <Stack space="space.400">
        <PageHeader
          eyebrow="Aster / Mission systems"
          title="Build a program from reusable implementations"
          description="Product instances, corporate baselines and host responsibilities in one assembly"
        />
        <Grid
          templateColumns={{ base: "minmax(0,1fr)", md: "minmax(0,1fr) minmax(0,2fr)" }}
          gap="space.300"
        >
          <Section title="System composition" count={targets.length}>
            <Tree label="Program system composition" className="pt-150">
              {ordered(null).map((item) => (
                <Tree.Item
                  key={item.id}
                  depth={depth(item)}
                  hasChildren={targets.some((child) => child.parent === item.id)}
                  expanded={!collapsedNodes.includes(item.id)}
                  onToggle={() =>
                    setCollapsedNodes((previous) =>
                      previous.includes(item.id)
                        ? previous.filter((id) => id !== item.id)
                        : [...previous, item.id],
                    )
                  }
                  isSelected={selectedTarget === item.id}
                  onSelect={() => setSelectedTarget(item.id)}
                  trailing={
                    <Count
                      value={activeUses.filter(({ targetId }) => targetId === item.id).length}
                    />
                  }
                >
                  <Text size="small">{item.name}</Text>
                </Tree.Item>
              ))}
            </Tree>
          </Section>
          <Section title={target.name} action={<Badge variant="secondary">{target.kind}</Badge>}>
            <Stack space="space.250" className="pt-150">
              <Inline space="space.200" shouldWrap>
                <Text>{targetUses.length} selected source contributions</Text>
                <Text color="color.text.subtle">
                  {new Set(targetUses.map(({ row }) => row.controlId)).size} controls supported
                </Text>
              </Inline>
              {target.sourceId && (
                <Inline space="space.100" alignBlock="center" shouldWrap>
                  <Cpu aria-hidden className="size-icon-medium icon-subtle" />
                  <Button variant="link" onClick={() => openSource(target.sourceId!)}>
                    {sourceById.get(target.sourceId)?.name}
                  </Button>
                  <Badge variant="secondary">{versionOf(sourceById.get(target.sourceId)!)}</Badge>
                  {updates
                    .filter(
                      (update) =>
                        update.sourceId === target.sourceId && adopted.includes(update.id),
                    )
                    .map((update) => (
                      <Badge key={update.id} variant="secondary" tone="warning">
                        {update.toVersion} proposed
                      </Badge>
                    ))}
                  <Text size="small" color="color.text.subtle">
                    Pinned product definition
                  </Text>
                </Inline>
              )}
              <Table
                label="Sources for selected element"
                density="compact"
                style={{ minWidth: 440 }}
              >
                <thead>
                  <tr>
                    <Table.Header>Source / responsibility</Table.Header>
                    <Table.Header width={85}>Controls</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {activeSources
                    .filter((source) => targetUses.some(({ row }) => row.sourceId === source.id))
                    .map((source) => (
                      <Table.Row key={source.id}>
                        <Table.Cell>
                          <Stack space="space.025" className="py-075">
                            <Button
                              variant="link"
                              size="small"
                              className="w-fit"
                              onClick={() => openSource(source.id)}
                            >
                              {source.name}
                            </Button>
                            <Text size="small" color="color.text.subtle">
                              {source.category} · {versionOf(source)}
                            </Text>
                          </Stack>
                        </Table.Cell>
                        <Table.Cell>
                          {
                            new Set(
                              targetUses
                                .filter(({ row }) => row.sourceId === source.id)
                                .map(({ row }) => row.controlId),
                            ).size
                          }
                        </Table.Cell>
                      </Table.Row>
                    ))}
                </tbody>
              </Table>
              {!targetUses.length && (
                <Text color="color.text.subtle">
                  No reusable implementation has been assigned to this element yet.
                </Text>
              )}
              <Inline space="space.100" shouldWrap>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setScopeFilter(selectedTarget);
                    navigate("matrix");
                  }}
                >
                  Inspect coverage
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setBulkTarget(selectedTarget);
                    setBulkOpen(true);
                    navigate("matrix");
                  }}
                >
                  Apply baseline to this element
                </Button>
              </Inline>
            </Stack>
          </Section>
        </Grid>
        <Section
          title="Add a product instance"
          description="Instantiate the master definition; keep local configuration with this instance"
        >
          <Stack space="space.200" className="pt-150">
            <TargetPicker
              value={instanceParent}
              targets={targets.filter(
                (item) => item.kind === "System" || item.kind === "Subsystem",
              )}
              onChange={setInstanceParent}
              label="Attach beneath"
            />
            <Grid
              templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
              gap="space.200"
            >
              <Field>
                <FieldLabel>Catalog product</FieldLabel>
                <Select
                  items={productChoices.map((source) => ({
                    value: source.id,
                    label: `${source.name} · ${versionOf(source)}`,
                  }))}
                  value={productToAdd}
                  onValueChange={(id) => {
                    if (id) {
                      setProductToAdd(id);
                      setInstanceName(
                        `${sourceById.get(id)!.name} ${targets.filter((item) => item.sourceId === id).length + 1}`,
                      );
                    }
                  }}
                >
                  <SelectTrigger aria-label="Catalog product" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productChoices.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} · {versionOf(source)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="instance-name">Instance name</FieldLabel>
                <Input
                  id="instance-name"
                  value={instanceName}
                  onChange={(event) => setInstanceName(event.target.value)}
                />
              </Field>
            </Grid>
            <Inline spread="space-between" shouldWrap alignBlock="center" space="space.150">
              <Text color="color.text.subtle">
                Includes {contributions.filter((row) => row.sourceId === productToAdd).length}{" "}
                proposed mappings. Local configuration stays with this instance.
              </Text>
              <Button
                variant="primary"
                iconBefore={<Plus />}
                onClick={addInstance}
                disabled={!instanceName.trim()}
              >
                Add instance
              </Button>
            </Inline>
          </Stack>
        </Section>
        <Section
          title="Program implementation layers"
          count={activeSources.length}
          action={
            <Button variant="link" onClick={() => navigate("library")}>
              Edit source cart
            </Button>
          }
        >
          <Box className="pt-150">{OriginSummary()}</Box>
        </Section>
        <Section title="Draft reuse footprint">
          <Stack space="space.150" className="pt-150">
            <ProgressStacked
              label="Selected source contributions by origin"
              size="large"
              segments={categories.map((category, index) => ({
                key: category,
                value: activeUses.filter(
                  ({ row }) => sourceById.get(row.sourceId)!.category === category,
                ).length,
                tone: index === 0 ? "information" : index === 1 ? "warning" : "neutral",
                title: category,
              }))}
            />
            <Inline space="space.300" shouldWrap>
              <Text>{activeControlCount} controls receive reusable contributions</Text>
              <Text color="color.text.subtle">
                {controls.length - activeControlCount} controls have no selected source
              </Text>
              <Button variant="link" onClick={() => navigate("matrix")}>
                Open all {controls.length} controls
              </Button>
            </Inline>
          </Stack>
        </Section>
      </Stack>
    );
  }
  function ControlView() {
    const requirementRows = acceptedControlUses
      .flatMap((row) =>
        sourceById
          .get(row.sourceId)!
          .requirements.filter((requirement) => requirement.controlIds.includes(controlId))
          .map((requirement) => ({ ...requirement, sourceId: row.sourceId })),
      )
      .filter(
        (item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index,
      );
    const evidenceRows = acceptedControlUses
      .flatMap((row) =>
        sourceById
          .get(row.sourceId)!
          .evidence.filter((evidence) => row.evidenceIds.includes(evidence.id))
          .map((evidence) => ({ ...evidence, sourceId: row.sourceId })),
      )
      .filter(
        (item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index,
      );
    const completedCount = acceptedControlUses.filter((row) =>
      completed.includes(`${row.id}|${selectedTarget}`),
    ).length;
    return (
      <Stack space="space.300">
        <Inline spread="space-between" alignBlock="center" shouldWrap space="space.100">
          <Button variant="link" size="small" onClick={() => navigate("matrix")}>
            Back to inheritance matrix
          </Button>
          <Inline space="space.100">
            <Badge variant="secondary">
              {acceptedControlUses.length ? "Hybrid implementation" : "Local implementation"}
            </Badge>
            <Badge variant="secondary">Not assessed</Badge>
          </Inline>
        </Inline>
        <PageHeader
          eyebrow={`Aster / ${target.name}`}
          title={`${selectedControl.id} · ${selectedControl.title}`}
          description={selectedControl.objective}
        />
        <Grid
          templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
          gap="space.200"
        >
          <Field>
            <FieldLabel>Control</FieldLabel>
            <Select
              items={controls.map((control) => ({
                value: control.id,
                label: `${control.id} · ${control.title}`,
              }))}
              value={controlId}
              onValueChange={(id) => {
                if (id) setControlId(id);
              }}
            >
              <SelectTrigger aria-label="Workspace control" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {controls.map((control) => (
                  <SelectItem key={control.id} value={control.id}>
                    {control.id} · {control.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <TargetPicker value={selectedTarget} targets={targets} onChange={setSelectedTarget} />
        </Grid>
        <Tabs value={workTab} onValueChange={(value) => setWorkTab(String(value))}>
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="implementation">
              Implementation <Count value={acceptedControlUses.length + 1} />
            </TabsTrigger>
            <TabsTrigger value="requirements">
              Requirements <Count value={reviewedRequirementIds.length} />
            </TabsTrigger>
            <TabsTrigger value="evidence">
              Evidence <Count value={evidenceRows.length} />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="implementation" className="pt-200">
            <Stack space="space.300">
              <Section
                title="Implementation contributions"
                description={`${acceptedControlUses.length} source contributions + the local program implementation`}
              >
                <Stack space="space.0" className="pt-150">
                  {controlUses.map((row) => {
                    const source = sourceById.get(row.sourceId)!;
                    const isSelected = (assignments[row.id] ?? []).includes(selectedTarget);
                    const Icon = sourceIcon[source.category];
                    return (
                      <Box key={row.id} className="border-b border-default py-200">
                        <Grid
                          templateColumns={{
                            base: "minmax(0,1fr)",
                            sm: "minmax(0,1fr) minmax(0,2fr)",
                          }}
                          gap="space.200"
                        >
                          <Stack space="space.100">
                            <Inline alignBlock="center" space="space.075">
                              <Icon aria-hidden className="size-icon-medium icon-subtle" />
                              <Text weight="medium">{source.category}</Text>
                            </Inline>
                            <Button
                              variant="link"
                              className="w-fit whitespace-normal text-left justify-start"
                              onClick={() => openSource(source.id)}
                            >
                              {source.name}
                            </Button>
                            <Inline space="space.100" shouldWrap>
                              <Badge variant="secondary">{versionOf(source)}</Badge>
                              {!isSelected && (
                                <Badge variant="secondary">Available · not selected</Badge>
                              )}
                              <Text size="small" color="color.text.subtle">
                                {row.evidenceIds.length} evidence references
                              </Text>
                            </Inline>
                            <Field orientation="horizontal">
                              <Checkbox
                                id={`use-${row.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  toggleAssignment(row, selectedTarget, checked)
                                }
                              />
                              <FieldLabel htmlFor={`use-${row.id}`}>Use for this target</FieldLabel>
                            </Field>
                          </Stack>
                          <Stack space="space.150">
                            <Text as="p">{row.narrative}</Text>
                            <Text as="p" size="small" color="color.text.subtle">
                              Program responsibility: {row.remaining}
                            </Text>
                            {source.category === "Host platform" && (
                              <Badge variant="secondary" tone="warning" className="w-fit">
                                Conditional on provider relationship
                              </Badge>
                            )}
                            {updates.some(
                              (update) =>
                                update.sourceId === source.id && adopted.includes(update.id),
                            ) && (
                              <Badge variant="secondary" tone="warning" className="w-fit">
                                Proposed release · accepted material shown until review
                              </Badge>
                            )}
                          </Stack>
                        </Grid>
                      </Box>
                    );
                  })}
                  {!controlUses.length && (
                    <Text color="color.text.subtle">
                      No selected library source offers this control for this target. Local
                      implementation is still required.
                    </Text>
                  )}
                </Stack>
              </Section>
              <Section
                title="Program implementation"
                action={<Badge variant="secondary">Local to Aster</Badge>}
              >
                <Stack space="space.200" className="pt-150">
                  <Field>
                    <FieldLabel htmlFor="program-narrative">
                      How this instance completes the implementation
                    </FieldLabel>
                    <Textarea
                      id="program-narrative"
                      rows={5}
                      value={narratives[narrativeKey] ?? ""}
                      onChange={(event) =>
                        setNarratives((previous) => ({
                          ...previous,
                          [narrativeKey]: event.target.value,
                        }))
                      }
                      placeholder="Record the deployed configuration, integration decisions and local evidence."
                    />
                    <FieldDescription>
                      This text belongs to {target.name}. Master narratives and other program
                      instances are unchanged.
                    </FieldDescription>
                  </Field>
                  {acceptedControlUses.map((row) => (
                    <Field orientation="horizontal" key={row.id}>
                      <Checkbox
                        id={`responsibility-${row.id}`}
                        checked={completed.includes(`${row.id}|${selectedTarget}`)}
                        onCheckedChange={(checked) =>
                          setCompleted((previous) =>
                            checked
                              ? [...new Set([...previous, `${row.id}|${selectedTarget}`])]
                              : previous.filter((id) => id !== `${row.id}|${selectedTarget}`),
                          )
                        }
                      />
                      <FieldLabel htmlFor={`responsibility-${row.id}`}>{row.remaining}</FieldLabel>
                    </Field>
                  ))}
                  <Text size="small" color="color.text.subtle">
                    {completedCount} of {acceptedControlUses.length} local responsibilities recorded
                    as complete · assessment remains separate
                  </Text>
                </Stack>
              </Section>
            </Stack>
          </TabsContent>
          <TabsContent value="requirements" className="pt-200">
            <Section title="Mapped engineering requirements" count={requirementRows.length}>
              <Table label="Control requirements" style={{ minWidth: 650 }}>
                <thead>
                  <tr>
                    <Table.Header>Requirement / master definition</Table.Header>
                    <Table.Header width={170}>Source</Table.Header>
                    <Table.Header width={170}>Also supports</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {requirementRows.map((requirement) => (
                    <Table.Row key={requirement.id}>
                      <Table.Cell>
                        <Stack space="space.100" className="py-100">
                          <Id>{requirement.id}</Id>
                          <Text as="p" className="whitespace-normal">
                            {requirement.text}
                          </Text>
                        </Stack>
                      </Table.Cell>
                      <Table.Cell>{sourceById.get(requirement.sourceId)!.name}</Table.Cell>
                      <Table.Cell>{requirement.controlIds.join(", ")}</Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
              {!requirementRows.length && (
                <Text as="p" className="pt-150" color="color.text.subtle">
                  No engineering requirement mapping supplied for this control and target.
                </Text>
              )}
            </Section>
          </TabsContent>
          <TabsContent value="evidence" className="pt-200">
            <Section title="Evidence reused from the library" count={evidenceRows.length}>
              <Table label="Control evidence" style={{ minWidth: 650 }}>
                <thead>
                  <tr>
                    <Table.Header>Artifact / source</Table.Header>
                    <Table.Header width={120}>Kind</Table.Header>
                    <Table.Header width={120}>Collected</Table.Header>
                    <Table.Header width={130}>Program use</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {evidenceRows.map((evidence) => (
                    <Table.Row key={evidence.id}>
                      <Table.Cell>
                        <Stack space="space.050" className="py-100">
                          <Inline space="space.075" alignBlock="center">
                            <FileText aria-hidden className="size-icon-small icon-subtle" />
                            <Text>{evidence.title}</Text>
                          </Inline>
                          <Text size="small" color="color.text.subtle">
                            {sourceById.get(evidence.sourceId)!.name}
                          </Text>
                        </Stack>
                      </Table.Cell>
                      <Table.Cell>{evidence.kind}</Table.Cell>
                      <Table.Cell>{evidence.date}</Table.Cell>
                      <Table.Cell>
                        <Badge variant="secondary">Reference only</Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
              <Text as="p" className="pt-150" color="color.text.subtle">
                Reusable evidence supports the source claim. Configuration and integration evidence
                still belong to this program.
              </Text>
            </Section>
          </TabsContent>
        </Tabs>
      </Stack>
    );
  }
  function ConsumerComparison({ source }: { source: Source }) {
    return (
      <Stack space="space.300">
        <Button variant="link" className="w-fit" onClick={() => setCompareConsumers(false)}>
          Back to {source.name}
        </Button>
        <PageHeader
          eyebrow="Master library / Reuse"
          title="One implementation, independent program records"
          description={`${source.name} · ${source.consumers.length} consumers`}
        />
        <Section title="Program adoption">
          <Table label="Cross-program source use" style={{ minWidth: 660 }}>
            <thead>
              <tr>
                <Table.Header>Program</Table.Header>
                <Table.Header width={120}>Source version</Table.Header>
                <Table.Header>Program implementation</Table.Header>
                <Table.Header>Update decision</Table.Header>
              </tr>
            </thead>
            <tbody>
              {source.consumers.map((program, index) => (
                <Table.Row key={program}>
                  <Table.Cell>{program}</Table.Cell>
                  <Table.Cell>{source.version}</Table.Cell>
                  <Table.Cell>
                    {program === "Aster"
                      ? "This draft's local narrative"
                      : "Independent local record"}
                  </Table.Cell>
                  <Table.Cell>
                    {program === "Aster" &&
                    adopted.some(
                      (id) => updates.find((update) => update.id === id)?.sourceId === source.id,
                    )
                      ? "New release proposed for review"
                      : "Retains accepted version"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>
        <Text color="color.text.subtle">
          Shared master requirements and evidence; separate targets, configurations, acceptance and
          assessment in every program.
        </Text>
      </Stack>
    );
  }
  return (
    <Box backgroundColor="elevation.surface" className="font-body text-default min-w-0">
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.AppLogo
            name="Equinox"
            secondaryName="Northwind Aerospace"
            render={<button type="button" onClick={() => navigate("matrix")} />}
          />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <Inline space="space.100" alignBlock="center" className="min-w-0">
            <Text weight="medium">Aster</Text>
            <Text color="color.text.subtle" className="hidden sm:inline">
              Mission systems
            </Text>
            <Badge variant="secondary">Draft 03</Badge>
          </Inline>
        </Shell.TopNav.Middle>
        <Shell.TopNav.End>
          <Button
            variant="subtle"
            size="small"
            iconBefore={<GitBranch />}
            onClick={() => navigate("updates")}
          >
            {
              updates.filter(
                (update) => !adopted.includes(update.id) && !keptUpdates.includes(update.id),
              ).length
            }{" "}
            source updates
          </Button>
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Tabs value={view} onValueChange={(value) => navigate(value as View)}>
        <Box className="px-200 sm:px-300 border-b border-default">
          <TabsList
            variant="line"
            aria-label="Program assurance workspace"
            className="w-full justify-start"
          >
            {views.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.title}
                {item.id === "library" && <Count value={sources.length} />}{" "}
                {item.id === "matrix" && <Count value={controls.length} />}
              </TabsTrigger>
            ))}
          </TabsList>
        </Box>
        {views.map((item) => (
          <TabsContent value={item.id} key={item.id}>
            <Box as="main" className="p-200 sm:p-300">
              <Stack space="space.300">
                {message && (
                  <Alert tone="information" role="status">
                    <AlertTitle>Draft updated</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
                {item.id === "library" &&
                  (sourceId ? (
                    compareConsumers ? (
                      ConsumerComparison({ source: sourceById.get(sourceId)! })
                    ) : (
                      <SourceDetailView
                        source={sourceById.get(sourceId)!}
                        selected={cart.includes(sourceId)}
                        onBack={() => setSourceId(null)}
                        onToggleSource={() => toggleSource(sourceId)}
                        onOpenConsumers={() => setCompareConsumers(true)}
                      />
                    )
                  ) : (
                    <CatalogView
                      sources={sources}
                      selectedIds={cart}
                      onToggleSource={toggleSource}
                      onOpenSource={openSource}
                      onBuild={() => navigate("builder")}
                    />
                  ))}
                {item.id === "builder" && BuilderView()}
                {item.id === "matrix" && MatrixView()}
                {item.id === "work" && ControlView()}
                {item.id === "updates" && (
                  <>
                    <PageHeader
                      eyebrow="Master library / Consumer impact"
                      title="Review source changes"
                      description="Pinned versions, explicit upgrades and preserved local work"
                    />
                    <UpdateReviewView
                      sources={sources}
                      updates={updates}
                      adoptedUpdateIds={adopted}
                      keptUpdateIds={keptUpdates}
                      onKeep={(id) => setKeptUpdates((previous) => [...new Set([...previous, id])])}
                      onOpenSource={openSource}
                      onAdopt={(id) => {
                        setAdopted((previous) => [...new Set([...previous, id])]);
                        setKeptUpdates((previous) => previous.filter((item) => item !== id));
                        const update = updates.find((item) => item.id === id)!;
                        setCart((previous) => [...new Set([...previous, update.sourceId])]);
                        setMessage(
                          `${sourceById.get(update.sourceId)!.name} ${update.toVersion} proposed for this draft. Accepted material remains at ${update.fromVersion} until review; local narratives and other programs retain their records.`,
                        );
                      }}
                    />
                  </>
                )}
              </Stack>
            </Box>
          </TabsContent>
        ))}
      </Tabs>
      <Inline
        spread="space-between"
        shouldWrap
        space="space.150"
        className="border-t border-default p-200"
      >
        <Inline space="space.100" alignBlock="center">
          <Layers3 aria-hidden className="size-icon-small icon-subtle" />
          <Text size="small" color="color.text.subtle">
            {sources.length} library sources · {contributions.length} reusable contributions ·{" "}
            {targets.length} program elements
          </Text>
        </Inline>
        <Text size="small" color="color.text.subtle">
          Interactive product concept · illustrative data · changes remain in this draft
        </Text>
      </Inline>
    </Box>
  );
}

export function mountVision() {
  const container = document.getElementById("ledger-inheritance-preview")!;
  const root = createRoot(container);
  const render = () => root.render(<ProductVision />);
  render();
  type TweakConstructor = new (options: { container: HTMLElement; onChange: () => void }) => {
    addSelect: (
      object: object,
      property: string,
      options: { label: string; options: string[] },
    ) => void;
  };
  const Tweak = (globalThis as typeof globalThis & { Tweak?: TweakConstructor }).Tweak;
  if (Tweak) {
    const tweak = new Tweak({ container, onChange: render });
    tweak.addSelect(display, "density", {
      label: "Matrix density",
      options: ["compact", "default"],
    });
    tweak.addSelect(display, "matrix", {
      label: "Matrix display",
      options: ["Source origins", "Responsibility"],
    });
  }
}
