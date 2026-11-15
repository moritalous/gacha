/**
 * URL の改ざんチェックに使う合言葉です。
 *
 * - ビルド時の環境変数 `VITE_GACHA_SECRET` があればその値を使います
 *   （GitHub Actions ではリポジトリの Secret `GACHA_SECRET` から渡します）。
 * - 管理画面とガチャ画面の両方がこの値でハッシュを計算します。
 * - 値を変えて公開し直すと、それまでに発行した URL はすべて無効になります。
 * - 配信される JavaScript には含まれるため、ソースを読めば見える値です。
 *   「URL を書き換えただけでは通らない」程度の対策として使ってください。
 */
export const DEFAULT_SECRET = "change-me";

const fromEnv = import.meta.env.VITE_GACHA_SECRET;

export const SECRET: string = fromEnv !== undefined && fromEnv !== "" ? fromEnv : DEFAULT_SECRET;

export const IS_DEFAULT_SECRET = SECRET === DEFAULT_SECRET;
