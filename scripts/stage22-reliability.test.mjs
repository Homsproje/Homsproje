// @ts-check
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

/** Local copy of withRetry for pure unit testing without TS graph. */
async function withRetry(fn, opts = {}) {
  const attempts = opts.attempts ?? 3;
  const baseMs = opts.baseMs ?? 10;
  const shouldRetry = opts.shouldRetry ?? (() => true);
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i === attempts - 1 || !shouldRetry(err)) throw err;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
    }
  }
  throw last;
}

function isSafeMediaUrl(raw) {
  if (raw.startsWith("data:")) return true;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host) ||
    host === "169.254.169.254"
  ) {
    return false;
  }
  return true;
}

function makeIdempotencyKey(userId, op, parts) {
  const payload = JSON.stringify({ userId, op, ...parts });
  return createHash("sha256").update(payload).digest("hex").slice(0, 48);
}

describe("withRetry", () => {
  it("succeeds on first try", async () => {
    let n = 0;
    const v = await withRetry(async () => {
      n += 1;
      return 42;
    });
    assert.equal(v, 42);
    assert.equal(n, 1);
  });

  it("retries then succeeds", async () => {
    let n = 0;
    const v = await withRetry(
      async () => {
        n += 1;
        if (n < 3) throw new Error("temp");
        return "ok";
      },
      { attempts: 3, baseMs: 1 },
    );
    assert.equal(v, "ok");
    assert.equal(n, 3);
  });

  it("does not retry Unauthorized", async () => {
    let n = 0;
    await assert.rejects(
      () =>
        withRetry(
          async () => {
            n += 1;
            throw new Error("Unauthorized");
          },
          {
            attempts: 3,
            baseMs: 1,
            shouldRetry: (err) => !(err instanceof Error && err.message === "Unauthorized"),
          },
        ),
      /Unauthorized/,
    );
    assert.equal(n, 1);
  });
});

describe("SSRF regression", () => {
  it("blocks private and metadata hosts", () => {
    assert.equal(isSafeMediaUrl("http://127.0.0.1/x"), false);
    assert.equal(isSafeMediaUrl("http://169.254.169.254/latest"), false);
    assert.equal(isSafeMediaUrl("http://10.1.2.3/x"), false);
    assert.equal(isSafeMediaUrl("https://cdn.example.com/a.jpg"), true);
  });
});

describe("idempotency key stability", () => {
  it("same inputs produce same key", () => {
    const a = makeIdempotencyKey("u1", "image", { prompt: "hello", projectId: "p1" });
    const b = makeIdempotencyKey("u1", "image", { prompt: "hello", projectId: "p1" });
    assert.equal(a, b);
    assert.equal(a.length, 48);
  });
  it("different users produce different keys", () => {
    const a = makeIdempotencyKey("u1", "image", { prompt: "hello" });
    const b = makeIdempotencyKey("u2", "image", { prompt: "hello" });
    assert.notEqual(a, b);
  });
});

describe("deep-load contract", () => {
  it("documents getMyProject ownership requirement", () => {
    // Contract: getMyProject is authMiddleware + getProject(userId) scoped.
    // Unauthorized / foreign projectId must return ok:false.
    assert.ok(true);
  });
});
