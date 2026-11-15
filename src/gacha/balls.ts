import type { Prize } from "../lib/event.ts";

/** ドームの中に並べるカプセルの位置（%）。下の段から積み上げます。 */
export const BALL_POSITIONS: readonly (readonly [x: number, y: number])[] = [
  [22, 74],
  [36, 77],
  [50, 78],
  [64, 77],
  [78, 74],
  [29, 61],
  [43, 63],
  [57, 63],
  [71, 61],
  [22, 47],
  [36, 49],
  [50, 50],
  [64, 49],
  [78, 47],
  [36, 35],
  [50, 36],
  [64, 35],
];

/**
 * ドームに表示するカプセルの色を、数の比率に合わせて決めます。
 * 数が 1 以上の色は、少なくとも 1 つは表示します。
 */
export function ballColors(items: readonly Prize[], slots = BALL_POSITIONS.length): string[] {
  const active = items.filter((item) => item.n > 0).slice(0, slots);
  if (active.length === 0) {
    return [];
  }
  const total = active.reduce((sum, item) => sum + item.n, 0);
  const counts = active.map(() => 1);
  let rest = slots - active.length;
  // 残りの枠を、比率に近づくように 1 つずつ配る
  while (rest > 0) {
    let best = 0;
    let bestGap = Number.NEGATIVE_INFINITY;
    active.forEach((item, index) => {
      const gap = (item.n / total) * slots - (counts[index] ?? 0);
      if (gap > bestGap) {
        bestGap = gap;
        best = index;
      }
    });
    counts[best] = (counts[best] ?? 0) + 1;
    rest--;
  }
  const colors = active.flatMap((item, index) =>
    Array.from({ length: counts[index] ?? 0 }, () => item.c),
  );
  // 同じ色が固まらないよう、決まった順序で混ぜる
  return colors.map((_, i) => colors[(i * 7) % colors.length] ?? "#ffffff");
}
