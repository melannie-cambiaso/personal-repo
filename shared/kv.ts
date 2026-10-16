import "server-only";
import { readFileSync } from "fs";
import { Redis } from "@upstash/redis";
import { createMemoryKv, isMemoryKvEnabled, parseSeed, type KvClient } from "./kvMemory";
import { currentMonth } from "./utils/monthUtils";

// End-to-end runs (`E2E=1`, see playwright.config.ts) swap Upstash for an in-memory store
// seeded from `E2E_KV_SEED`, so tests never read or write real data.
function createKv(): KvClient {
  if (isMemoryKvEnabled(process.env)) {
    const seedPath = process.env.E2E_KV_SEED;
    return createMemoryKv(
      seedPath ? parseSeed(readFileSync(seedPath, "utf8"), currentMonth()) : {}
    );
  }
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export const redis: KvClient = createKv();
