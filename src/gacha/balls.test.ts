import { describe, expect, it } from "vitest";
import { ballColors } from "./balls.ts";

describe("ballColors", () => {
  it("枠の数だけ色を返し、数が 1 以上の色はすべて含む", () => {
    const colors = ballColors(
      [
        { c: "#111111", l: "1等", n: 1 },
        { c: "#222222", l: "2等", n: 3 },
        { c: "#333333", l: "参加賞", n: 100 },
        { c: "#444444", l: "なし", n: 0 },
      ],
      10,
    );
    expect(colors).toHaveLength(10);
    expect(colors).toContain("#111111");
    expect(colors).toContain("#222222");
    expect(colors).not.toContain("#444444");
    expect(colors.filter((c) => c === "#333333").length).toBeGreaterThanOrEqual(7);
  });

  it("有効な色がなければ空", () => {
    expect(ballColors([{ c: "#111111", l: "x", n: 0 }])).toEqual([]);
  });
});
