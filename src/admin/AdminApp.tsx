import QRCode from "qrcode";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { DEFAULT_SECRET, IS_DEFAULT_SECRET, SECRET } from "../config.ts";
import {
  type EventConfig,
  LIMITS,
  probabilities,
  totalCount,
  validateEvent,
} from "../lib/event.ts";
import { buildGachaUrl, readTicket } from "../lib/ticket.ts";
import {
  configToDraft,
  type Draft,
  type DraftItem,
  defaultDraft,
  draftToConfig,
  gachaPageUrl,
  generateEventId,
  newKey,
  PALETTE,
  parseDraft,
} from "./draft.ts";

const DRAFT_KEY = "gacha-admin:draft";

function readStorage(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: () => Storage, key: string, value: string): void {
  try {
    storage().setItem(key, value);
  } catch {
    // 保存できなくても画面は使えるので無視する
  }
}

export function AdminApp() {
  return (
    <main className="admin">
      <header className="admin-header">
        <p className="eyebrow">管理画面</p>
        <h1>ガチャの QR を発行する</h1>
      </header>
      {IS_DEFAULT_SECRET && (
        <p className="banner banner-warn" role="note">
          合言葉が初期値（<code>{DEFAULT_SECRET}</code>
          ）のままです。本番では GitHub の Variables に <code>GACHA_SECRET</code>{" "}
          を設定してから公開してください。
        </p>
      )}
      <Editor />
    </main>
  );
}

interface Issued {
  readonly url: string;
  readonly qr: string;
  readonly config: EventConfig;
}

function Editor() {
  const [draft, setDraft] = useState<Draft>(
    () => parseDraft(readStorage(() => window.localStorage, DRAFT_KEY)) ?? defaultDraft(new Date()),
  );
  const [issued, setIssued] = useState<Issued | null>(null);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    writeStorage(() => window.localStorage, DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const config = useMemo(() => draftToConfig(draft), [draft]);
  const errors = useMemo(() => validateEvent(config), [config]);
  const stale = issued !== null && JSON.stringify(issued.config) !== JSON.stringify(config);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const updateItem = (key: string, patch: Partial<Omit<DraftItem, "key">>) =>
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }));

  const issue = async () => {
    if (errors.length > 0) return;
    setIssuing(true);
    try {
      const url = await buildGachaUrl(gachaPageUrl(window.location.href), config, SECRET);
      const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, width: 640 });
      setIssued({ url, qr, config });
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="editor">
      <EventFields draft={draft} onChange={update} />
      <PrizeTable
        items={draft.items}
        onChange={updateItem}
        onAdd={() =>
          update({
            items: [
              ...draft.items,
              {
                key: newKey(),
                c: PALETTE[draft.items.length % PALETTE.length] ?? "#e53935",
                l: `${draft.items.length + 1}等`,
                n: 1,
              },
            ],
          })
        }
        onRemove={(key) => update({ items: draft.items.filter((item) => item.key !== key) })}
        onMove={(key, delta) => {
          const index = draft.items.findIndex((item) => item.key === key);
          const target = index + delta;
          if (index < 0 || target < 0 || target >= draft.items.length) return;
          const items = [...draft.items];
          const [moved] = items.splice(index, 1);
          if (moved === undefined) return;
          items.splice(target, 0, moved);
          update({ items });
        }}
      />

      <section className="card issue" aria-labelledby="issue-title">
        <h2 id="issue-title">発行</h2>
        {errors.length > 0 && (
          <ul className="errors" aria-live="polite">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn btn-primary btn-wide"
          onClick={issue}
          disabled={errors.length > 0 || issuing}
        >
          {issuing ? "発行しています…" : "URL と QR コードを発行する"}
        </button>
        {issued !== null && <IssuedView issued={issued} stale={stale} />}
      </section>

      <ImportPanel
        onLoad={(loaded) => {
          setDraft(configToDraft(loaded));
          setIssued(null);
        }}
      />
    </div>
  );
}

function EventFields({
  draft,
  onChange,
}: {
  readonly draft: Draft;
  readonly onChange: (patch: Partial<Draft>) => void;
}) {
  const ids = {
    name: useId(),
    id: useId(),
  };
  return (
    <section className="card" aria-labelledby="event-title">
      <h2 id="event-title">イベント</h2>
      <div className="fields">
        <div className="field field-wide">
          <label htmlFor={ids.name}>イベント名</label>
          <input
            id={ids.name}
            value={draft.name}
            maxLength={LIMITS.nameMaxLength}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor={ids.id}>イベントID</label>
          <div className="inline">
            <input
              id={ids.id}
              value={draft.id}
              maxLength={LIMITS.idMaxLength}
              spellCheck={false}
              className="mono"
              onChange={(event) => onChange({ id: event.target.value })}
            />
            <button
              type="button"
              className="btn"
              onClick={() => onChange({ id: generateEventId(new Date()) })}
            >
              作り直す
            </button>
          </div>
          <p className="help">
            参加者の画面に出る結果の履歴は、この ID ごとに分けて記録します。同じイベントで QR
            を作り直すときは変えないでください。
          </p>
        </div>
      </div>
    </section>
  );
}

interface PrizeTableProps {
  readonly items: readonly DraftItem[];
  readonly onChange: (key: string, patch: Partial<Omit<DraftItem, "key">>) => void;
  readonly onAdd: () => void;
  readonly onRemove: (key: string) => void;
  readonly onMove: (key: string, delta: -1 | 1) => void;
}

function PrizeTable({ items, onChange, onAdd, onRemove, onMove }: PrizeTableProps) {
  const rates = probabilities(items);
  const total = totalCount(items);
  return (
    <section className="card" aria-labelledby="prize-title">
      <div className="card-head">
        <h2 id="prize-title">カプセル</h2>
        <p className="help">数は「出やすさ」として使います。在庫数の保証はしません。</p>
      </div>
      <div className="prize-list">
        <div className="prize-row prize-head" aria-hidden="true">
          <span>色</span>
          <span>ラベル</span>
          <span className="right">数</span>
          <span className="right">確率</span>
          <span />
        </div>
        <ol className="prize-rows">
          {items.map((item, index) => (
            <li key={item.key} className="prize-row">
              <input
                type="color"
                className="cell-color"
                aria-label={`${index + 1}行目の色`}
                value={item.c}
                onChange={(event) => onChange(item.key, { c: event.target.value })}
              />
              <input
                className="cell-label"
                aria-label={`${index + 1}行目のラベル`}
                value={item.l}
                maxLength={LIMITS.labelMaxLength}
                onChange={(event) => onChange(item.key, { l: event.target.value })}
              />
              <input
                className="cell-count"
                aria-label={`${index + 1}行目の数`}
                type="number"
                inputMode="numeric"
                min={0}
                max={LIMITS.maxCount}
                value={Number.isNaN(item.n) ? "" : item.n}
                onChange={(event) => onChange(item.key, { n: event.target.valueAsNumber })}
              />
              <span className="cell-rate">{formatRate(rates[index] ?? 0)}</span>
              <div className="cell-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`${index + 1}行目を上へ`}
                  disabled={index === 0}
                  onClick={() => onMove(item.key, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`${index + 1}行目を下へ`}
                  disabled={index === items.length - 1}
                  onClick={() => onMove(item.key, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  aria-label={`${index + 1}行目を削除`}
                  onClick={() => onRemove(item.key)}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
        <p className="prize-total">
          合計 <strong>{Number.isNaN(total) ? "-" : total}</strong>
        </p>
      </div>
      <button
        type="button"
        className="btn"
        onClick={onAdd}
        disabled={items.length >= LIMITS.maxItems}
      >
        ＋ 行を追加
      </button>
    </section>
  );
}

function formatRate(rate: number): string {
  if (!Number.isFinite(rate)) return "-";
  const percent = rate * 100;
  return `${percent < 10 ? percent.toFixed(1) : percent.toFixed(0)}%`;
}

function IssuedView({ issued, stale }: { readonly issued: Issued; readonly stale: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="issued">
      {stale && (
        <p className="banner banner-warn" role="status">
          発行後に設定を変更しました。この QR は変更前の内容です。もう一度発行してください。
        </p>
      )}
      <img
        className="qr"
        src={issued.qr}
        alt={`${issued.config.name} のガチャを開く QR コード`}
        width={320}
        height={320}
      />
      <p className="issued-meta">{issued.config.name}</p>
      <div className="url-box">
        <code>{issued.url}</code>
      </div>
      <div className="issued-actions">
        <button type="button" className="btn" onClick={copy}>
          {copied ? "コピーしました" : "URL をコピー"}
        </button>
        <a className="btn" href={issued.qr} download={`gacha-${issued.config.id}.png`}>
          QR を画像で保存
        </a>
        <a className="btn" href={issued.url} target="_blank" rel="noreferrer">
          ガチャ画面を開く
        </a>
      </div>
    </div>
  );
}

function ImportPanel({ onLoad }: { readonly onLoad: (config: EventConfig) => void }) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = async (event: FormEvent) => {
    event.preventDefault();
    let fragment = value.trim();
    try {
      fragment = new URL(fragment).hash;
    } catch {
      // URL でなければ #d=… の部分だけが貼られたとみなす
    }
    const result = await readTicket(fragment, SECRET);
    if (result.kind === "ok") {
      onLoad(result.config);
      setValue("");
      setError(null);
    } else {
      setError(
        result.kind === "missing"
          ? "URL に d と h が見つかりません。"
          : "この URL は無効です（書き換えられているか、合言葉が変わっています）。",
      );
    }
  };
  return (
    <details className="card import">
      <summary>発行済みの URL から読み込む</summary>
      <form className="import-form" onSubmit={load}>
        <label htmlFor={inputId}>ガチャの URL</label>
        <input
          id={inputId}
          value={value}
          placeholder="https://…/#d=…&h=…"
          spellCheck={false}
          className="mono"
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
        />
        {error !== null && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn" disabled={value.trim() === ""}>
          読み込む
        </button>
      </form>
    </details>
  );
}
