/** イベントの日付判定に使うタイムゾーンです。 */
export const EVENT_TIME_ZONE = "Asia/Tokyo";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: EVENT_TIME_ZONE,
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const clockFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: EVENT_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** 日本時間での日付（YYYY-MM-DD）を返します。端末のタイムゾーン設定には依存しません。 */
export function eventDate(now: Date): string {
  return dateFormatter.format(now);
}

/** 例：12/1(月) 10:00 */
export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** 例：10:15:42 */
export function formatClock(value: Date | string): string {
  return clockFormatter.format(typeof value === "string" ? new Date(value) : value);
}
