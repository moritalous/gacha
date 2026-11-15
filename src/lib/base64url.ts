/** バイト列を Base64URL（パディングなし）に変換します。 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** Base64URL をバイト列に戻します。形式が不正なときは `null` を返します。 */
export function base64UrlToBytes(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) {
    return null;
  }
  const base64 = text.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/** 文字列を UTF-8 として Base64URL に変換します。 */
export function encodeText(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

/** Base64URL を UTF-8 文字列に戻します。不正なときは `null` を返します。 */
export function decodeText(text: string): string | null {
  const bytes = base64UrlToBytes(text);
  if (bytes === null) {
    return null;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
