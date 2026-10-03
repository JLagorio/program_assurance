import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import { titleColumn, type Collection, type DataRecord } from "./records";

type Client = Pick<SupabaseClient, "from">;

/** The columns a record is named by, in the order a name is chosen. */
export const NAME_COLUMNS = [
  "name",
  "title",
  "display_name",
  "code",
  "source_id",
  "email",
  "label",
] as const;
/** What a name reads beyond its own words: a revision's number, the control a record is about. */
const NAMING_COLUMNS = ["version_number", "control_id", "selected_control_id"];

export const MISSING_RECORD = "This record does not exist or is not accessible in your workspace.";
/** Every table's id is a uuid; anything else cannot name a record, and would fail a whole read. */
const RECORD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** How many ids one read carries, so its address stays short. */
const IDS_PER_READ = 100;

/** The columns a read of names asks for: the id, the name candidates and the record's title. */
export function nameColumns(collection: Collection): string[] {
  const wanted = new Set<string>([
    "id",
    ...NAME_COLUMNS,
    ...NAMING_COLUMNS,
    titleColumn(collection),
  ]);
  return collection.columns.map((column) => column.name).filter((name) => wanted.has(name));
}

/**
 * The names of many records of one collection in as few reads as their ids allow: a hundred ids a
 * request, only the columns a name is made of. A record the reader cannot see is simply absent.
 */
export async function readRecordNames(
  client: Client,
  token: string,
  collection: Collection,
  ids: readonly string[],
): Promise<Map<string, DataRecord>> {
  const wanted = [...new Set(ids)].filter((id) => RECORD_ID.test(id)).sort();
  const columns = nameColumns(collection).join(",");
  const found = new Map<string, DataRecord>();
  const reads: Promise<void>[] = [];
  for (let offset = 0; offset < wanted.length; offset += IDS_PER_READ) {
    const part = wanted.slice(offset, offset + IDS_PER_READ);
    reads.push(
      (async () => {
        const { data, error } = await client
          .from(collection.name)
          .select(columns)
          .in("id", part)
          .setHeader("Authorization", `Bearer ${token}`)
          // One retry owner: the name's query, which fails at once into its Absent.
          .retry(false);
        if (error) throw new Error(error.message);
        for (const record of (data ?? []) as unknown as DataRecord[]) found.set(record.id, record);
      })(),
    );
  }
  await Promise.all(reads);
  return found;
}

type Waiter = { resolve: (record: DataRecord) => void; reject: (cause: unknown) => void };
type Queue = {
  read: (ids: string[]) => Promise<Map<string, DataRecord>>;
  waiters: Map<string, Waiter[]>;
};

/**
 * Gathers the names asked for while a page renders and reads each collection's once: every cell
 * that names a record asks on its own, and the asks of one render share one request. `schedule`
 * decides when a gathered batch is read; the next task, by default, so every row has asked.
 */
export function createNameBatcher(
  schedule: (flush: () => void) => void = (flush) => void setTimeout(flush, 0),
) {
  const queues = new Map<string, Queue>();
  async function flush(key: string) {
    const queue = queues.get(key);
    queues.delete(key);
    if (!queue) return;
    try {
      const found = await queue.read([...queue.waiters.keys()]);
      for (const [id, waiters] of queue.waiters) {
        const record = found.get(id);
        for (const waiter of waiters)
          if (record) waiter.resolve(record);
          else waiter.reject(new Error(MISSING_RECORD));
      }
    } catch (cause) {
      for (const waiters of queue.waiters.values())
        for (const waiter of waiters) waiter.reject(cause);
    }
  }
  return {
    /** One record's name columns, read with every other id `key` gathers in this task. */
    load(
      key: string,
      id: string,
      read: (ids: string[]) => Promise<Map<string, DataRecord>>,
    ): Promise<DataRecord> {
      if (!RECORD_ID.test(id)) return Promise.reject(new Error(MISSING_RECORD));
      let queue = queues.get(key);
      if (!queue) {
        queue = { read, waiters: new Map() };
        queues.set(key, queue);
        schedule(() => void flush(key));
      }
      const waiting = queue.waiters;
      return new Promise<DataRecord>((resolve, reject) => {
        waiting.set(id, [...(waiting.get(id) ?? []), { resolve, reject }]);
      });
    },
  };
}

const names = createNameBatcher();

/**
 * A referenced record's name columns, for a cell or a field that names it. The names a page asks
 * for in one render are read together, one request per collection, instead of one per cell. It
 * fails with "does not exist" when the reader cannot see the record.
 */
export function useRecordName(
  collection: Collection | undefined,
  id: string | null | undefined,
): UseQueryResult<DataRecord, Error> {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["record-name", workspace.tenantId, collection?.name, id],
    enabled: !!collection && !!id,
    retry: false,
    queryFn: () =>
      names.load(`${workspace.tenantId}:${collection!.name}`, id!, async (ids) =>
        readRecordNames(database(), await requireIdentity(workspace), collection!, ids),
      ),
  });
}
