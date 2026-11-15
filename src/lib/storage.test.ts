import { describe, expect, it } from "vitest";
import { memoryStore } from "../test/fixtures.ts";
import { DrawHistory } from "./storage.ts";

const prize = { c: "#ff0000", l: "1等", n: 1 };
const at = new Date("2026-12-01T01:00:00Z");

describe("DrawHistory", () => {
  it("追加した記録を日付ごとに読み出せる", () => {
    const history = new DrawHistory(memoryStore());
    history.add("evt", "2026-12-01", prize, 0, at);
    history.add("evt", "2026-12-01", prize, 0, at);
    history.add("evt", "2026-12-02", prize, 0, at);
    expect(history.list("evt", "2026-12-01")).toHaveLength(2);
    expect(history.list("evt", "2026-12-02")).toHaveLength(1);
    expect(history.list("other", "2026-12-01")).toHaveLength(0);
  });

  it("記録の中身を保存する", () => {
    const history = new DrawHistory(memoryStore());
    const record = history.add("evt", "2026-12-01", prize, 3, at);
    expect(record).toMatchObject({
      at: at.toISOString(),
      index: 3,
      label: "1等",
      color: "#ff0000",
      claimed: false,
    });
  });

  it("受け取り済みにできる", () => {
    const history = new DrawHistory(memoryStore());
    const first = history.add("evt", "d", prize, 0, at);
    const second = history.add("evt", "d", prize, 0, at);
    const records = history.markClaimed("evt", "d", first.id);
    expect(records.find((r) => r.id === first.id)?.claimed).toBe(true);
    expect(records.find((r) => r.id === second.id)?.claimed).toBe(false);
    expect(history.list("evt", "d")).toEqual(records);
  });

  it("壊れたデータは空として扱う", () => {
    const store = memoryStore();
    store.setItem("gacha:v1:evt:d", "{broken");
    expect(new DrawHistory(store).list("evt", "d")).toEqual([]);
    store.setItem("gacha:v1:evt:d", JSON.stringify([{ id: 1 }]));
    expect(new DrawHistory(store).list("evt", "d")).toEqual([]);
  });
});
