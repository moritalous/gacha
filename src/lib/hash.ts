import { bytesToBase64Url } from "./base64url.ts";

/** URL に載せるハッシュの長さ（バイト）。Base64URL で 22 文字になります。 */
const HASH_BYTES = 16;

/**
 * 合言葉を鍵にした HMAC-SHA-256 を計算し、先頭 16 バイトを Base64URL で返します。
 */
export async function computeHash(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToBase64Url(new Uint8Array(signature).slice(0, HASH_BYTES));
}

/** 文字列を、長さ以外の情報で比較時間が変わらないように比べます。 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
