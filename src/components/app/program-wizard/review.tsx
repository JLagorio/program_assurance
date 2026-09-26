import type { ReactNode } from "react";
import {
  Absent,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DateTime,
  Heading,
  HeadingLevelProvider,
  Id,
  Inline,
  KeyValue,
  Stack,
  Text,
  VisuallyHidden,
} from "@ledger/design-system";
import { LevelIndicator } from "@/components/app/status";
import type { Row } from "@/lib/models";
import type { LibraryComponentItem } from "@/lib/library-items";
import type { ProductConfigurationItem } from "@/lib/product-items";
import type { ProgramWizardDraft, SystemWizardDraft } from "@/lib/program-wizard";
import type { ProgramTailoringPreview, WizardProfileOption } from "@/lib/program-wizard-reference";
import { impactLevels } from "@/lib/status";
import type { WizardResources } from "./resources";

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const roles = [
  { role: "program_manager", label: "Program manager" },
  { role: "authorizing_official", label: "Authorizing official" },
  { role: "assessor", label: "Assessor" },
] as const;
const objectives = [
  { key: "confidentiality", label: "Confidentiality" },
  { key: "integrity", label: "Integrity" },
  { key: "availability", label: "Availability" },
] as const;

/** One step's summary: a title, a line of counts, its facts, and the way back to the step. */
function StepCard({
  title,
  description,
  onEdit,
  children,
}: {
  title: string;
  description?: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Heading size="xsmall">{title}</Heading>
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardAction>
          <Button size="small" variant="link" onClick={onEdit}>
            Edit<VisuallyHidden> {title.toLowerCase()}</VisuallyHidden>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <HeadingLevelProvider>
          <Stack space="space.200">{children}</Stack>
        </HeadingLevelProvider>
      </CardContent>
    </Card>
  );
}

/** Step 4: a checkout summary. One card per step, what it amounts to, and Edit to go back; nothing entered is restated in full. */
export function ReviewStep({
  draft,
  data,
  parties,
  profiles,
  previews,
  libraryItems,
  productItems,
  total,
  onEdit,
}: {
  draft: ProgramWizardDraft;
  data: WizardResources;
  parties: Row<"parties">[];
  profiles: WizardProfileOption[];
  previews: Map<string, ProgramTailoringPreview>;
  libraryItems: LibraryComponentItem[];
  productItems: ProductConfigurationItem[];
  total: number;
  onEdit: (step: 0 | 1 | 2) => void;
}) {
  const party = (id: string | null | undefined) =>
    id ? (parties.find((item) => item.id === id)?.name ?? "Unavailable party") : null;
  const catalog = data.catalogRevisions.find((item) => item.id === draft.catalogRevisionId);
  const catalogTitle =
    data.catalogs.find((row) => row.id === catalog?.catalog_id)?.title ?? catalog?.title;
  const option = (baseResolutionId: string) =>
    profiles.find((item) => item.id === baseResolutionId);
  const profileOf = (system: SystemWizardDraft) => {
    const profile = draft.profiles.find((item) => item.key === system.profileKey);
    return profile ? option(profile.baseResolutionId) : undefined;
  };
  const productOf = (system: SystemWizardDraft) =>
    system.product
      ? (productItems.find(
          (entry) =>
            entry.id === `${system.product!.revisionId}:${system.product!.configurationId}`,
        ) ?? null)
      : null;
  const person = (name: string | null) => name ?? <Absent label="Not assigned" />;

  const elements = draft.systems.reduce((sum, system) => sum + system.elements.length, 0);
  const fromLibrary = draft.systems.reduce(
    (sum, system) => sum + system.elements.filter((element) => element.library).length,
    0,
  );
  const fromProducts = draft.systems.filter((system) => system.product).length;
  const systemsLine = [
    count(draft.systems.length, "system"),
    count(elements, "element"),
    `${total} distinct controls`,
    fromLibrary ? `${fromLibrary} from the library` : null,
    fromProducts ? `${fromProducts} from ${fromProducts === 1 ? "a product" : "products"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Stack space="space.300" className="max-w-layout-measure">
      <StepCard title="Program" onEdit={() => onEdit(0)}>
        <KeyValue.Group labelWidth={160}>
          <KeyValue label="Name" wrap>
            {draft.name}
          </KeyValue>
          <KeyValue label="Code">
            <Id>{draft.code}</Id>
          </KeyValue>
          {draft.description ? (
            <KeyValue label="Mission" wrap>
              <Text maxLines={2}>{draft.description}</Text>
            </KeyValue>
          ) : null}
          <KeyValue label="Sponsor">{person(party(draft.sponsorPartyId))}</KeyValue>
          {roles.map(({ role, label }) => (
            <KeyValue key={role} label={label}>
              {person(party(draft.roles.find((assignment) => assignment.role === role)?.partyId))}
            </KeyValue>
          ))}
          <KeyValue label="Starts on">
            <DateTime value={draft.startsOn} absentLabel="No start date" />
          </KeyValue>
          <KeyValue label="Ends on">
            <DateTime value={draft.endsOn} absentLabel="No end date" />
          </KeyValue>
        </KeyValue.Group>
      </StepCard>

      <StepCard
        title="Catalog & profiles"
        description={catalog ? `${catalogTitle} · ${catalog.version}` : "No catalog chosen"}
        onEdit={() => onEdit(1)}
      >
        {draft.profiles.map((profile) => {
          const base = option(profile.baseResolutionId);
          const preview = previews.get(profile.key);
          const tailored = profile.tailoring.length > 0 || profile.parameters.length > 0;
          const summary = tailored
            ? [
                `tailored: ${preview?.counts.excluded ?? 0} out, ${preview?.counts.added ?? 0} in`,
                profile.parameters.length
                  ? count(profile.parameters.length, "parameter override")
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : "adopted as-is";
          return (
            <Text as="p" key={profile.key}>
              {base ? `${base.title} ${base.version}` : "Unavailable profile"} · {summary} ·{" "}
              {preview?.counts.selected ?? 0} controls
            </Text>
          );
        })}
      </StepCard>

      <StepCard title="Systems & components" description={systemsLine} onEdit={() => onEdit(2)}>
        {draft.systems.map((system) => {
          const profile = profileOf(system);
          const product = productOf(system);
          const inherited = system.elements.filter((element) => element.productElementId).length;
          const library = system.elements.filter((element) => element.library).length;
          const libraryNames = system.elements
            .filter((element) => element.library)
            .map(
              (element) =>
                libraryItems.find((entry) => entry.id === element.library!.definedComponentId)
                  ?.definitionName,
            )
            .filter(Boolean);
          return (
            <Stack key={system.key} space="space.100">
              <Inline space="space.100" alignBlock="baseline" shouldWrap>
                <Heading size="xsmall">{system.name}</Heading>
                <Id className="text-subtle">{system.code}</Id>
                {system.product ? (
                  <Badge variant="secondary" tone="information" size="xsmall">
                    Variant
                  </Badge>
                ) : null}
              </Inline>
              <KeyValue.Group labelWidth={160}>
                <KeyValue label="Program profile" wrap>
                  {profile ? `${profile.title} ${profile.version}` : <Absent label="None" />}
                </KeyValue>
                {objectives.map(({ key, label }) => (
                  <KeyValue key={key} label={label}>
                    <LevelIndicator levels={impactLevels} value={system[key]} />
                  </KeyValue>
                ))}
                <KeyValue label="Elements" wrap>
                  {count(system.elements.length, "element")}
                  {library
                    ? ` · ${library} from the library${libraryNames.length ? ` (${libraryNames.join(", ")})` : ""}`
                    : ""}
                </KeyValue>
                {system.product ? (
                  <KeyValue label="Product" wrap>
                    {product
                      ? `Variant of ${product.productName} · ${product.configurationName} · v${product.version} · ${inherited} inherited · ${product.elements.length - inherited} removed · ${system.elements.length - inherited} added`
                      : "Variant of a product version that is no longer published"}
                  </KeyValue>
                ) : null}
              </KeyValue.Group>
            </Stack>
          );
        })}
      </StepCard>

      <Text as="p" size="small" color="color.text.subtle">
        Creating the program publishes each tailored profile as an OSCAL profile layered on its base
        and gives each system its elements, a draft system security plan, and its library components
        with their claimed narratives seeded where the control is in the baseline. Nothing here
        records an approval or an authorization decision.
      </Text>
    </Stack>
  );
}
