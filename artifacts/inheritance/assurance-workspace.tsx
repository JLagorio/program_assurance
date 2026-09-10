import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, Building2, Boxes, GitBranch, Layers3, Plus } from "lucide-react";
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
  FieldLabel,
  Grid,
  Inline,
  PageHeader,
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
  Tree,
} from "@ledger/design-system";
import {
  objects,
  controls,
  programs,
  initialInstances,
  initialProfiles,
  initialDecisions,
} from "./assurance-data";
import {
  decisionKey,
  emptyDecision,
  type AssuranceObject,
  type ConsumerDecision,
  type ProgramInstance,
  type ProfileAssignment,
} from "./assurance-model";
import { ObjectWorkspace } from "./object-workspace";
import { ProgramWorkspace } from "./program-workspace";

type Domain = "products" | "organization" | "programs";
const isProfile = (object: AssuranceObject) =>
  object.kind === "Organizational profile" || object.kind === "Overlay";
const objectById = new Map(objects.map((object) => [object.id, object]));
const presentation = { structure: "Expanded" };

function Picker({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: string;
  choices: { value: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select items={choices} value={value} onValueChange={(id) => id && onChange(id)}>
        <SelectTrigger aria-label={label} className="w-full">
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

function AssuranceVision() {
  const [domain, setDomain] = useState<Domain>("products");
  const [objectId, setObjectId] = useState("system-a");
  const [productRoot, setProductRoot] = useState("system-a");
  const [profileId, setProfileId] = useState("company-a");
  const [programId, setProgramId] = useState("alpha");
  const [directory, setDirectory] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [instances, setInstances] = useState(initialInstances);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [decisions, setDecisions] = useState(initialDecisions);
  const [pendingObject, setPendingObject] = useState<string | null>(null);
  const [destination, setDestination] = useState("alpha");
  const [destinationTargets, setDestinationTargets] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const products = objects.filter((object) => !isProfile(object));
  const organizational = objects.filter(isProfile);
  const selected = objectById.get(domain === "organization" ? profileId : objectId)!;
  const program = programs.find((item) => item.id === programId)!;
  const subtree = (id: string): string[] => [
    id,
    ...(objectById.get(id)?.children ?? []).flatMap((child) => subtree(child.objectId)),
  ];

  function openObject(id: string) {
    const object = objectById.get(id)!;
    if (isProfile(object)) {
      setDomain("organization");
      setProfileId(id);
    } else {
      setDomain("products");
      setObjectId(id);
      if (domain !== "products" || !subtree(productRoot).includes(id)) setProductRoot(id);
    }
    setDirectory(false);
    setMessage("");
    setPendingObject(null);
  }
  function openProgram(id: string) {
    setProgramId(id);
    setDomain("programs");
    setMessage("");
    setPendingObject(null);
  }
  function switchDomain(next: Domain) {
    setDomain(next);
    setDirectory(false);
    setPendingObject(null);
    setMessage("");
  }
  function beginUse(id: string) {
    setPendingObject(id);
    setDestination(programId);
    setDestinationTargets(
      instances
        .filter((item) => item.programId === programId && item.role !== "Host")
        .map((item) => item.id),
    );
    setMessage("");
  }
  function addProduct(id: string, toProgram = programId) {
    const object = objectById.get(id)!;
    const existing = instances.filter(
      (item) => item.programId === toProgram && !item.parentInstanceId && item.productId === id,
    ).length;
    const serial = instances.length + 1;
    const additions: ProgramInstance[] = [];
    function addTree(objectId: string, path: string, name: string, parentInstanceId?: string) {
      const item = objectById.get(objectId)!;
      const instance: ProgramInstance = {
        id: `${toProgram}-use-${serial}-${path}`,
        programId: toProgram,
        productId: objectId,
        name,
        role: item.kind === "Host platform" ? "Host" : "Product",
        applicableControlIds: item.controls
          .filter((control) => control.applicability === "Applicable")
          .map((control) => control.id),
        ...(parentInstanceId ? { parentInstanceId } : {}),
      };
      additions.push(instance);
      item.children.forEach((child, index) =>
        addTree(
          child.objectId,
          `${path}-${index + 1}`,
          `${child.slot} · ${child.label}`,
          instance.id,
        ),
      );
    }
    addTree(
      id,
      "root",
      `${object.name}${existing ? ` · ${String(existing + 1).padStart(2, "0")}` : ""}`,
    );
    setInstances((previous) => [...previous, ...additions]);
    setMessage(
      `${object.name} added to ${programs.find((item) => item.id === toProgram)!.name} · ${additions.length} elements`,
    );
  }
  function addProfile(id: string, targetIds: string[], toProgram = programId) {
    const object = objectById.get(id)!;
    const validTargets = targetIds.filter((id) =>
      instances.some((instance) => instance.id === id && instance.programId === toProgram),
    );
    if (!validTargets.length) {
      setMessage("Select at least one element.");
      return false;
    }
    if (
      object.baseProfileId &&
      !profiles.some(
        (profile) =>
          profile.programId === toProgram &&
          profile.profileId === object.baseProfileId &&
          validTargets.every((id) => profile.targetInstanceIds.includes(id)),
      )
    ) {
      setMessage(
        `Assign ${objectById.get(object.baseProfileId)!.name} to the selected elements first.`,
      );
      return false;
    }
    setProfiles((previous) => {
      const existing = previous.find(
        (item) => item.programId === toProgram && item.profileId === id,
      );
      if (existing)
        return previous.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                targetInstanceIds: [...new Set([...item.targetInstanceIds, ...validTargets])],
              }
            : item,
        );
      const addition: ProfileAssignment = {
        id: `${toProgram}-profile-${previous.length + 1}`,
        programId: toProgram,
        profileId: id,
        targetInstanceIds: validTargets,
      };
      return [...previous, addition];
    });
    setMessage(`${object.name} assigned · ${validTargets.length} elements`);
    return true;
  }
  function finishUse() {
    const object = objectById.get(pendingObject!)!;
    if (isProfile(object)) {
      if (!addProfile(object.id, destinationTargets, destination)) return;
    } else addProduct(object.id, destination);
    setPendingObject(null);
    setProgramId(destination);
    setDomain("programs");
  }
  function updateDecision(instanceId: string, controlId: string, patch: Partial<ConsumerDecision>) {
    const key = decisionKey(programId, instanceId, controlId);
    setDecisions((previous) => ({
      ...previous,
      [key]: { ...(previous[key] ?? emptyDecision()), ...patch },
    }));
  }
  function catalogDirectory() {
    const list = domain === "organization" ? organizational : products;
    return (
      <Stack space="space.300">
        <PageHeader
          title={
            domain === "organization" ? "Organizational profiles & overlays" : "Product catalog"
          }
        />
        <Table
          label={
            domain === "organization"
              ? "Organizational profile directory"
              : "Product catalog directory"
          }
          style={{ minWidth: 720 }}
        >
          <thead>
            <tr>
              <Table.Header>Name / version</Table.Header>
              <Table.Header>Type</Table.Header>
              <Table.Header>Controls</Table.Header>
              <Table.Header>Latest assessment</Table.Header>
              <Table.Header>Use</Table.Header>
            </tr>
          </thead>
          <tbody>
            {list.map((object) => {
              const applicable = object.controls.filter(
                (control) => control.applicability === "Applicable",
              );
              const satisfied = applicable.filter(
                (control) => control.status === "Satisfied",
              ).length;
              return (
                <Table.Row key={object.id}>
                  <Table.Cell>
                    <Stack space="space.050" className="py-100">
                      <Button variant="link" size="small" onClick={() => openObject(object.id)}>
                        {object.name}
                      </Button>
                      <Text size="small" color="color.text.subtle">
                        {object.version} · {object.owner}
                      </Text>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell>
                    <Stack space="space.050">
                      <Text>{object.kind}</Text>
                      <Text size="small" color="color.text.subtle">
                        {object.children.length
                          ? `${object.children.length} direct children`
                          : object.baseProfileId
                            ? `Extends ${objectById.get(object.baseProfileId)!.name}`
                            : null}
                      </Text>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>
                      {satisfied} / {applicable.length} satisfied
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Stack space="space.050">
                      <Text>{object.assessments[0]?.date ?? "Not started"}</Text>
                      <Badge variant="secondary">
                        {object.assessments[0]?.result ?? "Not assessed"}
                      </Badge>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="subtle"
                      size="small"
                      aria-label={`Use ${object.name} in a program`}
                      onClick={() => beginUse(object.id)}
                      iconBefore={<Plus />}
                    >
                      Use
                    </Button>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      </Stack>
    );
  }
  function structure() {
    const rows: { object: AssuranceObject; level: number; key: string; label: string }[] = [];
    function flatten(id: string, level: number, key: string, label?: string) {
      const object = objectById.get(id)!;
      rows.push({ object, level, key, label: label ?? object.name });
      if (!collapsed.includes(key))
        object.children.forEach((child) =>
          flatten(
            child.objectId,
            level + 1,
            `${key}/${child.slot}`,
            `${child.slot} · ${child.label}`,
          ),
        );
    }
    if (domain === "products") flatten(productRoot, 1, productRoot);
    const parents = objects.filter((item) =>
      item.children.some((child) => child.objectId === selected.id),
    );
    return (
      <Stack space="space.300" className="min-w-0">
        {domain === "products" ? (
          <>
            <Picker
              label="Catalog object"
              value={productRoot}
              choices={products.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.version}`,
              }))}
              onChange={(id) => {
                setProductRoot(id);
                setObjectId(id);
                setCollapsed([]);
              }}
            />
            <Section title="Product structure" count={subtree(productRoot).length}>
              <Tree
                label="Catalog product structure"
                size={presentation.structure === "Compact" ? "xsmall" : "small"}
                className="mt-150"
              >
                {rows.map(({ object, level, key, label }) => (
                  <Tree.Item
                    key={key}
                    depth={level - 1}
                    isSelected={object.id === objectId}
                    hasChildren={object.children.length > 0}
                    expanded={!collapsed.includes(key)}
                    onToggle={() =>
                      setCollapsed((previous) =>
                        previous.includes(key)
                          ? previous.filter((id) => id !== key)
                          : [...previous, key],
                      )
                    }
                    onSelect={() => {
                      setObjectId(object.id);
                      setMessage("");
                      setPendingObject(null);
                    }}
                    trailing={
                      <Text size="small" color="color.text.subtle">
                        {object.version}
                      </Text>
                    }
                  >
                    <Text className="truncate">{label}</Text>
                  </Tree.Item>
                ))}
              </Tree>
            </Section>
            {parents.length > 0 && (
              <Section title="Used in">
                <Stack space="space.100" className="pt-150">
                  {parents.map((parent) => (
                    <Button
                      key={parent.id}
                      variant="link"
                      size="small"
                      iconBefore={<GitBranch />}
                      onClick={() => {
                        setProductRoot(parent.id);
                        setObjectId(parent.id);
                      }}
                    >
                      {parent.name} · {parent.version}
                    </Button>
                  ))}
                </Stack>
              </Section>
            )}
          </>
        ) : (
          <>
            <Section
              title="Company profiles"
              count={organizational.filter((item) => !item.baseProfileId).length}
            >
              <Stack space="space.100" className="pt-150">
                {organizational
                  .filter((item) => !item.baseProfileId)
                  .map((item) => (
                    <Button
                      key={item.id}
                      variant={item.id === profileId ? "secondary" : "subtle"}
                      onClick={() => setProfileId(item.id)}
                      className="w-full justify-start"
                      iconBefore={<Building2 />}
                    >
                      {item.name}
                    </Button>
                  ))}
              </Stack>
            </Section>
            <Section
              title="Overlays"
              count={organizational.filter((item) => item.baseProfileId).length}
            >
              <Stack space="space.100" className="pt-150">
                {organizational
                  .filter((item) => item.baseProfileId)
                  .map((item) => (
                    <Button
                      key={item.id}
                      variant={item.id === profileId ? "secondary" : "subtle"}
                      onClick={() => setProfileId(item.id)}
                      className="w-full justify-start"
                      iconBefore={<Layers3 />}
                    >
                      {item.name}
                    </Button>
                  ))}
              </Stack>
            </Section>
          </>
        )}
        <Button
          variant="link"
          size="small"
          onClick={() => setDirectory(true)}
          iconBefore={<Boxes />}
        >
          Browse all {domain === "products" ? "products" : "profiles"}
        </Button>
      </Stack>
    );
  }
  function usePanel() {
    const object = objectById.get(pendingObject!)!;
    return (
      <Section
        title={`${isProfile(object) ? "Assign" : "Add"} ${object.name} · ${object.version}`}
        count={isProfile(object) ? destinationTargets.length : subtree(object.id).length}
      >
        <Stack space="space.200" className="pt-200">
          <Picker
            label="Destination program"
            value={destination}
            choices={programs.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(id) => {
              setDestination(id);
              setDestinationTargets(
                instances
                  .filter((item) => item.programId === id && item.role !== "Host")
                  .map((item) => item.id),
              );
            }}
          />
          {isProfile(object) && (
            <Grid
              templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
              gap="space.100"
            >
              {instances
                .filter((item) => item.programId === destination && item.role !== "Host")
                .map((item) => (
                  <label key={item.id} className="flex items-center gap-100">
                    <Checkbox
                      aria-label={item.name}
                      checked={destinationTargets.includes(item.id)}
                      onCheckedChange={(value) =>
                        setDestinationTargets((previous) =>
                          value
                            ? [...new Set([...previous, item.id])]
                            : previous.filter((id) => id !== item.id),
                        )
                      }
                    />
                    <Text>{item.name}</Text>
                  </label>
                ))}
            </Grid>
          )}
          <Inline shouldWrap space="space.100">
            <Button variant="primary" size="small" onClick={finishUse} iconAfter={<ArrowRight />}>
              {isProfile(object) ? "Assign profile to program" : "Add product to program"}
            </Button>
            <Button variant="subtle" size="small" onClick={() => setPendingObject(null)}>
              Cancel
            </Button>
          </Inline>
        </Stack>
      </Section>
    );
  }
  return (
    <Box className="min-w-0 w-full bg-surface text-default font-sans">
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.AppLogo
            name="Equinox"
            secondaryName="Assurance"
            render={<button type="button" onClick={() => switchDomain("products")} />}
          />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <Inline space="space.100" alignBlock="center">
            <Text weight="medium">Assurance</Text>
          </Inline>
        </Shell.TopNav.Middle>
      </Shell.TopNav>
      <Tabs value={domain} onValueChange={(value) => switchDomain(value as Domain)}>
        <Box className="px-200 sm:px-300 border-b border-default">
          <TabsList variant="line" aria-label="Assurance domains" className="w-full justify-start">
            <TabsTrigger value="products">
              Product catalog <Count value={products.length} />
            </TabsTrigger>
            <TabsTrigger value="organization">
              Organization <Count value={organizational.length} />
            </TabsTrigger>
            <TabsTrigger value="programs">
              Programs <Count value={programs.length} />
            </TabsTrigger>
          </TabsList>
        </Box>
        {(["products", "organization", "programs"] as Domain[]).map((view) => (
          <TabsContent key={view} value={view}>
            <Box as="main" className="p-200 sm:p-300">
              <Stack space="space.300">
                {message && (
                  <Alert tone="information" role="status">
                    <AlertTitle>{message}</AlertTitle>
                  </Alert>
                )}
                {pendingObject && usePanel()}
                {view === "programs" ? (
                  <>
                    <Grid
                      templateColumns={{ base: "minmax(0,1fr)", sm: "minmax(0,1fr) minmax(0,2fr)" }}
                      gap="space.200"
                    >
                      <Picker
                        label="Program"
                        value={programId}
                        choices={programs.map((item) => ({ value: item.id, label: item.name }))}
                        onChange={(id) => {
                          setProgramId(id);
                          setMessage("");
                        }}
                      />
                    </Grid>
                    <ProgramWorkspace
                      program={program}
                      objects={objects}
                      controls={controls}
                      instances={instances.filter((item) => item.programId === programId)}
                      profiles={profiles.filter((item) => item.programId === programId)}
                      decisions={decisions}
                      onAddProduct={addProduct}
                      onAddProfile={addProfile}
                      onDecision={updateDecision}
                      onOpenObject={openObject}
                    />
                  </>
                ) : directory ? (
                  catalogDirectory()
                ) : (
                  <>
                    <Inline spread="space-between" alignBlock="center" shouldWrap space="space.100">
                      <Button
                        variant="link"
                        size="small"
                        onClick={() => setDirectory(true)}
                        iconBefore={<ArrowLeft />}
                      >
                        {view === "products" ? "Product catalog" : "Organizational profiles"}
                      </Button>
                    </Inline>
                    <Grid
                      templateColumns={{ base: "minmax(0,1fr)", md: "224px minmax(0,1fr)" }}
                      gap="space.300"
                    >
                      {structure()}
                      <Box className="min-w-0">
                        <ObjectWorkspace
                          object={{
                            ...selected,
                            consumers: [
                              ...new Set([
                                ...selected.consumers,
                                ...instances
                                  .filter((item) => item.productId === selected.id)
                                  .map((item) => item.programId),
                                ...profiles
                                  .filter((item) => item.profileId === selected.id)
                                  .map((item) => item.programId),
                              ]),
                            ],
                          }}
                          objects={objects}
                          controls={controls}
                          programs={programs}
                          onOpenObject={openObject}
                          onOpenProgram={openProgram}
                          onUseInProgram={beginUse}
                        />
                      </Box>
                    </Grid>
                  </>
                )}
              </Stack>
            </Box>
          </TabsContent>
        ))}
      </Tabs>
    </Box>
  );
}

export function mountAssuranceVision() {
  const container = document.getElementById("assurance-workflow-preview")!;
  const root = createRoot(container);
  const render = () => root.render(<AssuranceVision />);
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
    tweak.addSelect(presentation, "structure", {
      label: "Structure density",
      options: ["Expanded", "Compact"],
    });
  }
}
