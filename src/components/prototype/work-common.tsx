import { productRecordNoun } from "@/lib/product-records";
import { statusTone } from "./work-format";
import type { ReactNode } from "react";
import {
  Absent,
  Alert,
  AlertDescription,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  Inline,
  KeyValue,
  PageHeader,
  Section,
  Stack,
  Spinner,
  TextLink,
} from "@ledger/design-system";
import { ChevronDown } from "lucide-react";
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
    <Absent />
  );
}
export type QueryStatus = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  data?: unknown;
};
export function QueryState({
  queries: many = [],
  query,
  children,
}: {
  queries?: QueryStatus[];
  query?: QueryStatus;
  children?: ReactNode;
}) {
  const queries = query ? [...many, query] : many;
  const failed = queries.find((query) => query.isError);
  const pending = queries.some((query) => query.isPending && query.data === undefined);
  const available = queries.every(
    (query) => query.data !== undefined || (!query.isPending && !query.isError),
  );
  return (
    <>
      {failed && (
        <Stack space="space.150">
          <Alert tone="danger">
            <AlertDescription>
              {failed.data !== undefined &&
                "Could not refresh records. Showing the last loaded records. "}
              {failed.error instanceof Error
                ? failed.error.message
                : "Records could not be loaded."}
            </AlertDescription>
          </Alert>
          <Button onClick={() => void Promise.all(queries.map((query) => query.refetch()))}>
            Retry loading
          </Button>
        </Stack>
      )}
      {pending && (
        <Inline space="space.100" role="status" aria-live="polite">
          <Spinner /> Loading records…
        </Inline>
      )}
      {available && children}
    </>
  );
}

export function EmptyMessage({
  title,
  description,
  compact = false,
}: {
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <Empty size={compact ? "compact" : "default"} frame="none">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}

const missingRecordDestinations = {
  "/": "Open workspace",
  "/work": "Open my work",
  "/programs": "Open programs",
  "/campaigns": "Open assessment campaigns",
  "/findings": "Open findings and assets",
  "/register": "Open POA&M and risk register",
  "/packages": "Open authorization packages",
  "/profiles": "Open profiles",
  "/library/components": "Open components",
  "/library/products": "Open products",
  "/library/requirements": "Open requirements",
} as const;

export function MissingRecord({
  kind,
  description = "This record is unavailable in the current workspace.",
  backTo = "/",
}: {
  kind: string;
  description?: string;
  backTo?: keyof typeof missingRecordDestinations;
}) {
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>{kind}</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Empty>
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind="search" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{kind} not found</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="primary" render={<Link to={backTo} />}>
            {missingRecordDestinations[backTo]}
          </Button>
        </EmptyContent>
      </Empty>
    </Stack>
  );
}
export type FormTarget = {
  table: TableName;
  operationLabel?: string | undefined;
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
      operationLabel={target.operationLabel}
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
    <Stack space="space.150">
      {facts.map(([name, value]) => (
        <KeyValue key={name} label={name} wrap className="break-words">
          {value ?? <Absent />}
        </KeyValue>
      ))}
    </Stack>
  );
}
export function RecordActions({
  onEdit,
  table,
  id,
  editLabel,
  readOnly = false,
}: {
  onEdit: () => void;
  table: string;
  id: string;
  editLabel?: string;
  readOnly?: boolean;
}) {
  const workspace = useWorkspace();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Actions</Button>} />
      <DropdownMenuContent align="end">
        {!readOnly && workspace.role !== "viewer" && (
          <DropdownMenuItem onClick={onEdit}>
            {editLabel ?? `Edit ${productRecordNoun(table)}`}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          render={
            <Link
              to="/records/$collection/$recordId"
              params={{ collection: table, recordId: id }}
            />
          }
        >
          Inspect record
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
