import { describe, it, expect, vi, afterEach } from "vitest";
import { AUTH_COOKIE, generateToken, isAuthorized } from "./auth";

const storeWith = (value?: string) => ({
  get: (name: string) => (name === AUTH_COOKIE && value !== undefined ? { value } : undefined),
});

describe("isAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(isAuthorized(storeWith("anything"))).toBe(false);
  });

  it("does not log when the secret is set", () => {
    vi.stubEnv("WISHLIST_SECRET", "s3cret");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    isAuthorized(storeWith("forged"));
    isAuthorized(storeWith());
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("isAuthorized missing-secret logging", () => {
  // The "already logged" flag is module state, so each test loads a fresh copy of the module.
  const loadFreshAuth = async () => {
    vi.resetModules();
    return import("./auth");
  };

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs the misconfiguration only once per process", async () => {
    vi.stubEnv("WISHLIST_SECRET", "");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const auth = await loadFreshAuth();
    auth.isAuthorized(storeWith("anything"));
    auth.isAuthorized(storeWith("anything"));
    auth.isAuthorized(storeWith());
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("WISHLIST_SECRET"));
  });

  it("denies and logs when both the cookie and the secret are missing", async () => {
    vi.stubEnv("WISHLIST_SECRET", "");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const auth = await loadFreshAuth();
    expect(auth.isAuthorized(storeWith())).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(1);
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
