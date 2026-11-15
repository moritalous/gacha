import type { EventConfig } from "../lib/event.ts";
import type { KeyValueStore } from "../lib/storage.ts";

const HOUR = 60 * 60 * 1000;

/** 現在時刻を含む有効期間のイベント設定を作ります。 */
export function sampleConfig(overrides: Partial<EventConfig> = {}): EventConfig {
  const now = Date.now();
  return {
    v: 1,
    id: "evt-test",
    name: "テスト抽選会",
    from: new Date(now - HOUR).toISOString(),
    to: new Date(now + HOUR).toISOString(),
    daily: 2,
    items: [
      { c: "#e53935", l: "1等", n: 1 },
      { c: "#1e88e5", l: "2等", n: 3 },
    ],
    ...overrides,
  };
}

/** Map を使ったテスト用の保存領域です。 */
export function memoryStore(): KeyValueStore & { readonly data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}
