import { describe, expect, it } from "vitest";
import { validateEvent } from "../lib/event.ts";
import {
  configToDraft,
  defaultDraft,
  draftToConfig,
  gachaPageUrl,
  generateEventId,
  parseDraft,
} from "./draft.ts";

const now = new Date("2026-12-01T01:00:00Z");

describe("draft", () => {
  it("初期値はそのまま発行できる内容になっている", () => {
    expect(validateEvent(draftToConfig(defaultDraft(now)))).toEqual([]);
  });

  it("設定と下書きを往復できる", () => {
    const config = draftToConfig(defaultDraft(now));
    expect(draftToConfig(configToDraft(config))).toEqual(config);
  });

  it("イベント ID に日付を含める", () => {
    expect(generateEventId(now)).toMatch(/^evt-20261201-[a-z0-9]{4}$/);
  });

  it("保存した下書きを読み込み、壊れていれば null", () => {
    const draft = defaultDraft(now);
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("{")).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, items: [{}] }))).toBeNull();
  });

  it("管理画面と同じ階層のガチャ画面 URL を返す", () => {
    expect(gachaPageUrl("https://example.github.io/gacha/admin.html")).toBe(
      "https://example.github.io/gacha/",
    );
    expect(gachaPageUrl("http://localhost:5173/admin.html?x=1#y")).toBe("http://localhost:5173/");
  });
});
