import { decodeText, encodeText } from "./base64url.ts";
import { type EventConfig, parseEvent } from "./event.ts";
import { computeHash, safeEqual } from "./hash.ts";

/** URL のフラグメント（# 以降）に載せる値です。 */
export interface Ticket {
  /** 設定 JSON を Base64URL にしたもの */
  readonly d: string;
  /** d と合言葉から計算したハッシュ */
  readonly h: string;
}

export type TicketResult =
  | { readonly kind: "missing" }
  | { readonly kind: "invalid" }
  | { readonly kind: "ok"; readonly config: EventConfig };

/** 設定からチケット（d と h）を作ります。 */
export async function issueTicket(config: EventConfig, secret: string): Promise<Ticket> {
  // キーの順序を固定するため、明示的に組み立ててから文字列にする
  const ordered: EventConfig = {
    v: config.v,
    id: config.id,
    name: config.name,
    from: config.from,
    to: config.to,
    daily: config.daily,
    items: config.items.map(({ c, l, n }) => ({ c, l, n })),
  };
  const d = encodeText(JSON.stringify(ordered));
  // ハッシュは JSON ではなく d の文字列そのものに対して計算する
  const h = await computeHash(secret, d);
  return { d, h };
}

/** ガチャ画面の URL を組み立てます。`pageUrl` は index.html の URL です。 */
export async function buildGachaUrl(
  pageUrl: string,
  config: EventConfig,
  secret: string,
): Promise<string> {
  const { d, h } = await issueTicket(config, secret);
  const url = new URL(pageUrl);
  url.search = "";
  url.hash = new URLSearchParams({ d, h }).toString();
  return url.toString();
}

/** `#d=…&h=…` を読み取り、ハッシュと内容を確かめます。 */
export async function readTicket(fragment: string, secret: string): Promise<TicketResult> {
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  const d = params.get("d");
  const h = params.get("h");
  if (!d || !h) {
    return { kind: "missing" };
  }
  const expected = await computeHash(secret, d);
  if (!safeEqual(expected, h)) {
    return { kind: "invalid" };
  }
  const json = decodeText(d);
  if (json === null) {
    return { kind: "invalid" };
  }
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { kind: "invalid" };
  }
  const config = parseEvent(value);
  return config ? { kind: "ok", config } : { kind: "invalid" };
}
