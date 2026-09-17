import { Link } from "@tanstack/react-router";
import { Badge, Inline, KeyValue, TextLink } from "@ledger/design-system";
import type { ChainHop } from "@/lib/profile-chain";

/**
 * Where a profile comes from, as rail rows: the catalog, the reference profile, each layer on it.
 * `pending` is a layer not saved yet (the wizard's program overlay) shown at the top of the chain.
 */
export function ProfileChain({
  chain,
  catalog,
  pending,
  labelWidth,
}: {
  /** This profile first, then its base, down to the reference profile. */
  chain: ChainHop[];
  /** The catalog revision's id and version; `title` is the catalog record's stable name, not the document's. */
  catalog: { id: string; title: string; version: string } | null | undefined;
  pending?: { label: string; outCount: number; inCount: number } | undefined;
  labelWidth?: number | undefined;
}) {
  const hops = [...chain].reverse();
  const widthProps = labelWidth === undefined ? {} : { labelWidth };
  return (
    <>
      <KeyValue label="Catalog" wrap {...widthProps}>
        {catalog ? (
          <TextLink render={<Link to="/catalog" search={{ edition: catalog.id }} />}>
            {catalog.title} · {catalog.version}
          </TextLink>
        ) : (
          "Not selected"
        )}
      </KeyValue>
      {hops.map((hop, index) => {
        const top = index === hops.length - 1 && !pending;
        const label = index === 0 ? "Base profile" : top ? "This profile" : "Layered on";
        return (
          <KeyValue key={hop.resolutionId} label={label} wrap {...widthProps}>
            <TextLink
              render={<Link to="/profiles/$profileId" params={{ profileId: hop.profileId }} />}
            >
              {hop.title} · {hop.version}
            </TextLink>
          </KeyValue>
        );
      })}
      {pending ? (
        <KeyValue label={pending.label} wrap {...widthProps}>
          <Inline space="space.075" alignBlock="center" shouldWrap>
            {pending.outCount || pending.inCount ? (
              <>
                <Badge size="xsmall" variant="secondary" tone="warning">
                  Out {pending.outCount}
                </Badge>
                <Badge size="xsmall" variant="secondary" tone="success">
                  In {pending.inCount}
                </Badge>
              </>
            ) : (
              <span className="text-subtle">Adopted as-is</span>
            )}
          </Inline>
        </KeyValue>
      ) : null}
    </>
  );
}
