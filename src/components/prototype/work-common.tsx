import { statusTone } from "./work-format";
import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  Inline,
  Section,
  Stack,
  TextLink,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import { ProductRecordDialog } from "./product-record-dialog";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor, type DataRecord, type RecordValue } from "@/lib/records";
import type { TableName } from "@/lib/models";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  return value ? (
    <Badge variant="secondary" tone={statusTone(value)}>
      {labelFor(value)}
    </Badge>
  ) : (
    <span className="text-subtlest">Not recorded</span>
  );
}
/** The app's empty region: the kit's picture (or an icon for a small region), the message, the way forward. */
export function EmptyState({
  title,
  description,
  illustration,
  icon,
  action,
  size = "default",
}: {
  title: string;
  description?: string;
  /** Which kit picture; `records` by default, `false` for none. */
  illustration?: EmptyIllustrationKind | false;
  /** A Lucide icon in the neutral circle instead of a picture, for a card body or a rail. */
  icon?: ReactNode;
  /** The next step: the create verb, a link back. */
  action?: ReactNode;
  size?: "default" | "compact";
}) {
  const media = icon ? (
    <EmptyMedia variant="icon" aria-hidden>
      {icon}
    </EmptyMedia>
  ) : illustration === false || size === "compact" ? null : (
    <EmptyMedia aria-hidden>
      <EmptyIllustration kind={illustration ?? "records"} />
    </EmptyMedia>
  );
  return (
    <Empty size={size}>
      {media}
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
type QueryStatus = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};
export function QueryState({ queries, children }: { queries: QueryStatus[]; children: ReactNode }) {
  const failed = queries.find((query) => query.isError);
  if (failed)
    return (
      <Stack space="space.150">
        <p role="alert" className="text-danger">
          {failed.error instanceof Error ? failed.error.message : "Records could not be loaded."}
        </p>
        <Button onClick={() => void Promise.all(queries.map((query) => query.refetch()))}>
          Retry loading
        </Button>
      </Stack>
    );
  if (queries.some((query) => query.isPending))
    return (
      <p role="status" className="py-200 text-subtle">
        Loading records…
      </p>
    );
  return children;
}
export type FormTarget = {
  table: TableName;
  existing?: DataRecord;
  initialValues?: Record<string, RecordValue>;
};
export function ModelForm({
  target,
  onClose,
  onSaved,
}: {
  target: FormTarget;
  onClose: () => void;
  onSaved?: (record: DataRecord) => void | Promise<void>;
}) {
  return (
    <ProductRecordDialog
      table={target.table}
      existing={target.existing}
      initialValues={target.initialValues}
      onSaved={onSaved}
      onClose={onClose}
    />
  );
}

export function SchemaLink({
  table,
  id,
  children = "Inspect record",
}: {
  table: string;
  id: string;
  children?: ReactNode;
}) {
  return (
    <TextLink
      size="small"
      render={
        <Link to="/records/$collection/$recordId" params={{ collection: table, recordId: id }} />
      }
    >
      {children}
    </TextLink>
  );
}
export function DetailFacts({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(100px,1fr)_minmax(0,2fr)] gap-x-200 gap-y-150 font-body-small">
      {facts.map(([name, value]) => (
        <div className="contents" key={name}>
          <dt className="text-subtle">{name}</dt>
          <dd className="min-w-0 break-words">{value ?? "Not recorded"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function RecordActions({
  onEdit,
  table,
  id,
}: {
  onEdit: () => void;
  table: string;
  id: string;
}) {
  const workspace = useWorkspace();
  return (
    <Inline space="space.150" alignBlock="center">
      {workspace.role !== "viewer" && (
        <Button size="small" onClick={onEdit}>
          Edit
        </Button>
      )}
      <SchemaLink table={table} id={id} />
    </Inline>
  );
}
