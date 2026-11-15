import { describe, expect, it } from "vitest";
import { bytesToBase64Url } from "./base64url.ts";
import { computeHash, safeEqual } from "./hash.ts";

describe("computeHash", () => {
  it("同じ入力なら同じ値になり、22 文字の Base64URL になる", async () => {
    const a = await computeHash("secret", "data");
    expect(a).toBe(await computeHash("secret", "data"));
    expect(a).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it("合言葉やデータが違えば値が変わる", async () => {
    const base = await computeHash("secret", "data");
    expect(await computeHash("secret2", "data")).not.toBe(base);
    expect(await computeHash("secret", "data2")).not.toBe(base);
  });

  it("RFC 4231 のテストケース 2 と先頭 16 バイトが一致する", async () => {
    // HMAC-SHA-256("Jefe", "what do ya want for nothing?") = 5bdcc146bf60754e6a042426089575c7...
    const hex = "5bdcc146bf60754e6a042426089575c7";
    const bytes = Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
    const expected = bytesToBase64Url(bytes);
    expect(await computeHash("Jefe", "what do ya want for nothing?")).toBe(expected);
  });
});

describe("safeEqual", () => {
  it("一致・不一致・長さ違いを判定できる", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
