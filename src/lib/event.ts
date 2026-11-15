/** カプセル 1 種類分の設定です。キー名は URL を短くするため 1 文字にしています。 */
export interface Prize {
  /** カプセルの色（#rrggbb） */
  readonly c: string;
  /** ラベル（例：1等） */
  readonly l: string;
  /** 数。抽選では確率の重みとして使います */
  readonly n: number;
}

/** URL の `d` に入るイベント設定です。 */
export interface EventConfig {
  readonly v: 1;
  /** イベント ID。回数を数える単位です */
  readonly id: string;
  /** イベント名 */
  readonly name: string;
  /** 有効期間の開始（ISO 8601、タイムゾーン付き） */
  readonly from: string;
  /** 有効期間の終了（ISO 8601、タイムゾーン付き） */
  readonly to: string;
  /** 1 日に回せる回数 */
  readonly daily: number;
  readonly items: readonly Prize[];
}

export const LIMITS = {
  idMaxLength: 40,
  nameMaxLength: 40,
  labelMaxLength: 20,
  maxItems: 12,
  maxCount: 9999,
  maxDaily: 99,
} as const;

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/** 入力チェックの結果です。問題がなければ空配列になります。 */
export function validateEvent(config: EventConfig): string[] {
  const errors: string[] = [];
  if (!ID_PATTERN.test(config.id) || config.id.length > LIMITS.idMaxLength) {
    errors.push(
      `イベントIDは半角英数字・ハイフン・アンダースコアで ${LIMITS.idMaxLength} 文字以内にしてください。`,
    );
  }
  if (config.name.trim() === "" || config.name.length > LIMITS.nameMaxLength) {
    errors.push(`イベント名は 1〜${LIMITS.nameMaxLength} 文字で入力してください。`);
  }
  const from = Date.parse(config.from);
  const to = Date.parse(config.to);
  if (Number.isNaN(from) || Number.isNaN(to)) {
    errors.push("有効期間の開始と終了を入力してください。");
  } else if (from >= to) {
    errors.push("有効期間の終了は開始より後にしてください。");
  }
  if (!Number.isInteger(config.daily) || config.daily < 1 || config.daily > LIMITS.maxDaily) {
    errors.push(`1日に回せる回数は 1〜${LIMITS.maxDaily} の整数にしてください。`);
  }
  if (config.items.length === 0 || config.items.length > LIMITS.maxItems) {
    errors.push(`カプセルは 1〜${LIMITS.maxItems} 種類にしてください。`);
  }
  config.items.forEach((item, index) => {
    const row = `${index + 1}行目`;
    if (!COLOR_PATTERN.test(item.c)) {
      errors.push(`${row}：色の形式が正しくありません。`);
    }
    if (item.l.trim() === "" || item.l.length > LIMITS.labelMaxLength) {
      errors.push(`${row}：ラベルは 1〜${LIMITS.labelMaxLength} 文字で入力してください。`);
    }
    if (!Number.isInteger(item.n) || item.n < 0 || item.n > LIMITS.maxCount) {
      errors.push(`${row}：数は 0〜${LIMITS.maxCount} の整数にしてください。`);
    }
  });
  if (config.items.length > 0 && totalCount(config.items) === 0) {
    errors.push("数の合計が 0 です。少なくとも 1 つは 1 以上にしてください。");
  }
  return errors;
}

export function totalCount(items: readonly Prize[]): number {
  return items.reduce((sum, item) => sum + item.n, 0);
}

/** 各カプセルが出る確率（0〜1）を返します。 */
export function probabilities(items: readonly Prize[]): number[] {
  const total = totalCount(items);
  return items.map((item) => (total === 0 ? 0 : item.n / total));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrize(value: unknown): value is Prize {
  return (
    isRecord(value) &&
    typeof value["c"] === "string" &&
    typeof value["l"] === "string" &&
    typeof value["n"] === "number"
  );
}

/**
 * JSON から復元した値が EventConfig の形をしていて、内容も正しいかを確かめます。
 * ハッシュが一致していても、念のため中身を検査します。
 */
export function parseEvent(value: unknown): EventConfig | null {
  if (!isRecord(value)) {
    return null;
  }
  const { v, id, name, from, to, daily, items } = value;
  if (
    v !== 1 ||
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof from !== "string" ||
    typeof to !== "string" ||
    typeof daily !== "number" ||
    !Array.isArray(items) ||
    !items.every(isPrize)
  ) {
    return null;
  }
  const config: EventConfig = {
    v,
    id,
    name,
    from,
    to,
    daily,
    items: items.map(({ c, l, n }) => ({ c, l, n })),
  };
  return validateEvent(config).length === 0 ? config : null;
}
