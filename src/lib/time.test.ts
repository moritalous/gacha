import { describe, expect, it } from "vitest";
import { eventDate } from "./time.ts";

describe("eventDate", () => {
  it("日本時間の日付を返す", () => {
    expect(eventDate(new Date("2026-11-30T14:59:59Z"))).toBe("2026-11-30");
    expect(eventDate(new Date("2026-11-30T15:00:00Z"))).toBe("2026-12-01");
  });
});
