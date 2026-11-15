import type { EventConfig } from "../lib/event.ts";
import type { KeyValueStore } from "../lib/storage.ts";

/** テスト用のイベント設定を作ります。 */
export function sampleConfig(overrides: Partial<EventConfig> = {}): EventConfig {
  return {
    v: 1,
    id: "evt-test",
    name: "テスト抽選会",
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
