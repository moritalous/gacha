import type { EventConfig } from "./event.ts";

export type EventStatus =
  | { readonly kind: "notStarted" }
  | { readonly kind: "ended" }
  | { readonly kind: "limitReached" }
  | { readonly kind: "ready"; readonly remaining: number };

/** 現在時刻と本日の使用回数から、回せるかどうかを判定します。 */
export function evaluateStatus(config: EventConfig, now: Date, usedToday: number): EventStatus {
  const time = now.getTime();
  if (time < Date.parse(config.from)) {
    return { kind: "notStarted" };
  }
  if (time >= Date.parse(config.to)) {
    return { kind: "ended" };
  }
  const remaining = config.daily - usedToday;
  return remaining > 0 ? { kind: "ready", remaining } : { kind: "limitReached" };
}
