/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GACHA_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
