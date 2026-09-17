import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Inline,
  Stack,
  Text,
} from "@ledger/design-system";
import type { Row } from "@/lib/models";
import type { LibraryComponentItem } from "@/lib/library-items";
import type { ProductConfigurationItem } from "@/lib/product-items";
import type { ProgramWizardDraft, SystemWizardDraft } from "@/lib/program-wizard";
import type { ProgramTailoringPreview, WizardProfileOption } from "@/lib/program-wizard-reference";
import { ImpactBadge } from "@/components/prototype/system-assurance-details";
import type { WizardResources } from "./resources";

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const sentence = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** One step's summary: a title, a line of counts, two or three lines of names, and the way back to the step. */
function StepCard({
  title,
  description,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  description?: string;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>{title}</h3>
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardAction>
          <Button size="small" variant="link" aria-label={editLabel} onClick={onEdit}>
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Stack space="space.150">{children}</Stack>
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
  const party = (id: string | null) => parties.find((item) => item.id === id)?.name ?? null;
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

  const people = [
    draft.sponsorPartyId ? `Sponsor ${party(draft.sponsorPartyId) ?? "unavailable"}` : null,
    ...draft.roles.map(
      (assignment) =>
        `${sentence(assignment.role.replaceAll("_", " "))} ${party(assignment.partyId) ?? "unavailable"}`,
    ),
  ].filter(Boolean);
  const dates =
    draft.startsOn || draft.endsOn
      ? `Starts ${draft.startsOn ?? "unset"} · Ends ${draft.endsOn ?? "unset"}`
      : "No dates";

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
      <StepCard title="Program" editLabel="Edit program" onEdit={() => onEdit(0)}>
        <Text as="p">
          {draft.name} · {draft.code}
        </Text>
        <Text as="p" color="color.text.subtle">
          {people.length ? people.join(" · ") : "No sponsor or roles assigned"} · {dates}
        </Text>
        {draft.description ? (
          <Text as="p" color="color.text.subtle" maxLines={2} title={draft.description}>
            {draft.description}
          </Text>
        ) : null}
      </StepCard>

      <StepCard
        title="Catalog & profiles"
        description={catalog ? `${catalogTitle} · ${catalog.version}` : "No catalog chosen"}
        editLabel="Edit catalog & profiles"
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

      <StepCard
        title="Systems & components"
        description={systemsLine}
        editLabel="Edit systems & components"
        onEdit={() => onEdit(2)}
      >
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
            <Stack key={system.key} space="space.025">
              <Inline space="space.100" alignBlock="center" shouldWrap>
                <Text weight="medium">{system.name}</Text>
                <Text color="color.text.subtle">{system.code}</Text>
                <ImpactBadge value={system.confidentiality} />
                <ImpactBadge value={system.integrity} />
                <ImpactBadge value={system.availability} />
                {system.product ? (
                  <Badge variant="secondary" tone="information" size="xsmall">
                    Variant
                  </Badge>
                ) : null}
              </Inline>
              <Text as="p" size="small" color="color.text.subtle">
                {profile ? `${profile.title} ${profile.version}` : "No program profile"} ·{" "}
                {count(system.elements.length, "element")}
                {library
                  ? ` · ${library} from the library${libraryNames.length ? ` (${libraryNames.join(", ")})` : ""}`
                  : ""}
              </Text>
              {system.product ? (
                <Text as="p" size="small" color="color.text.subtle">
                  {product
                    ? `Variant of ${product.productName} · ${product.configurationName} · v${product.version} · ${inherited} inherited · ${product.elements.length - inherited} removed · ${system.elements.length - inherited} added`
                    : "Variant of a product version that is no longer published"}
                </Text>
              ) : null}
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
