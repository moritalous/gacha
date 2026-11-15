import type { Prize } from "./event.ts";

/** 1 回分の抽選結果です。 */
export interface DrawRecord {
  readonly id: string;
  /** 抽選日時（ISO 8601） */
  readonly at: string;
  readonly index: number;
  readonly label: string;
  readonly color: string;
  readonly claimed: boolean;
}

/** localStorage と同じ形の最小インターフェースです。テストで差し替えられます。 */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

const KEY_PREFIX = "gacha:v1";

function storageKey(eventId: string, date: string): string {
  return `${KEY_PREFIX}:${eventId}:${date}`;
}

function isDrawRecord(value: unknown): value is DrawRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record["id"] === "string" &&
    typeof record["at"] === "string" &&
    typeof record["index"] === "number" &&
    typeof record["label"] === "string" &&
    typeof record["color"] === "string" &&
    typeof record["claimed"] === "boolean"
  );
}

/** イベント ID と日付ごとに、抽選の記録を読み書きします。 */
export class DrawHistory {
  readonly #store: KeyValueStore;

  constructor(store: KeyValueStore) {
    this.#store = store;
  }

  list(eventId: string, date: string): DrawRecord[] {
    const raw = this.#store.getItem(storageKey(eventId, date));
    if (raw === null) {
      return [];
    }
    try {
      const value: unknown = JSON.parse(raw);
      return Array.isArray(value) ? value.filter(isDrawRecord) : [];
    } catch {
      return [];
    }
  }

  add(eventId: string, date: string, prize: Prize, index: number, at: Date): DrawRecord {
    const record: DrawRecord = {
      id: crypto.randomUUID(),
      at: at.toISOString(),
      index,
      label: prize.l,
      color: prize.c,
      claimed: false,
    };
    this.#save(eventId, date, [...this.list(eventId, date), record]);
    return record;
  }

  markClaimed(eventId: string, date: string, recordId: string): DrawRecord[] {
    const records = this.list(eventId, date).map((record) =>
      record.id === recordId ? { ...record, claimed: true } : record,
    );
    this.#save(eventId, date, records);
    return records;
  }

  #save(eventId: string, date: string, records: readonly DrawRecord[]): void {
    this.#store.setItem(storageKey(eventId, date), JSON.stringify(records));
  }
}

/**
 * ブラウザの localStorage を返します。使えない環境（保存がブロックされている等）では `null` です。
 */
export function getBrowserStore(): KeyValueStore | null {
  try {
    const store = window.localStorage;
    const probe = `${KEY_PREFIX}:probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}
