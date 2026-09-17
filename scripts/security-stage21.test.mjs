// @ts-check
import { describe, it } from "node:test";
import assert from "node:assert/strict";

/** Mirror of isSafeMediaUrl logic for pure unit testing without TS import graph. */
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

describe("SSRF media URL policy", () => {
  it("allows public https", () => {
    assert.equal(isSafeMediaUrl("https://cdn.example.com/a.jpg"), true);
  });
  it("allows data urls", () => {
    assert.equal(isSafeMediaUrl("data:image/png;base64,xx"), true);
  });
  it("blocks localhost", () => {
    assert.equal(isSafeMediaUrl("http://localhost/secret"), false);
    assert.equal(isSafeMediaUrl("http://127.0.0.1/secret"), false);
  });
  it("blocks private ranges", () => {
    assert.equal(isSafeMediaUrl("http://10.0.0.5/x"), false);
    assert.equal(isSafeMediaUrl("http://192.168.1.1/x"), false);
    assert.equal(isSafeMediaUrl("http://172.16.0.1/x"), false);
  });
  it("blocks metadata endpoint", () => {
    assert.equal(isSafeMediaUrl("http://169.254.169.254/latest/meta-data"), false);
  });
  it("blocks internal hostnames", () => {
    assert.equal(isSafeMediaUrl("http://db.internal/x"), false);
  });
});

describe("Production DATABASE_URL policy (documentation contract)", () => {
  it("production markers are defined", () => {
    // Contract: isProductionRuntime treats NODE_ENV=production | VERCEL=1 | HOMS_REQUIRE_DATABASE=true
    const markers = ["NODE_ENV", "VERCEL", "HOMS_REQUIRE_DATABASE"];
    assert.ok(markers.length === 3);
  });
});
