import { describe, expect, it } from "vitest";
import { base64UrlToBytes, bytesToBase64Url, decodeText, encodeText } from "./base64url.ts";

describe("base64url", () => {
  it("日本語を含む文字列を往復できる", () => {
    const text = '{"name":"冬のイベント抽選会🎁"}';
    const encoded = encodeText(text);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeText(encoded)).toBe(text);
  });

  it("+ / = を使わない", () => {
    const encoded = bytesToBase64Url(new Uint8Array([0xfb, 0xff, 0xfe]));
    expect(encoded).toBe("-__-");
  });

  it("不正な文字や長さは null を返す", () => {
    expect(base64UrlToBytes("abc$")).toBeNull();
    expect(base64UrlToBytes("a")).toBeNull();
    expect(decodeText("_w")).toBeNull(); // 0xff は UTF-8 として不正
  });
});
