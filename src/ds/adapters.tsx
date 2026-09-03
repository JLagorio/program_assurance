import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import {
  Breadcrumb as DsBreadcrumb,
  Item as DsItem,
  RecordHeader as DsRecordHeader,
  Tabs as DsTabs,
  type ItemProps,
} from "@ledger/design-system";

/*
 * Cutover adapters. The package keeps links as slots; the prototype's call sites still speak the
 * old kit's `to`/`params` and `items` dialects. Each adapter turns one dialect into the slot and
 * disappears when its call sites are rewritten by hand.
 */

type TabItem = {
  key: string;
  label: ReactNode;
  active?: boolean | undefined;
  onSelect?: (() => void) | undefined;
  to?: string | undefined;
  params?: Record<string, string> | undefined;
  disabled?: boolean | undefined;
  trailing?: ReactNode;
};

/** The old items API over the package's composable Tabs. */
export function Tabs({ items, className }: { items: TabItem[]; className?: string | undefined }) {
  return (
    <DsTabs className={className}>
      {items.map((item) =>
        item.to ? (
          <DsTabs.Tab
            key={item.key}
            asChild
            isSelected={item.active}
            disabled={item.disabled}
            trailing={item.trailing}
          >
            <Link to={item.to} params={item.params as never}>
              {item.label}
            </Link>
          </DsTabs.Tab>
        ) : (
          <DsTabs.Tab
            key={item.key}
            isSelected={item.active}
            disabled={item.disabled || !item.onSelect}
            onClick={item.onSelect}
            trailing={item.trailing}
          >
            {item.label}
          </DsTabs.Tab>
        ),
      )}
    </DsTabs>
  );
}

type CrumbItem = {
  label: ReactNode;
  to?: string | undefined;
  params?: Record<string, string> | undefined;
  search?: Record<string, unknown> | undefined;
  onSelect?: (() => void) | undefined;
};

/** The old items API over the package's composable Breadcrumb; the last item is the page. */
export function Breadcrumb({
  items,
  className,
}: {
  items: CrumbItem[];
  className?: string | undefined;
}) {
  return (
    <DsBreadcrumb className={className}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        if (last)
          return (
            <DsBreadcrumb.Item key={i} isCurrent>
              {item.label}
            </DsBreadcrumb.Item>
          );
        if (item.to)
          return (
            <DsBreadcrumb.Item key={i} asChild>
              <Link to={item.to} params={item.params as never} search={item.search as never}>
                {item.label}
              </Link>
            </DsBreadcrumb.Item>
          );
        return (
          <DsBreadcrumb.Item key={i} onClick={item.onSelect}>
            {item.label}
          </DsBreadcrumb.Item>
        );
      })}
    </DsBreadcrumb>
  );
}

/** `to`/`params` over the package Item's link slot. */
function ItemRoot({
  to,
  params,
  ...rest
}: Omit<ItemProps, "link"> & {
  to?: string | undefined;
  params?: Record<string, string> | undefined;
}) {
  return <DsItem {...rest} link={to ? <Link to={to} params={params as never} /> : undefined} />;
}
export const Item = Object.assign(ItemRoot, { Group: DsItem.Group });

type RecordHeaderProps = Omit<Parameters<typeof DsRecordHeader>[0], "back"> & {
  backTo: string;
  backParams?: Record<string, string> | undefined;
};

/** `backTo`/`backParams` over the package RecordHeader's back slot. */
export function RecordHeader({ backTo, backParams, ...rest }: RecordHeaderProps) {
  return <DsRecordHeader {...rest} back={<Link to={backTo} params={backParams as never} />} />;
}
