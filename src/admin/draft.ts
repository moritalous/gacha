import type { EventConfig } from "../lib/event.ts";
import { eventDate } from "../lib/time.ts";

/** 管理画面の入力中の状態です。 */
export interface DraftItem {
  /** React の key 用 */
  readonly key: string;
  readonly c: string;
  readonly l: string;
  readonly n: number;
}

export interface Draft {
  readonly id: string;
  readonly name: string;
  readonly items: readonly DraftItem[];
}

/** 新しい行に順番に割り当てる色です。 */
export const PALETTE = [
  "#e53935",
  "#1e88e5",
  "#fdd835",
  "#43a047",
  "#8e24aa",
  "#fb8c00",
  "#00acc1",
  "#ec407a",
  "#6d4c41",
  "#fafafa",
] as const;

export function newKey(): string {
  return crypto.randomUUID();
}

/** 例：evt-20261201-k3f9 */
export function generateEventId(now: Date): string {
  const date = eventDate(now).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 6).padEnd(4, "0");
  return `evt-${date}-${suffix}`;
}

export function defaultDraft(now: Date): Draft {
  return {
    id: generateEventId(now),
    name: "イベント抽選会",
    items: [
      { key: newKey(), c: "#e53935", l: "1等", n: 1 },
      { key: newKey(), c: "#1e88e5", l: "2等", n: 3 },
      { key: newKey(), c: "#fdd835", l: "3等", n: 10 },
      { key: newKey(), c: "#fafafa", l: "参加賞", n: 50 },
    ],
  };
}

export function draftToConfig(draft: Draft): EventConfig {
  return {
    v: 1,
    id: draft.id.trim(),
    name: draft.name.trim(),
    items: draft.items.map(({ c, l, n }) => ({ c: c.toLowerCase(), l: l.trim(), n })),
  };
}

export function configToDraft(config: EventConfig): Draft {
  return {
    id: config.id,
    name: config.name,
    items: config.items.map((item) => ({ key: newKey(), ...item })),
  };
}

function isDraftItem(value: unknown): value is DraftItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item["key"] === "string" &&
    typeof item["c"] === "string" &&
    typeof item["l"] === "string" &&
    typeof item["n"] === "number"
  );
}

/** 保存しておいた下書きを読み込みます。形が合わなければ `null` です。 */
export function parseDraft(raw: string | null): Draft | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const draft = value as Record<string, unknown>;
    const items = draft["items"];
    if (
      typeof draft["id"] !== "string" ||
      typeof draft["name"] !== "string" ||
      !Array.isArray(items) ||
      !items.every(isDraftItem)
    ) {
      return null;
    }
    return {
      id: draft["id"],
      name: draft["name"],
      items,
    };
  } catch {
    return null;
  }
}

/** 管理画面の URL から、同じ階層にある index.html の URL を求めます。 */
export function gachaPageUrl(adminUrl: string): string {
  return new URL("./", adminUrl).toString();
}
