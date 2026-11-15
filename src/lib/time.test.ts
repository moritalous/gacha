import { describe, expect, it } from "vitest";
import { eventDate, isoToLocalInput, localInputToIso } from "./time.ts";

describe("eventDate", () => {
  it("日本時間の日付を返す", () => {
    expect(eventDate(new Date("2026-11-30T14:59:59Z"))).toBe("2026-11-30");
    expect(eventDate(new Date("2026-11-30T15:00:00Z"))).toBe("2026-12-01");
  });
});

describe("datetime-local の変換", () => {
  it("日本時間として ISO 8601 にする", () => {
    expect(localInputToIso("2026-12-01T10:00")).toBe("2026-12-01T10:00:00+09:00");
    expect(localInputToIso("")).toBe("");
  });

  it("ISO 8601 から日本時間の入力値に戻す", () => {
    expect(isoToLocalInput("2026-12-01T10:00:00+09:00")).toBe("2026-12-01T10:00");
    expect(isoToLocalInput("2026-12-01T01:00:00Z")).toBe("2026-12-01T10:00");
    expect(isoToLocalInput("bad")).toBe("");
  });
});
