import { describe, expect, it } from "vitest";
import { sampleConfig } from "../test/fixtures.ts";
import { evaluateStatus } from "./status.ts";

const config = sampleConfig({
  from: "2026-12-01T10:00:00+09:00",
  to: "2026-12-01T18:00:00+09:00",
  daily: 3,
});

describe("evaluateStatus", () => {
  it("期間前・期間後", () => {
    expect(evaluateStatus(config, new Date("2026-12-01T09:59:59+09:00"), 0).kind).toBe(
      "notStarted",
    );
    expect(evaluateStatus(config, new Date("2026-12-01T18:00:00+09:00"), 0).kind).toBe("ended");
  });

  it("期間内は残り回数を返す", () => {
    const now = new Date("2026-12-01T10:00:00+09:00");
    expect(evaluateStatus(config, now, 0)).toEqual({ kind: "ready", remaining: 3 });
    expect(evaluateStatus(config, now, 2)).toEqual({ kind: "ready", remaining: 1 });
    expect(evaluateStatus(config, now, 3)).toEqual({ kind: "limitReached" });
  });
});
