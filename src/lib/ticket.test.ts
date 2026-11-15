import { describe, expect, it } from "vitest";
import { sampleConfig } from "../test/fixtures.ts";
import { encodeText } from "./base64url.ts";
import { computeHash } from "./hash.ts";
import { buildGachaUrl, issueTicket, readTicket } from "./ticket.ts";

const SECRET = "test-secret";

function fragmentOf(d: string, h: string): string {
  return `#${new URLSearchParams({ d, h }).toString()}`;
}

describe("issueTicket / readTicket", () => {
  it("発行したチケットを読み戻せる", async () => {
    const config = sampleConfig();
    const { d, h } = await issueTicket(config, SECRET);
    const result = await readTicket(fragmentOf(d, h), SECRET);
    expect(result).toEqual({ kind: "ok", config });
  });

  it("d か h がなければ missing", async () => {
    expect(await readTicket("", SECRET)).toEqual({ kind: "missing" });
    expect(await readTicket("#d=abc", SECRET)).toEqual({ kind: "missing" });
    expect(await readTicket("#h=abc", SECRET)).toEqual({ kind: "missing" });
  });

  it("d を書き換えると invalid", async () => {
    const config = sampleConfig();
    const { h } = await issueTicket(config, SECRET);
    const tampered = encodeText(JSON.stringify({ ...config, name: "書き換え" }));
    expect(await readTicket(fragmentOf(tampered, h), SECRET)).toEqual({ kind: "invalid" });
  });

  it("h を書き換えると invalid", async () => {
    const { d, h } = await issueTicket(sampleConfig(), SECRET);
    const flipped = `${h.slice(0, -1)}${h.endsWith("A") ? "B" : "A"}`;
    expect(await readTicket(fragmentOf(d, flipped), SECRET)).toEqual({ kind: "invalid" });
  });

  it("合言葉が変わると、それまでのチケットは invalid", async () => {
    const { d, h } = await issueTicket(sampleConfig(), SECRET);
    expect(await readTicket(fragmentOf(d, h), "new-secret")).toEqual({ kind: "invalid" });
  });

  it("ハッシュが合っていても、中身が不正なら invalid", async () => {
    const d = encodeText(JSON.stringify({ ...sampleConfig(), items: [] }));
    const h = await computeHash(SECRET, d);
    expect(await readTicket(fragmentOf(d, h), SECRET)).toEqual({ kind: "invalid" });
  });

  it("JSON でない中身は invalid", async () => {
    const d = encodeText("not json");
    const h = await computeHash(SECRET, d);
    expect(await readTicket(fragmentOf(d, h), SECRET)).toEqual({ kind: "invalid" });
  });
});

describe("buildGachaUrl", () => {
  it("ページの URL にフラグメントとして d と h を付ける", async () => {
    const url = new URL(
      await buildGachaUrl("https://example.github.io/gacha/?x=1", sampleConfig(), SECRET),
    );
    expect(url.origin + url.pathname).toBe("https://example.github.io/gacha/");
    expect(url.search).toBe("");
    const result = await readTicket(url.hash, SECRET);
    expect(result.kind).toBe("ok");
  });
});
