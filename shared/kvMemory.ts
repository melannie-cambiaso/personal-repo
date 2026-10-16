/** The slice of the Upstash client the data adapters use. */
export interface KvClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
  mget<T extends unknown[]>(...keys: string[]): Promise<T>;
}

export type KvSeed = Record<string, unknown>;

// Values round-trip through JSON, as they do through Upstash, so neither the caller
// nor the store can mutate the other's data by reference.
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** In-memory stand-in for the Upstash client, used by end-to-end tests only. */
export function createMemoryKv(seed: KvSeed = {}): KvClient {
  const store = new Map<string, unknown>(Object.entries(copy(seed)));
  const read = (key: string) => (store.has(key) ? copy(store.get(key)) : null);
  return {
    async get<T>(key: string) {
      return read(key) as T | null;
    },
    async set(key: string, value: unknown) {
      store.set(key, copy(value));
      return "OK";
    },
    async mget<T extends unknown[]>(...keys: string[]) {
      return keys.map(read) as T;
    },
  };
}

/** Parses a JSON seed, replacing `{{MONTH}}` with `month` (keys and values alike), so
 *  month-keyed data like transactions always lands in the month the app opens on. */
export function parseSeed(json: string, month: string): KvSeed {
  return JSON.parse(json.replaceAll("{{MONTH}}", month)) as KvSeed;
}

/** Whether the app runs on the in-memory store. Only `E2E=1` enables it, and never on
 *  Vercel: a deployment silently serving empty, throwaway data would look like data loss. */
export function isMemoryKvEnabled(env: Record<string, string | undefined>): boolean {
  if (env.E2E !== "1") return false;
  if (env.VERCEL) throw new Error("E2E=1 is not allowed on Vercel: refusing the in-memory KV.");
  return true;
}
