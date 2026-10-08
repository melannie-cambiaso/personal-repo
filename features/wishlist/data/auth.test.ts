import { describe, it, expect, vi, afterEach } from "vitest";
import { AUTH_COOKIE, generateToken, isAuthorized } from "./auth";

const storeWith = (value?: string) => ({
  get: (name: string) => (name === AUTH_COOKIE && value !== undefined ? { value } : undefined),
});

describe("isAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the cookie when it matches the expected token", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    expect(isAuthorized(storeWith(generateToken()))).toBe(true);
  });

  it("rejects a forged cookie value", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    expect(isAuthorized(storeWith("forged"))).toBe(false);
  });

  it("rejects the raw secret used as cookie value", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    expect(isAuthorized(storeWith("s3cret"))).toBe(false);
  });

  it("rejects a token issued for a different secret", () => {
    vi.stubEnv("WISHLIST_SECRET", "old");
    const stale = generateToken();
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    expect(isAuthorized(storeWith(stale))).toBe(false);
  });

  it("rejects when the cookie is missing or empty", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    expect(isAuthorized(storeWith())).toBe(false);
    expect(isAuthorized(storeWith(""))).toBe(false);
  });

  it("rejects instead of throwing when WISHLIST_SECRET is not set", () => {
    vi.stubEnv("WISHLIST_SECRET", "");
    expect(isAuthorized(storeWith("anything"))).toBe(false);
  });
});

describe("generateToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when WISHLIST_SECRET is not set", () => {
    vi.stubEnv("WISHLIST_SECRET", "");
    expect(() => generateToken()).toThrow(/WISHLIST_SECRET is not set/);
  });

  it("returns a 64-char hex sha256 digest", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    expect(generateToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same secret", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    expect(generateToken()).toBe(generateToken());
  });

  it("changes when the secret changes", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    const first = generateToken();
    vi.stubEnv("WISHLIST_SECRET", "other");
    expect(generateToken()).not.toBe(first);
  });

  it("does not expose the secret in the token", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    expect(generateToken()).not.toContain("s3cret");
  });
});
