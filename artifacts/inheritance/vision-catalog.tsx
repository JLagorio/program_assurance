import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircuitBoard,
  Layers3,
  Plane,
  Plus,
  X,
} from "lucide-react";
import {
  Badge,
  Box,
  Button,
  Count,
  Grid,
  Heading,
  Indicator,
  Inline,
  Input,
  PageHeader,
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
import type { Source } from "./vision-data";

type CatalogViewProps = {
  sources: Source[];
  selectedIds: string[];
  onToggleSource: (id: string) => void;
  onOpenSource: (id: string) => void;
  onBuild: () => void;
};

const categories = ["Organization", "Product", "Host platform"] as const;
const categoryDescriptions: Record<Source["category"], string> = {
  Organization: "Company policies, regional supplements and shared procedures",
  Product: "Versioned hardware, software, firmware and reusable assemblies",
  "Host platform": "Capabilities supplied by a connected platform or service",
};

function CategoryIcon({ category }: { category: Source["category"] }) {
  const Icon =
    category === "Organization" ? Building2 : category === "Product" ? CircuitBoard : Plane;
  return <Icon aria-hidden className="size-icon-small shrink-0 icon-subtle" />;
}

function SourceState({ source }: { source: Source }) {
  return (
    <Indicator
      tone={
        source.status === "Published"
          ? "success"
          : source.status === "Update available"
            ? "information"
            : "warning"
      }
    >
      {source.status}
    </Indicator>
  );
}

export function CatalogView({
  sources,
  selectedIds,
  onToggleSource,
  onOpenSource,
  onBuild,
}: CatalogViewProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [family, setFamily] = useState("All families");
  const [sort, setSort] = useState<"name" | "controls" | "consumers">("name");
  const selected = sources.filter((source) => selectedIds.includes(source.id));
  const families = [...new Set(sources.flatMap((source) => source.families))].sort();
  const controls = new Set(selected.flatMap((source) => source.controlIds));
  const evidenceCount = selected.reduce((total, source) => total + source.evidence.length, 0);
  const requirementsCount = selected.reduce(
    (total, source) => total + source.requirements.length,
    0,
  );
  const filtered = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return sources
      .filter((source) => {
        const content = [
          source.name,
          source.kind,
          source.category,
          source.version,
          source.owner,
          source.summary,
          ...source.families,
          ...source.controlIds,
        ]
          .join(" ")
          .toLowerCase();
        return (
          (category === "All" || source.category === category) &&
          (family === "All families" || source.families.includes(family)) &&
          words.every((word) => content.includes(word))
        );
      })
      .sort((a, b) =>
        sort === "controls"
          ? b.controlIds.length - a.controlIds.length || a.name.localeCompare(b.name)
          : sort === "consumers"
            ? b.consumers.length - a.consumers.length || a.name.localeCompare(b.name)
            : a.name.localeCompare(b.name),
      );
  }, [sources, query, category, family, sort]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((source) => selectedIds.includes(source.id));
  const someVisibleSelected = filtered.some((source) => selectedIds.includes(source.id));

  return (
    <Stack space="space.300" className="min-w-0">
      <PageHeader
        eyebrow="Shared assurance"
        title="Implementation library"
        description="Build programs from evidence-backed implementations maintained once and reused across products and platforms."
      />

      <Grid
        templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }}
        gap="space.200"
      >
        {categories.map((item) => (
          <Box key={item} className="border-b border-default pb-200">
            <Stack space="space.075">
              <Inline alignBlock="center" space="space.100">
                <CategoryIcon category={item} />
                <Button
                  variant="link"
                  isSelected={category === item}
                  onClick={() => setCategory(category === item ? "All" : item)}
                >
                  {item}
                </Button>
                <Count value={sources.filter((source) => source.category === item).length} />
              </Inline>
              <Text as="p" size="small" color="color.text.subtle">
                {categoryDescriptions[item]}
              </Text>
            </Stack>
          </Box>
        ))}
      </Grid>

      <Grid
        templateColumns={{ base: "minmax(0, 1fr)", xl: "minmax(0, 3fr) minmax(240px, 1fr)" }}
        gap="space.300"
        alignItems="start"
      >
        <Stack space="space.200" className="min-w-0">
          <Tabs value={category} onValueChange={(value) => setCategory(String(value))}>
            <Box className="overflow-x-auto">
              <TabsList variant="line" aria-label="Source category" className="justify-start">
                <TabsTrigger value="All">
                  All sources <Count value={sources.length} />
                </TabsTrigger>
                {categories.map((item) => (
                  <TabsTrigger key={item} value={item}>
                    {item}{" "}
                    <Count value={sources.filter((source) => source.category === item).length} />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Box>
            <TabsContent value={category} className="pt-200">
              <Stack space="space.200" className="min-w-0">
                <Inline space="space.100" shouldWrap alignBlock="center">
                  <Box className="relative min-w-0 w-full flex-none sm:w-auto sm:flex-1">
                    <Input
                      aria-label="Search implementation library"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search name, control, owner or technology…"
                      className="w-full"
                    />
                  </Box>
                  <Select value={family} onValueChange={(value) => setFamily(String(value))}>
                    <SelectTrigger aria-label="Filter control family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All families">All families</SelectItem>
                      {families.map((item) => (
                        <SelectItem value={item} key={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
                    <SelectTrigger aria-label="Sort library">
                      <SelectValue>
                        {sort === "name"
                          ? "Name"
                          : sort === "controls"
                            ? "Most controls"
                            : "Most reused"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="controls">Most controls</SelectItem>
                      <SelectItem value="consumers">Most reused</SelectItem>
                    </SelectContent>
                  </Select>
                </Inline>

                <Inline spread="space-between" alignBlock="center" shouldWrap space="space.100">
                  <Text size="small" color="color.text.subtle">
                    {filtered.length} of {sources.length} sources · exact versions selected for
                    reuse
                  </Text>
                  {(query || family !== "All families" || category !== "All") && (
                    <Button
                      variant="link"
                      onClick={() => {
                        setQuery("");
                        setFamily("All families");
                        setCategory("All");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </Inline>

                <Table
                  label="Implementation library sources"
                  density="compact"
                  style={{ minWidth: 730 }}
                >
                  <thead>
                    <tr>
                      <Table.Selection
                        header
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected && !allVisibleSelected}
                        label="Select all visible sources"
                        onCheckedChange={(checked) =>
                          filtered
                            .filter((source) => checked !== selectedIds.includes(source.id))
                            .forEach((source) => onToggleSource(source.id))
                        }
                      />
                      <Table.Header
                        width={270}
                        sort={sort === "name" ? "asc" : undefined}
                        onSort={() => setSort("name")}
                      >
                        Source / version
                      </Table.Header>
                      <Table.Header
                        width={105}
                        sort={sort === "controls" ? "desc" : undefined}
                        onSort={() => setSort("controls")}
                      >
                        Controls
                      </Table.Header>
                      <Table.Header
                        width={85}
                        sort={sort === "consumers" ? "desc" : undefined}
                        onSort={() => setSort("consumers")}
                      >
                        Consumers
                      </Table.Header>
                      <Table.Header width={100}>Evidence</Table.Header>
                      <Table.Header width={145}>State</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((source) => (
                      <Table.Row key={source.id} isSelected={selectedIds.includes(source.id)}>
                        <Table.Selection
                          checked={selectedIds.includes(source.id)}
                          label={`${selectedIds.includes(source.id) ? "Remove" : "Add"} ${source.name} ${source.version}`}
                          onCheckedChange={() => onToggleSource(source.id)}
                        />
                        <Table.Cell className="py-100">
                          <Stack space="space.025" className="min-w-0">
                            <Button
                              variant="link"
                              onClick={() => onOpenSource(source.id)}
                              className="max-w-full justify-start"
                            >
                              <Text className="truncate">{source.name}</Text>
                            </Button>
                            <Inline space="space.075" alignBlock="center">
                              <CategoryIcon category={source.category} />
                              <Text size="small" color="color.text.subtle" className="truncate">
                                {source.version} · {source.kind}
                              </Text>
                            </Inline>
                          </Stack>
                        </Table.Cell>
                        <Table.Cell>
                          <Stack space="space.025">
                            <Text weight="medium">{source.controlIds.length}</Text>
                            <Text size="small" color="color.text.subtle" className="truncate">
                              {source.families.join(" · ")}
                            </Text>
                          </Stack>
                        </Table.Cell>
                        <Table.Cell>
                          <Text>{source.consumers.length}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Stack space="space.025">
                            <Text>{source.evidence.length} artifacts</Text>
                            <Text size="small" color="color.text.subtle">
                              {source.requirements.length} requirements
                            </Text>
                          </Stack>
                        </Table.Cell>
                        <Table.Cell>
                          <SourceState source={source} />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
                {!filtered.length && (
                  <Box padding="space.300" className="border border-default rounded-medium">
                    <Stack space="space.100">
                      <Heading size="xsmall">No matching implementations</Heading>
                      <Text as="p" color="color.text.subtle">
                        Try a product name, an owner, a control such as AU-2, or clear the active
                        filters.
                      </Text>
                      <Button
                        variant="link"
                        onClick={() => {
                          setQuery("");
                          setFamily("All families");
                          setCategory("All");
                        }}
                      >
                        Show all sources
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </TabsContent>
          </Tabs>
        </Stack>

        <Box
          as="aside"
          padding="space.200"
          className="border border-default rounded-medium bg-surface-sunken min-w-0 xl:sticky xl:top-200"
          aria-label="Program source selection"
        >
          <Stack space="space.200">
            <Section title="Program selection" count={selected.length}>
              <Text as="p" size="small" color="color.text.subtle" className="pt-100">
                Assemble the reusable foundation, then choose exactly where each contribution
                applies.
              </Text>
            </Section>
            {selected.length ? (
              <>
                <Stack space="space.150">
                  {categories.map((item) => {
                    const members = selected.filter((source) => source.category === item);
                    if (!members.length) return null;
                    return (
                      <Stack key={item} space="space.100">
                        <Inline space="space.075" alignBlock="center">
                          <CategoryIcon category={item} />
                          <Text size="small" weight="medium">
                            {item}
                          </Text>
                          <Count value={members.length} />
                        </Inline>
                        {members.map((source) => (
                          <Inline
                            key={source.id}
                            spread="space-between"
                            alignBlock="start"
                            space="space.100"
                          >
                            <Stack space="space.025" className="min-w-0">
                              <Button
                                variant="link"
                                onClick={() => onOpenSource(source.id)}
                                className="max-w-full justify-start whitespace-normal text-start"
                              >
                                {source.name}
                              </Button>
                              <Text size="small" color="color.text.subtle">
                                {source.version} · {source.controlIds.length} controls
                              </Text>
                            </Stack>
                            <Button
                              variant="subtle"
                              size="xsmall"
                              aria-label={`Remove ${source.name} from selection`}
                              iconBefore={<X />}
                              onClick={() => onToggleSource(source.id)}
                            />
                          </Inline>
                        ))}
                      </Stack>
                    );
                  })}
                </Stack>
                <Box paddingBlockStart="space.150" className="border-t border-default">
                  <Stack space="space.075">
                    <Inline spread="space-between">
                      <Text size="small">Unique mapped controls</Text>
                      <Text size="small" weight="medium">
                        {controls.size}
                      </Text>
                    </Inline>
                    <Inline spread="space-between">
                      <Text size="small">Reusable requirements</Text>
                      <Text size="small" weight="medium">
                        {requirementsCount}
                      </Text>
                    </Inline>
                    <Inline spread="space-between">
                      <Text size="small">Supporting artifacts</Text>
                      <Text size="small" weight="medium">
                        {evidenceCount}
                      </Text>
                    </Inline>
                  </Stack>
                </Box>
                <Text as="p" size="small" color="color.text.subtle">
                  Overlapping sources stay together. Program configuration determines the
                  contribution from each.
                </Text>
              </>
            ) : (
              <Stack space="space.100">
                <Layers3 aria-hidden className="size-icon-medium icon-subtle" />
                <Text as="p" size="small" color="color.text.subtle">
                  Select corporate policies, product versions and host capabilities to start a
                  program foundation.
                </Text>
              </Stack>
            )}
            <Button
              variant="primary"
              isFullWidth
              disabled={!selected.length}
              iconAfter={<ArrowRight />}
              onClick={onBuild}
            >
              Build program
            </Button>
            <Text as="p" size="xsmall" color="color.text.subtle">
              Selection proposes reuse. Acceptance happens after scope and local responsibilities
              are reviewed.
            </Text>
          </Stack>
        </Box>
      </Grid>
    </Stack>
  );
}

type SourceDetailViewProps = {
  source: Source;
  onBack: () => void;
  onToggleSource: () => void;
  selected: boolean;
  onOpenConsumers: () => void;
};

export function SourceDetailView({
  source,
  onBack,
  onToggleSource,
  selected,
  onOpenConsumers,
}: SourceDetailViewProps) {
  const [tab, setTab] = useState("implementation");
  const [requirementQuery, setRequirementQuery] = useState("");
  useEffect(() => {
    setTab("implementation");
    setRequirementQuery("");
  }, [source.id]);
  const requirements = source.requirements.filter((requirement) =>
    `${requirement.id} ${requirement.text} ${requirement.controlIds.join(" ")}`
      .toLowerCase()
      .includes(requirementQuery.toLowerCase()),
  );
  return (
    <Stack space="space.300" className="min-w-0">
      <Inline spread="space-between" shouldWrap space="space.100" alignBlock="center">
        <Button variant="link" iconBefore={<ArrowLeft />} onClick={onBack}>
          Implementation library
        </Button>
        <Button
          variant={selected ? "secondary" : "primary"}
          iconBefore={selected ? <Check /> : <Plus />}
          onClick={onToggleSource}
        >
          {selected ? "Remove from program selection" : "Add to program selection"}
        </Button>
      </Inline>
      <PageHeader
        eyebrow={`${source.category} / ${source.kind}`}
        title={source.name}
        description={source.summary}
      />
      <Inline alignBlock="center" space="space.150" shouldWrap>
        <Badge variant="secondary">{source.version}</Badge>
        <SourceState source={source} />
        <Text size="small" color="color.text.subtle">
          Maintained by {source.owner}
        </Text>
      </Inline>
      {source.status === "Update available" && (
        <Box
          padding="space.150"
          className="bg-information border border-information rounded-medium"
        >
          <Text as="p" size="small">
            A newer source version is available. Programs keep their accepted version until they
            review and accept the changes; a new release alone does not invalidate this version.
          </Text>
        </Box>
      )}
      {source.status === "Review due" && (
        <Box padding="space.150" className="bg-warning border border-warning rounded-medium">
          <Text as="p" size="small">
            The source review is due. Confirm continued applicability and evidence currency before
            accepting new program assignments.
          </Text>
        </Box>
      )}
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <Box className="overflow-x-auto">
          <TabsList variant="line" aria-label="Master source record" className="justify-start">
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
            <TabsTrigger value="requirements">
              Requirements <Count value={source.requirements.length} />
            </TabsTrigger>
            <TabsTrigger value="evidence">
              Evidence <Count value={source.evidence.length} />
            </TabsTrigger>
            <TabsTrigger value="consumers">
              Consumers <Count value={source.consumers.length} />
            </TabsTrigger>
          </TabsList>
        </Box>
        <TabsContent value="implementation" className="pt-300">
          <Grid
            templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(240px, 1fr)" }}
            gap="space.300"
            alignItems="start"
          >
            <Stack space="space.300" className="min-w-0">
              <Section
                title="Master implementation"
                description="Published narrative · reused by every accepted assignment"
              >
                <Stack space="space.150" className="pt-150">
                  <Text as="p">{source.narrative}</Text>
                  <Box padding="space.150" className="bg-surface-sunken border-l border-default">
                    <Text as="p" size="small" color="color.text.subtle">
                      This narrative stays connected to {source.name} {source.version}. Each program
                      records its installed configuration, integration details and remaining
                      responsibilities alongside it.
                    </Text>
                  </Box>
                </Stack>
              </Section>
              <Section
                title="Applicability and consumer responsibilities"
                count={source.conditions.length}
              >
                <Stack as="ol" space="space.150" className="pt-150">
                  {source.conditions.map((condition, index) => (
                    <Inline as="li" key={condition} space="space.150" alignBlock="start">
                      <Count value={index + 1} />
                      <Text as="p">{condition}</Text>
                    </Inline>
                  ))}
                </Stack>
              </Section>
              <Section title="Control mappings" count={source.controlIds.length}>
                <Stack space="space.150" className="pt-150">
                  {source.families.map((family) => (
                    <Inline key={family} space="space.150" alignBlock="start" shouldWrap>
                      <Text size="small" weight="medium" className="pt-025">
                        {family}
                      </Text>
                      <Inline space="space.075" shouldWrap>
                        {source.controlIds
                          .filter((id) => id.split("-")[0] === family)
                          .map((id) => (
                            <Badge key={id} variant="secondary" size="small">
                              {id}
                            </Badge>
                          ))}
                      </Inline>
                    </Inline>
                  ))}
                </Stack>
              </Section>
            </Stack>
            <Stack space="space.300" className="min-w-0">
              <Section title="Source record">
                <Stack space="space.150" className="pt-150">
                  <Stack space="space.025">
                    <Text size="small" color="color.text.subtle">
                      Version
                    </Text>
                    <Text>{source.version}</Text>
                  </Stack>
                  <Stack space="space.025">
                    <Text size="small" color="color.text.subtle">
                      Accountable owner
                    </Text>
                    <Text>{source.owner}</Text>
                  </Stack>
                  <Stack space="space.025">
                    <Text size="small" color="color.text.subtle">
                      Source type
                    </Text>
                    <Text>
                      {source.category} · {source.kind}
                    </Text>
                  </Stack>
                  <Stack space="space.025">
                    <Text size="small" color="color.text.subtle">
                      Reusable package
                    </Text>
                    <Text>
                      {source.requirements.length} requirements · {source.evidence.length} artifacts
                    </Text>
                  </Stack>
                </Stack>
              </Section>
              <Section
                title="Used across programs"
                count={source.consumers.length}
                action={
                  <Button variant="link" onClick={() => setTab("consumers")}>
                    View all
                  </Button>
                }
              >
                <Stack space="space.100" className="pt-150">
                  {source.consumers.slice(0, 4).map((consumer) => (
                    <Text as="p" key={consumer} size="small">
                      {consumer}
                    </Text>
                  ))}
                  {source.consumers.length > 4 && (
                    <Text size="small" color="color.text.subtle">
                      +{source.consumers.length - 4} additional consumers
                    </Text>
                  )}
                </Stack>
              </Section>
            </Stack>
          </Grid>
        </TabsContent>
        <TabsContent value="requirements" className="pt-300">
          <Stack space="space.200" className="min-w-0">
            <Section
              title="Reusable requirements"
              count={source.requirements.length}
              description="One requirement can contribute to several controls; program acceptance is scoped to each target."
            >
              <Box paddingBlockStart="space.150">
                <Input
                  value={requirementQuery}
                  onChange={(event) => setRequirementQuery(event.target.value)}
                  placeholder="Search requirements or mapped controls…"
                  aria-label="Search source requirements"
                  className="w-full"
                />
              </Box>
            </Section>
            <Table label={`${source.name} reusable requirements`} style={{ minWidth: 610 }}>
              <thead>
                <tr>
                  <Table.Header width={120}>Requirement</Table.Header>
                  <Table.Header width={330}>Statement</Table.Header>
                  <Table.Header width={190}>Contributes to</Table.Header>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => (
                  <Table.Row key={requirement.id}>
                    <Table.Cell>
                      <Text size="small" weight="medium">
                        {requirement.id}
                      </Text>
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal py-150">
                      <Text as="p">{requirement.text}</Text>
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal py-150">
                      <Inline space="space.050" shouldWrap>
                        {requirement.controlIds.map((id) => (
                          <Badge key={id} variant="secondary" size="xsmall">
                            {id}
                          </Badge>
                        ))}
                      </Inline>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </tbody>
            </Table>
            {!requirements.length && (
              <Text color="color.text.subtle">No requirements match this search.</Text>
            )}
          </Stack>
        </TabsContent>
        <TabsContent value="evidence" className="pt-300">
          <Section
            title="Supporting evidence"
            count={source.evidence.length}
            description={`Evidence published with ${source.version}. Local integration evidence belongs to the consuming program.`}
          >
            <Table label={`${source.name} supporting evidence`} style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <Table.Header width={120}>Record</Table.Header>
                  <Table.Header width={320}>Artifact</Table.Header>
                  <Table.Header width={150}>Type</Table.Header>
                  <Table.Header width={110}>Date</Table.Header>
                </tr>
              </thead>
              <tbody>
                {source.evidence.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>
                      <Text size="small">{item.id}</Text>
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal py-150">
                      <Text weight="medium">{item.title}</Text>
                    </Table.Cell>
                    <Table.Cell>{item.kind}</Table.Cell>
                    <Table.Cell>{item.date}</Table.Cell>
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          </Section>
        </TabsContent>
        <TabsContent value="consumers" className="pt-300">
          <Stack space="space.300">
            <Section
              title="Program consumers"
              count={source.consumers.length}
              description="Trace the programs and systems that reuse this master record."
              action={
                <Button variant="link" onClick={onOpenConsumers}>
                  Open change impact
                </Button>
              }
            >
              <Table label={`${source.name} program consumers`} style={{ minWidth: 570 }}>
                <thead>
                  <tr>
                    <Table.Header width={310}>Program / target</Table.Header>
                    <Table.Header width={130}>Source version</Table.Header>
                    <Table.Header width={180}>Local implementation</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {source.consumers.map((consumer) => (
                    <Table.Row key={consumer}>
                      <Table.Cell className="whitespace-normal py-150">
                        <Text weight="medium">{consumer}</Text>
                      </Table.Cell>
                      <Table.Cell>{source.version}</Table.Cell>
                      <Table.Cell>
                        <Text size="small" color="color.text.subtle">
                          Maintained by program
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            </Section>
            <Box
              padding="space.150"
              className="bg-surface-sunken border border-default rounded-medium"
            >
              <Text as="p" size="small">
                Publishing a source change creates an impact review for consumers. Their pinned
                source, local narrative and acceptance record remain intact until a program adopts
                the change.
              </Text>
            </Box>
          </Stack>
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
