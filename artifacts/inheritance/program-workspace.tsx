import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, GitBranch, Plus } from "lucide-react";
import {
  Alert,
  AlertTitle,
  Badge,
  Box,
  Button,
  Checkbox,
  Count,
  Field,
  FieldLabel,
  Grid,
  Id,
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
  Textarea,
  Tree,
} from "@ledger/design-system";
import {
  decisionKey,
  emptyDecision,
  type AssuranceObject,
  type ConsumerDecision,
  type ControlDefinition,
  type DecisionMap,
  type ObjectControl,
  type ProfileAssignment,
  type Program,
  type ProgramInstance,
} from "./assurance-model";

function ChoiceField({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: string;
  choices: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
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

function SourceAssessment({ result }: { result: string }) {
  return (
    <Badge
      variant="secondary"
      tone={result === "Satisfied" ? "success" : result === "Partial" ? "warning" : "neutral"}
    >
      {result}
    </Badge>
  );
}

export type ProgramWorkspaceProps = {
  program: Program;
  programs?: Program[];
  objects: AssuranceObject[];
  controls: ControlDefinition[];
  instances: ProgramInstance[];
  profiles: ProfileAssignment[];
  decisions: DecisionMap;
  onAddProduct: (productId: string) => void;
  onAddProfile: (profileId: string, targetInstanceIds: string[]) => boolean;
  onDecision: (instanceId: string, controlId: string, patch: Partial<ConsumerDecision>) => void;
  onOpenObject: (id: string) => void;
};

type SourceUse = {
  object: AssuranceObject;
  control: ObjectControl;
  origin: "Product" | "Profile" | "Host";
};

export function ProgramWorkspace({
  program,
  objects,
  controls,
  instances,
  profiles,
  decisions,
  onAddProduct,
  onAddProfile,
  onDecision,
  onOpenObject,
}: ProgramWorkspaceProps) {
  const [tab, setTab] = useState("composition");
  const [selectedInstanceId, setSelectedInstanceId] = useState(instances[0]?.id ?? "");
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState("implementation");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [builder, setBuilder] = useState<"product" | "profile" | null>(null);
  const [productChoice, setProductChoice] = useState(
    objects.find((item) => item.kind === "System")?.id ?? "",
  );
  const [profileChoice, setProfileChoice] = useState(
    objects.find((item) => item.kind === "Organizational profile")?.id ?? "",
  );
  const [profileTargets, setProfileTargets] = useState<string[]>(instances.map((item) => item.id));
  const [family, setFamily] = useState("All");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setSelectedInstanceId(instances[0]?.id ?? "");
    setSelectedControlId(null);
    setCollapsed([]);
    setProfileTargets(instances.map((item) => item.id));
    setBuilder(null);
    setNotice("");
  }, [program.id]);
  const objectMap = new Map(objects.map((item) => [item.id, item]));
  const selectedInstance = instances.find((item) => item.id === selectedInstanceId) ?? instances[0];
  const selectedObject = selectedInstance ? objectMap.get(selectedInstance.productId) : undefined;
  const productObjects = objects.filter(
    (item) => !["Organizational profile", "Overlay"].includes(item.kind),
  );
  const profileObjects = objects.filter((item) =>
    ["Organizational profile", "Overlay"].includes(item.kind),
  );
  const roots = instances.filter((item) => !item.parentInstanceId);
  const getDecision = (instanceId: string, controlId: string) =>
    decisions[decisionKey(program.id, instanceId, controlId)] ?? emptyDecision();
  const relatedHost = (instance: ProgramInstance): ProgramInstance | undefined => {
    if (instance.hostInstanceId)
      return instances.find((item) => item.id === instance.hostInstanceId);
    const parent = instances.find((item) => item.id === instance.parentInstanceId);
    return parent ? relatedHost(parent) : undefined;
  };
  const usesFor = (instance: ProgramInstance, controlId: string): SourceUse[] => {
    const product = objectMap.get(instance.productId);
    const record = product?.controls.find(
      (item) => item.id === controlId && item.applicability === "Applicable",
    );
    const productUses: SourceUse[] =
      product && record ? [{ object: product, control: record, origin: "Product" }] : [];
    const profileUses: SourceUse[] = profiles
      .filter((assignment) => assignment.targetInstanceIds.includes(instance.id))
      .flatMap((assignment) => {
        const profile = objectMap.get(assignment.profileId);
        const profileControl = profile?.controls.find(
          (item) => item.id === controlId && item.applicability === "Applicable",
        );
        return profile && profileControl
          ? [{ object: profile, control: profileControl, origin: "Profile" as const }]
          : [];
      });
    const host = relatedHost(instance);
    const hostObject = host ? objectMap.get(host.productId) : undefined;
    const hostControl = hostObject?.controls.find(
      (item) => item.id === controlId && item.applicability === "Applicable",
    );
    const hostUses: SourceUse[] =
      hostObject && hostControl
        ? [{ object: hostObject, control: hostControl, origin: "Host" }]
        : [];
    return [...productUses, ...profileUses, ...hostUses];
  };
  const controlsFor = (instance: ProgramInstance) =>
    controls.filter(
      (control) =>
        instance.applicableControlIds?.includes(control.id) ||
        usesFor(instance, control.id).length > 0,
    );
  const programPairs = instances.flatMap((instance) =>
    controlsFor(instance).map((control) => ({ instance, control })),
  );
  const needsConfirmation = programPairs.filter(({ instance, control }) => {
    const decision = getDecision(instance.id, control.id);
    return usesFor(instance, control.id).some(
      (use) =>
        !decision.confirmedSourceIds.includes(use.object.id) &&
        !decision.excludedSourceIds.includes(use.object.id),
    );
  }).length;
  const isPrepared = (decision: ConsumerDecision, candidates: SourceUse[]) =>
    decision.localComplete &&
    Boolean(decision.localNarrative.trim()) &&
    candidates.every(
      (use) =>
        decision.confirmedSourceIds.includes(use.object.id) ||
        decision.excludedSourceIds.includes(use.object.id),
    );
  const prepared = programPairs.filter(({ instance, control }) =>
    isPrepared(getDecision(instance.id, control.id), usesFor(instance, control.id)),
  ).length;
  const targetControls = selectedInstance ? controlsFor(selectedInstance) : [];
  const visibleControls = targetControls.filter(
    (control) => family === "All" || control.family === family,
  );
  const selectedControl = targetControls.find((item) => item.id === selectedControlId);
  const uses =
    selectedInstance && selectedControl ? usesFor(selectedInstance, selectedControl.id) : [];
  const currentDecision =
    selectedInstance && selectedControl
      ? getDecision(selectedInstance.id, selectedControl.id)
      : emptyDecision();
  const associatedProfiles = profiles.filter((item) =>
    item.targetInstanceIds.includes(selectedInstance?.id ?? ""),
  );
  const selectedProduct = objectMap.get(productChoice);
  const selectedProfile = objectMap.get(profileChoice);
  const subtreeCount = (id: string): number =>
    1 +
    (objectMap
      .get(id)
      ?.children.reduce((total, child) => total + subtreeCount(child.objectId), 0) ?? 0);
  const depth = (instance: ProgramInstance): number => {
    const parent = instances.find((item) => item.id === instance.parentInstanceId);
    return parent ? depth(parent) + 1 : 0;
  };
  const ordered = (parent?: string): ProgramInstance[] =>
    instances
      .filter((item) => item.parentInstanceId === parent)
      .flatMap((item) => [item, ...(collapsed.includes(item.id) ? [] : ordered(item.id))]);
  const selectInstance = (id: string) => {
    setSelectedInstanceId(id);
    setSelectedControlId(null);
    setFamily("All");
  };
  const updateDecision = (patch: Partial<ConsumerDecision>) => {
    if (selectedInstance && selectedControl)
      onDecision(selectedInstance.id, selectedControl.id, patch);
  };
  const applicability = (decision: ConsumerDecision, candidates: SourceUse[]) => {
    const accepted = candidates.filter((use) =>
      decision.confirmedSourceIds.includes(use.object.id),
    ).length;
    const pending = candidates.filter(
      (use) =>
        !decision.confirmedSourceIds.includes(use.object.id) &&
        !decision.excludedSourceIds.includes(use.object.id),
    ).length;
    return pending ? `${pending} to confirm` : accepted ? `${accepted} confirmed` : "Local only";
  };
  const viewControl = (id: string) => {
    setSelectedControlId(id);
    setDetailTab("implementation");
    setTab("assurance");
  };

  function InstanceTree() {
    return (
      <Section title="Product instances" count={instances.length}>
        <Tree label="Consumed product hierarchy" className="pt-150">
          {ordered().map((instance) => {
            const source = objectMap.get(instance.productId);
            return (
              <Tree.Item
                key={instance.id}
                depth={depth(instance)}
                isSelected={selectedInstance?.id === instance.id}
                onSelect={() => selectInstance(instance.id)}
                hasChildren={instances.some((item) => item.parentInstanceId === instance.id)}
                expanded={!collapsed.includes(instance.id)}
                onToggle={() =>
                  setCollapsed((previous) =>
                    previous.includes(instance.id)
                      ? previous.filter((id) => id !== instance.id)
                      : [...previous, instance.id],
                  )
                }
                trailing={
                  <Text size="xsmall" color="color.text.subtle">
                    v{source?.version}
                  </Text>
                }
              >
                <Text size="small" className="truncate">
                  {instance.name}
                </Text>
              </Tree.Item>
            );
          })}
        </Tree>
        <Stack space="space.100" className="pt-200">
          <Button
            variant="subtle"
            size="small"
            iconBefore={<Plus />}
            onClick={() => {
              setBuilder("product");
              setTab("composition");
            }}
          >
            Add product
          </Button>
          <Text size="small" color="color.text.subtle">
            {roots.length} products · {instances.length - roots.length} nested instances
          </Text>
        </Stack>
      </Section>
    );
  }

  function ConsumptionBuilder() {
    if (!builder) return null;
    return (
      <Section
        title={builder === "product" ? "Add product" : "Assign profile"}
        action={
          <Button variant="subtle" size="small" onClick={() => setBuilder(null)}>
            Close
          </Button>
        }
      >
        <Stack space="space.250" className="pt-200">
          {builder === "product" ? (
            <>
              <ChoiceField
                label="Product and release"
                value={productChoice}
                onChange={setProductChoice}
                choices={productObjects.map((item) => ({
                  value: item.id,
                  label: `${item.name} · v${item.version} · ${item.kind}`,
                }))}
              />
              {selectedProduct && (
                <Box
                  backgroundColor="color.background.neutral.subtle"
                  padding="space.200"
                  className="rounded-medium"
                >
                  <Stack space="space.100">
                    <Text weight="medium">
                      {selectedProduct.name} v{selectedProduct.version}
                    </Text>
                    <Text size="small" color="color.text.subtle">
                      {subtreeCount(selectedProduct.id)} instances
                    </Text>
                  </Stack>
                </Box>
              )}
              <Inline spread="space-between" alignBlock="center" space="space.150" shouldWrap>
                <Button
                  variant="link"
                  onClick={() => selectedProduct && onOpenObject(selectedProduct.id)}
                >
                  View product
                </Button>
                <Button
                  variant="primary"
                  iconBefore={<Plus />}
                  disabled={!selectedProduct}
                  onClick={() => {
                    onAddProduct(productChoice);
                    setBuilder(null);
                    setNotice("");
                  }}
                >
                  Add product
                </Button>
              </Inline>
            </>
          ) : (
            <>
              <ChoiceField
                label="Profile or overlay"
                value={profileChoice}
                onChange={setProfileChoice}
                choices={profileObjects.map((item) => ({
                  value: item.id,
                  label: `${item.name} · v${item.version}`,
                }))}
              />
              {selectedProfile?.baseProfileId && (
                <Text size="small" color="color.text.subtle">
                  Baseline: {objectMap.get(selectedProfile.baseProfileId)?.name}
                </Text>
              )}
              <Inline spread="space-between" alignBlock="center" shouldWrap>
                <Text weight="medium">Instances</Text>
                <Button
                  variant="subtle"
                  size="small"
                  onClick={() => setProfileTargets(instances.map((item) => item.id))}
                >
                  Select all
                </Button>
              </Inline>
              <Grid
                templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                gap="space.150"
              >
                {instances.map((instance) => (
                  <Field key={instance.id} orientation="horizontal">
                    <Checkbox
                      id={`profile-target-${instance.id}`}
                      checked={profileTargets.includes(instance.id)}
                      onCheckedChange={(checked) =>
                        setProfileTargets((previous) =>
                          checked
                            ? [...new Set([...previous, instance.id])]
                            : previous.filter((id) => id !== instance.id),
                        )
                      }
                    />
                    <FieldLabel htmlFor={`profile-target-${instance.id}`}>
                      {instance.name}
                    </FieldLabel>
                  </Field>
                ))}
              </Grid>
              <Inline spread="space-between" alignBlock="center" shouldWrap space="space.150">
                <Text size="small" color="color.text.subtle">
                  {profileTargets.length} selected
                </Text>
                <Button
                  variant="primary"
                  disabled={!profileChoice || !profileTargets.length}
                  onClick={() => {
                    if (onAddProfile(profileChoice, profileTargets)) {
                      setBuilder(null);
                      setNotice("");
                    }
                  }}
                >
                  Assign profile
                </Button>
              </Inline>
            </>
          )}
        </Stack>
      </Section>
    );
  }

  function Composition() {
    return (
      <Stack space="space.400">
        {ConsumptionBuilder()}
        <Section
          title="Products"
          count={roots.length}
          action={
            <Button
              variant="subtle"
              size="small"
              iconBefore={<Plus />}
              onClick={() => setBuilder("product")}
            >
              Add product
            </Button>
          }
        >
          <Table label="Consumed product releases" density="compact" style={{ minWidth: 650 }}>
            <thead>
              <tr>
                <Table.Header>Instance / product</Table.Header>
                <Table.Header width={95}>Version</Table.Header>
                <Table.Header width={100}>Structure</Table.Header>
                <Table.Header width={140}>Source assessment</Table.Header>
                <Table.Header width={100}>Program use</Table.Header>
              </tr>
            </thead>
            <tbody>
              {roots.map((instance) => {
                const source = objectMap.get(instance.productId);
                if (!source) return null;
                const sourceAssessment = source.assessments[0];
                const pairCount = controlsFor(instance).length;
                const pending = controlsFor(instance).filter((control) =>
                  usesFor(instance, control.id).some(
                    (use) =>
                      !getDecision(instance.id, control.id).confirmedSourceIds.includes(
                        use.object.id,
                      ) &&
                      !getDecision(instance.id, control.id).excludedSourceIds.includes(
                        use.object.id,
                      ),
                  ),
                ).length;
                return (
                  <Table.Row key={instance.id} isSelected={selectedInstance?.id === instance.id}>
                    <Table.Cell>
                      <Stack space="space.050" className="py-100">
                        <Button
                          variant="link"
                          size="small"
                          className="w-fit whitespace-normal text-left"
                          onClick={() => selectInstance(instance.id)}
                        >
                          {instance.name}
                        </Button>
                        <Inline space="space.100" shouldWrap>
                          <Text size="small" color="color.text.subtle">
                            {source.kind}
                          </Text>
                          <Button
                            variant="link"
                            size="small"
                            onClick={() => onOpenObject(source.id)}
                          >
                            Open {source.name}
                          </Button>
                        </Inline>
                        {relatedHost(instance) && (
                          <Text size="small" color="color.text.subtle">
                            Host: {relatedHost(instance)?.name}
                          </Text>
                        )}
                      </Stack>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="secondary">v{source.version}</Badge>
                    </Table.Cell>
                    <Table.Cell>{subtreeCount(source.id)} objects</Table.Cell>
                    <Table.Cell>
                      <Stack space="space.050">
                        <Text size="small">{sourceAssessment?.result ?? "Not assessed"}</Text>
                        <Text size="xsmall" color="color.text.subtle">
                          {sourceAssessment?.id ?? "—"}
                        </Text>
                      </Stack>
                    </Table.Cell>
                    <Table.Cell>
                      <Text
                        size="small"
                        color={pending ? "color.text.warning" : "color.text.subtle"}
                      >
                        {pending ? `${pending} to review` : `${pairCount} reviewed`}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </tbody>
          </Table>
        </Section>
        <Section
          title="Organizational profiles & overlays"
          count={profiles.length}
          action={
            <Button
              variant="subtle"
              size="small"
              iconBefore={<Plus />}
              onClick={() => {
                setProfileTargets(instances.map((item) => item.id));
                setBuilder("profile");
              }}
            >
              Assign profile
            </Button>
          }
        >
          <Table
            label="Consumed organizational profiles"
            density="compact"
            style={{ minWidth: 600 }}
          >
            <thead>
              <tr>
                <Table.Header>Profile / overlay</Table.Header>
                <Table.Header width={95}>Version</Table.Header>
                <Table.Header width={220}>Program scope</Table.Header>
                <Table.Header width={145}>Source assessment</Table.Header>
              </tr>
            </thead>
            <tbody>
              {profiles.map((assignment) => {
                const profile = objectMap.get(assignment.profileId);
                if (!profile) return null;
                return (
                  <Table.Row key={assignment.id}>
                    <Table.Cell>
                      <Stack space="space.050" className="py-100">
                        <Button
                          variant="link"
                          size="small"
                          className="w-fit whitespace-normal text-left"
                          onClick={() => onOpenObject(profile.id)}
                        >
                          {profile.name}
                        </Button>
                        <Text size="small" color="color.text.subtle">
                          {profile.baseProfileId
                            ? `Extends ${objectMap.get(profile.baseProfileId)?.name ?? "baseline"}`
                            : "Company baseline"}
                        </Text>
                      </Stack>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="secondary">v{profile.version}</Badge>
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal">
                      <Text as="p" size="small">
                        {assignment.targetInstanceIds.length} instances
                      </Text>
                      <Text as="p" size="xsmall" color="color.text.subtle">
                        {assignment.targetInstanceIds
                          .slice(0, 3)
                          .map((id) => instances.find((item) => item.id === id)?.name)
                          .join(", ")}
                        {assignment.targetInstanceIds.length > 3
                          ? ` +${assignment.targetInstanceIds.length - 3}`
                          : ""}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">{profile.assessments[0]?.result ?? "Not assessed"}</Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </tbody>
          </Table>
        </Section>
        <Grid
          templateColumns={{ base: "minmax(0,1fr)", md: "minmax(0,1fr) minmax(0,2fr)" }}
          gap="space.300"
        >
          {InstanceTree()}
          {selectedObject && selectedInstance && (
            <Section
              title={selectedInstance.name}
              action={<Badge variant="secondary">Program instance</Badge>}
            >
              <Stack space="space.250" className="pt-200">
                <Stack space="space.100">
                  <Inline space="space.100" shouldWrap alignBlock="center">
                    <GitBranch aria-hidden className="size-icon-medium icon-subtle" />
                    <Button variant="link" onClick={() => onOpenObject(selectedObject.id)}>
                      {selectedObject.name} v{selectedObject.version}
                    </Button>
                  </Inline>
                  {relatedHost(selectedInstance) && (
                    <Inline space="space.100" shouldWrap>
                      <Text size="small" color="color.text.subtle">
                        Host
                      </Text>
                      <Button
                        variant="link"
                        size="small"
                        onClick={() => onOpenObject(relatedHost(selectedInstance)!.productId)}
                      >
                        {relatedHost(selectedInstance)?.name}
                      </Button>
                    </Inline>
                  )}
                </Stack>
                <Inline space="space.250" shouldWrap>
                  <Text size="small">{targetControls.length} controls</Text>
                  <Text size="small">{associatedProfiles.length} profiles</Text>
                  <Text size="small">{selectedObject.evidence.length} evidence records</Text>
                </Inline>
                {selectedObject.children.length > 0 && (
                  <Table label="Nested source releases" density="compact" style={{ minWidth: 380 }}>
                    <thead>
                      <tr>
                        <Table.Header>Product</Table.Header>
                        <Table.Header width={100}>Release</Table.Header>
                        <Table.Header width={125}>Source assessment</Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedObject.children.map((child) => {
                        const source = objectMap.get(child.objectId);
                        return source ? (
                          <Table.Row key={child.slot}>
                            <Table.Cell>
                              <Button
                                variant="link"
                                size="small"
                                onClick={() => onOpenObject(source.id)}
                              >
                                {child.label}
                              </Button>
                            </Table.Cell>
                            <Table.Cell>v{source.version}</Table.Cell>
                            <Table.Cell>
                              {source.assessments[0]?.result ?? "Not assessed"}
                            </Table.Cell>
                          </Table.Row>
                        ) : null;
                      })}
                    </tbody>
                  </Table>
                )}
                <Button
                  variant="primary"
                  iconAfter={<ArrowRight />}
                  className="w-fit"
                  onClick={() => {
                    setTab("assurance");
                    setSelectedControlId(null);
                  }}
                >
                  Review controls
                </Button>
              </Stack>
            </Section>
          )}
        </Grid>
      </Stack>
    );
  }

  function ControlRegister() {
    if (!selectedInstance || !selectedObject) return null;
    return (
      <Section
        title={`${selectedInstance.name} · controls`}
        count={targetControls.length}
        description={`Source: ${selectedObject.name} v${selectedObject.version} · consumer: ${program.name}`}
        action={<Badge variant="secondary">Program not assessed</Badge>}
      >
        <Stack space="space.200" className="pt-200">
          <Inline spread="space-between" alignBlock="end" space="space.200" shouldWrap>
            <Box className="w-full sm:w-auto">
              <ChoiceField
                label="Control family"
                value={family}
                onChange={setFamily}
                choices={[
                  { value: "All", label: "All families" },
                  ...[...new Set(targetControls.map((item) => item.family))].map((id) => ({
                    value: id,
                    label: id,
                  })),
                ]}
              />
            </Box>
          </Inline>
          <Table label="Program control coverage" density="compact" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <Table.Header width={195}>Control</Table.Header>
                <Table.Header width={105}>Object result</Table.Header>
                <Table.Header width={105}>Other sources</Table.Header>
                <Table.Header width={100}>Source use</Table.Header>
                <Table.Header width={135}>Program work</Table.Header>
              </tr>
            </thead>
            <tbody>
              {visibleControls.map((control) => {
                const candidates = usesFor(selectedInstance, control.id);
                const decision = getDecision(selectedInstance.id, control.id);
                const product = candidates.find((use) => use.origin === "Product");
                const org = candidates.filter((use) => use.origin === "Profile");
                const host = candidates.some((use) => use.origin === "Host");
                return (
                  <Table.Row key={control.id}>
                    <Table.Cell>
                      <Stack space="space.025" className="py-075">
                        <Button
                          variant="link"
                          size="small"
                          className="w-fit"
                          aria-label={`Review ${control.id} for ${selectedInstance.name}`}
                          onClick={() => viewControl(control.id)}
                        >
                          <Id>{control.id}</Id>
                        </Button>
                        <Text size="small" color="color.text.subtle">
                          {control.title}
                        </Text>
                        {!product && (
                          <Text size="xsmall" color="color.text.warning">
                            {candidates.length ? "Context-specific" : "Local obligation"}
                          </Text>
                        )}
                      </Stack>
                    </Table.Cell>
                    <Table.Cell>
                      {product ? (
                        <SourceAssessment result={product.control.status} />
                      ) : (
                        <Text size="small" color="color.text.subtle">
                          —
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {org.length || host ? (
                        <Text size="small">
                          {[org.length ? `${org.length} org.` : "", host ? "Host" : ""]
                            .filter(Boolean)
                            .join(" + ")}
                        </Text>
                      ) : (
                        <Text size="small" color="color.text.subtle">
                          —
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text
                        size="small"
                        color={
                          applicability(decision, candidates).includes("to confirm")
                            ? "color.text.warning"
                            : "color.text.subtle"
                        }
                      >
                        {applicability(decision, candidates)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">
                        {isPrepared(decision, candidates)
                          ? "Ready for assessment"
                          : decision.localNarrative.trim()
                            ? "In progress"
                            : "Open"}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </tbody>
          </Table>
          <Text size="small" color="color.text.subtle">
            {visibleControls.length} controls
          </Text>
        </Stack>
      </Section>
    );
  }

  function ControlDetail() {
    if (!selectedInstance || !selectedObject || !selectedControl) return null;
    const programRequirements = program.requirements.filter((requirement) =>
      requirement.controlIds.includes(selectedControl.id),
    );
    const programEvidenceIds = new Set(
      programRequirements.flatMap((requirement) => requirement.evidenceIds),
    );
    const pendingUses = uses.filter(
      (use) =>
        !currentDecision.confirmedSourceIds.includes(use.object.id) &&
        !currentDecision.excludedSourceIds.includes(use.object.id),
    );
    const setSourceState = (sourceId: string, state: "confirmed" | "excluded" | "pending") => {
      updateDecision({
        localComplete: false,
        confirmedSourceIds:
          state === "confirmed"
            ? [...new Set([...currentDecision.confirmedSourceIds, sourceId])]
            : currentDecision.confirmedSourceIds.filter((id) => id !== sourceId),
        excludedSourceIds:
          state === "excluded"
            ? [...new Set([...currentDecision.excludedSourceIds, sourceId])]
            : currentDecision.excludedSourceIds.filter((id) => id !== sourceId),
      });
    };
    return (
      <Stack space="space.300">
        <Inline spread="space-between" alignBlock="center" shouldWrap space="space.150">
          <Button
            variant="subtle"
            size="small"
            iconBefore={<ArrowLeft />}
            onClick={() => setSelectedControlId(null)}
          >
            Control register
          </Button>
          <Badge variant="secondary">Program not assessed</Badge>
        </Inline>
        <Section
          title={`${selectedControl.id} · ${selectedControl.title}`}
          description={`${program.name} / ${selectedInstance.name}`}
        >
          <Stack space="space.200" className="pt-150">
            <Text>{selectedControl.objective}</Text>
            <Inline space="space.200" shouldWrap>
              <Text size="small">{uses.length} source records</Text>
              <Text size="small" color="color.text.subtle">
                {
                  currentDecision.confirmedSourceIds.filter((id) =>
                    uses.some((use) => use.object.id === id),
                  ).length
                }{" "}
                confirmed
              </Text>
              <Text size="small" color="color.text.subtle">
                {pendingUses.length} pending
              </Text>
            </Inline>
          </Stack>
        </Section>
        <Tabs value={detailTab} onValueChange={setDetailTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
          <TabsContent value="implementation" className="pt-250">
            <Stack space="space.300">
              {uses.map((use) => {
                const confirmed = currentDecision.confirmedSourceIds.includes(use.object.id);
                const excluded = currentDecision.excludedSourceIds.includes(use.object.id);
                return (
                  <Section
                    key={use.object.id}
                    title={`${use.object.name} · v${use.object.version}`}
                    action={<SourceAssessment result={use.control.status} />}
                  >
                    <Stack space="space.200" className="pt-150">
                      <Inline
                        spread="space-between"
                        alignBlock="center"
                        space="space.100"
                        shouldWrap
                      >
                        <Text size="small" color="color.text.subtle">
                          {use.object.kind}
                        </Text>
                        <Button
                          variant="link"
                          size="small"
                          onClick={() => onOpenObject(use.object.id)}
                        >
                          Open source
                        </Button>
                      </Inline>
                      <Text>{use.control.implementation}</Text>
                      {use.control.contributions.length > 0 && (
                        <Stack space="space.100">
                          <Text size="small" weight="medium">
                            Supporting records
                          </Text>
                          {use.control.contributions.map((contribution, index) => (
                            <Inline
                              key={`${contribution.objectId}-${index}`}
                              space="space.100"
                              shouldWrap
                            >
                              <Button
                                variant="link"
                                size="small"
                                onClick={() => onOpenObject(contribution.objectId)}
                              >
                                {objectMap.get(contribution.objectId)?.name ??
                                  contribution.objectId}{" "}
                                / {contribution.controlId}
                              </Button>
                              <Text size="small" color="color.text.subtle">
                                {contribution.note}
                              </Text>
                            </Inline>
                          ))}
                        </Stack>
                      )}
                      <Box
                        backgroundColor="color.background.neutral.subtle"
                        padding="space.200"
                        className="rounded-medium"
                      >
                        <Stack space="space.100">
                          <Text size="small" weight="medium">
                            Conditions
                          </Text>
                          {use.object.conditions.map((condition, index) => (
                            <Text key={index} size="small" color="color.text.subtle">
                              {condition}
                            </Text>
                          ))}
                          <Text size="small">{use.control.responsibility}</Text>
                        </Stack>
                      </Box>
                      <ChoiceField
                        label={`Use ${use.object.name} for ${selectedControl.id}`}
                        value={confirmed ? "confirmed" : excluded ? "excluded" : "pending"}
                        onChange={(value) =>
                          setSourceState(
                            use.object.id,
                            value as "confirmed" | "excluded" | "pending",
                          )
                        }
                        choices={[
                          {
                            value: "pending",
                            label: "Pending",
                          },
                          {
                            value: "confirmed",
                            label: "Confirmed",
                          },
                          {
                            value: "excluded",
                            label: "Excluded",
                          },
                        ]}
                      />
                    </Stack>
                  </Section>
                );
              })}
              <Section
                title={`${program.name} implementation`}
                action={
                  <Badge
                    variant="secondary"
                    tone={isPrepared(currentDecision, uses) ? "information" : "neutral"}
                  >
                    {isPrepared(currentDecision, uses) ? "Ready for assessment" : "Open"}
                  </Badge>
                }
              >
                <Stack space="space.200" className="pt-200">
                  <Field>
                    <FieldLabel htmlFor="program-local-narrative">
                      Program implementation
                    </FieldLabel>
                    <Textarea
                      id="program-local-narrative"
                      aria-label="Program implementation"
                      rows={6}
                      value={currentDecision.localNarrative}
                      placeholder="Add implementation details…"
                      onChange={(event) =>
                        updateDecision({
                          localNarrative: event.target.value,
                          ...(event.target.value.trim() ? {} : { localComplete: false }),
                        })
                      }
                    />
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="program-work-prepared"
                      checked={isPrepared(currentDecision, uses)}
                      disabled={!currentDecision.localNarrative.trim() || pendingUses.length > 0}
                      onCheckedChange={(checked) => updateDecision({ localComplete: checked })}
                    />
                    <FieldLabel htmlFor="program-work-prepared">Ready for assessment</FieldLabel>
                  </Field>
                </Stack>
              </Section>
            </Stack>
          </TabsContent>
          <TabsContent value="requirements" className="pt-250">
            <Stack space="space.300">
              <Section title="Source requirements">
                <Table
                  label="Source control requirements"
                  density="compact"
                  style={{ minWidth: 520 }}
                >
                  <thead>
                    <tr>
                      <Table.Header>Requirement / source</Table.Header>
                      <Table.Header width={100}>Source result</Table.Header>
                      <Table.Header width={120}>Program use</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {uses.flatMap((use) =>
                      use.object.requirements
                        .filter(
                          (requirement) =>
                            use.control.requirementIds.includes(requirement.id) ||
                            requirement.controlIds.includes(selectedControl.id),
                        )
                        .map((requirement) => (
                          <Table.Row key={`${use.object.id}-${requirement.id}`}>
                            <Table.Cell className="whitespace-normal">
                              <Stack space="space.050" className="py-100">
                                <Id>{requirement.id}</Id>
                                <Text>{requirement.title}</Text>
                                <Text size="small" color="color.text.subtle">
                                  {use.object.name} v{use.object.version}
                                </Text>
                              </Stack>
                            </Table.Cell>
                            <Table.Cell>{requirement.status}</Table.Cell>
                            <Table.Cell>
                              {currentDecision.confirmedSourceIds.includes(use.object.id)
                                ? "Confirmed"
                                : currentDecision.excludedSourceIds.includes(use.object.id)
                                  ? "Excluded"
                                  : "Pending"}
                            </Table.Cell>
                          </Table.Row>
                        )),
                    )}
                  </tbody>
                </Table>
              </Section>
              <Section title={`${program.name} requirements`} count={programRequirements.length}>
                {programRequirements.length ? (
                  <Table
                    label="Local program control requirements"
                    density="compact"
                    style={{ minWidth: 400 }}
                  >
                    <thead>
                      <tr>
                        <Table.Header>Requirement</Table.Header>
                        <Table.Header width={100}>Status</Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {programRequirements.map((requirement) => (
                        <Table.Row key={requirement.id}>
                          <Table.Cell className="whitespace-normal">
                            <Stack space="space.050" className="py-100">
                              <Id>{requirement.id}</Id>
                              <Text>{requirement.title}</Text>
                            </Stack>
                          </Table.Cell>
                          <Table.Cell>{requirement.status}</Table.Cell>
                        </Table.Row>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Text color="color.text.subtle" className="pt-150">
                    No linked requirements
                  </Text>
                )}
              </Section>
            </Stack>
          </TabsContent>
          <TabsContent value="evidence" className="pt-250">
            <Stack space="space.300">
              <Section title="Source evidence">
                <Table label="Source control evidence" density="compact" style={{ minWidth: 520 }}>
                  <thead>
                    <tr>
                      <Table.Header>Evidence / source</Table.Header>
                      <Table.Header width={190}>Scope</Table.Header>
                      <Table.Header width={110}>Date</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {uses.flatMap((use) =>
                      use.object.evidence
                        .filter((evidence) => use.control.evidenceIds.includes(evidence.id))
                        .map((evidence) => (
                          <Table.Row key={`${use.object.id}-${evidence.id}`}>
                            <Table.Cell className="whitespace-normal">
                              <Stack space="space.050" className="py-100">
                                <Id>{evidence.id}</Id>
                                <Text>{evidence.title}</Text>
                                <Text size="small" color="color.text.subtle">
                                  {use.object.name} v{use.object.version} ·{" "}
                                  {currentDecision.confirmedSourceIds.includes(use.object.id)
                                    ? "Confirmed"
                                    : currentDecision.excludedSourceIds.includes(use.object.id)
                                      ? "Excluded"
                                      : "Pending"}
                                </Text>
                              </Stack>
                            </Table.Cell>
                            <Table.Cell className="whitespace-normal">
                              <Text size="small">{evidence.scope}</Text>
                            </Table.Cell>
                            <Table.Cell>{evidence.date}</Table.Cell>
                          </Table.Row>
                        )),
                    )}
                  </tbody>
                </Table>
              </Section>
              <Section title={`${program.name} evidence`}>
                {program.evidence.some((evidence) => programEvidenceIds.has(evidence.id)) ? (
                  <Table
                    label="Local program control evidence"
                    density="compact"
                    style={{ minWidth: 400 }}
                  >
                    <thead>
                      <tr>
                        <Table.Header>Evidence</Table.Header>
                        <Table.Header width={190}>Scope</Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {program.evidence
                        .filter((evidence) => programEvidenceIds.has(evidence.id))
                        .map((evidence) => (
                          <Table.Row key={evidence.id}>
                            <Table.Cell className="whitespace-normal">
                              <Stack space="space.050" className="py-100">
                                <Id>{evidence.id}</Id>
                                <Text>{evidence.title}</Text>
                              </Stack>
                            </Table.Cell>
                            <Table.Cell className="whitespace-normal">{evidence.scope}</Table.Cell>
                          </Table.Row>
                        ))}
                    </tbody>
                  </Table>
                ) : (
                  <Text color="color.text.subtle" className="pt-150">
                    No linked evidence
                  </Text>
                )}
              </Section>
            </Stack>
          </TabsContent>
        </Tabs>
      </Stack>
    );
  }

  function ProgramRecords() {
    return (
      <Stack space="space.300">
        <Section title={`${program.name} requirements`} count={program.requirements.length}>
          <Table label="Program owned requirements" density="compact" style={{ minWidth: 650 }}>
            <thead>
              <tr>
                <Table.Header>Requirement</Table.Header>
                <Table.Header width={120}>Control mapping</Table.Header>
                <Table.Header width={100}>Status</Table.Header>
                <Table.Header width={110}>Evidence</Table.Header>
              </tr>
            </thead>
            <tbody>
              {program.requirements.map((requirement) => (
                <Table.Row key={requirement.id}>
                  <Table.Cell className="whitespace-normal">
                    <Stack space="space.050" className="py-100">
                      <Id>{requirement.id}</Id>
                      <Text>{requirement.title}</Text>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell className="whitespace-normal">
                    {requirement.controlIds.join(", ") || "Standalone"}
                  </Table.Cell>
                  <Table.Cell>{requirement.status}</Table.Cell>
                  <Table.Cell>{requirement.evidenceIds.length} records</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>
        <Section title={`${program.name} evidence`} count={program.evidence.length}>
          <Table label="Program owned evidence" density="compact" style={{ minWidth: 650 }}>
            <thead>
              <tr>
                <Table.Header>Evidence</Table.Header>
                <Table.Header width={110}>Type</Table.Header>
                <Table.Header width={230}>Scope</Table.Header>
                <Table.Header width={110}>Date</Table.Header>
              </tr>
            </thead>
            <tbody>
              {program.evidence.map((evidence) => (
                <Table.Row key={evidence.id}>
                  <Table.Cell className="whitespace-normal">
                    <Stack space="space.050" className="py-100">
                      <Id>{evidence.id}</Id>
                      <Text>{evidence.title}</Text>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell className="whitespace-normal">{evidence.kind}</Table.Cell>
                  <Table.Cell className="whitespace-normal">{evidence.scope}</Table.Cell>
                  <Table.Cell>{evidence.date}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>
      </Stack>
    );
  }

  return (
    <Stack space="space.300" className="min-w-0">
      <PageHeader eyebrow="Programs" title={program.name} description={program.owner} />
      <Box
        backgroundColor="color.background.neutral.subtle"
        padding="space.200"
        className="rounded-medium"
      >
        <Inline space="space.300" shouldWrap alignBlock="center">
          <Inline space="space.075" alignBlock="center">
            <Count value={instances.length} />
            <Text size="small">instances</Text>
          </Inline>
          <Inline space="space.075" alignBlock="center">
            <Count value={profiles.length} />
            <Text size="small">profiles</Text>
          </Inline>
          <Inline space="space.075" alignBlock="center">
            <Count value={needsConfirmation} max={999} />
            <Text size="small">pending review</Text>
          </Inline>
          <Inline space="space.075" alignBlock="center">
            <Count value={prepared} />
            <Text size="small">ready for assessment</Text>
          </Inline>
        </Inline>
      </Box>
      {notice && (
        <Alert tone="information" role="status">
          <AlertTitle>{notice}</AlertTitle>
        </Alert>
      )}
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setNotice("");
        }}
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="composition">Composition</TabsTrigger>
          <TabsTrigger value="assurance">Controls</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>
        <TabsContent value="composition" className="pt-300">
          {Composition()}
        </TabsContent>
        <TabsContent value="assurance" className="pt-300">
          <Grid
            templateColumns={{ base: "minmax(0,1fr)", md: "224px minmax(0,1fr)" }}
            gap="space.300"
          >
            {InstanceTree()}
            <Box className="min-w-0">{selectedControl ? ControlDetail() : ControlRegister()}</Box>
          </Grid>
        </TabsContent>
        <TabsContent value="records" className="pt-300">
          {ProgramRecords()}
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
