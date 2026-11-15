import { describe, expect, it } from "vitest";
import { sampleConfig } from "../test/fixtures.ts";
import { parseEvent, probabilities, totalCount, validateEvent } from "./event.ts";

describe("validateEvent", () => {
  it("正しい設定ならエラーなし", () => {
    expect(validateEvent(sampleConfig())).toEqual([]);
  });

  it.each([
    ["ID に使えない文字", { id: "evt test" }],
    ["空のイベント名", { name: " " }],
    ["カプセルなし", { items: [] }],
    ["色の形式", { items: [{ c: "red", l: "1等", n: 1 }] }],
    ["空のラベル", { items: [{ c: "#ff0000", l: "", n: 1 }] }],
    ["負の数", { items: [{ c: "#ff0000", l: "1等", n: -1 }] }],
    ["合計 0", { items: [{ c: "#ff0000", l: "1等", n: 0 }] }],
  ])("%s はエラー", (_, overrides) => {
    expect(validateEvent(sampleConfig(overrides)).length).toBeGreaterThan(0);
  });
});

describe("probabilities", () => {
  it("数の比率を返す", () => {
    const items = sampleConfig().items;
    expect(totalCount(items)).toBe(4);
    expect(probabilities(items)).toEqual([0.25, 0.75]);
  });
});

describe("parseEvent", () => {
  it("余計なキーは捨てて読み込む", () => {
    const config = sampleConfig();
    expect(parseEvent({ ...config, extra: true })).toEqual(config);
  });

  it.each([null, [], "x", { ...sampleConfig(), v: 2 }, { ...sampleConfig(), items: [{ c: 1 }] }])(
    "形が違う値は null（%j）",
    (value) => {
      expect(parseEvent(value)).toBeNull();
    },
  );
});
