import { describe, expect, it } from "vitest";
import { cryptoRandomInt, pickPrize } from "./draw.ts";
import type { Prize } from "./event.ts";

const items: Prize[] = [
  { c: "#ff0000", l: "1等", n: 1 },
  { c: "#00ff00", l: "ハズレ", n: 0 },
  { c: "#0000ff", l: "2等", n: 3 },
];

describe("pickPrize", () => {
  it("乱数の値を数の範囲に割り当てる", () => {
    expect(pickPrize(items, () => 0)).toBe(0);
    expect(pickPrize(items, () => 1)).toBe(2);
    expect(pickPrize(items, () => 3)).toBe(2);
  });

  it("乱数関数には数の合計を渡す", () => {
    let received = 0;
    pickPrize(items, (max) => {
      received = max;
      return 0;
    });
    expect(received).toBe(4);
  });

  it("数が 0 のカプセルは出ない", () => {
    for (let i = 0; i < 200; i++) {
      expect(pickPrize(items)).not.toBe(1);
    }
  });

  it("合計 0 なら例外", () => {
    expect(() => pickPrize([{ c: "#ffffff", l: "x", n: 0 }])).toThrow();
  });
});

describe("cryptoRandomInt", () => {
  it("0 以上 max 未満の整数を返す", () => {
    for (let i = 0; i < 500; i++) {
      const value = cryptoRandomInt(7);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });

  it("おおむね均等に出る", () => {
    const counts = [0, 0, 0, 0];
    const trials = 8000;
    for (let i = 0; i < trials; i++) {
      const value = cryptoRandomInt(4);
      counts[value] = (counts[value] ?? 0) + 1;
    }
    for (const count of counts) {
      expect(count / trials).toBeGreaterThan(0.2);
      expect(count / trials).toBeLessThan(0.3);
    }
  });

  it("範囲外の max は例外", () => {
    expect(() => cryptoRandomInt(0)).toThrow(RangeError);
    expect(() => cryptoRandomInt(1.5)).toThrow(RangeError);
  });
});
