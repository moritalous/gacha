import { useCallback, useEffect, useMemo, useState } from "react";
import { SECRET } from "../config.ts";
import { pickPrize } from "../lib/draw.ts";
import type { EventConfig } from "../lib/event.ts";
import {
  DrawHistory,
  type DrawRecord,
  getBrowserStore,
  type KeyValueStore,
  memoryStore,
} from "../lib/storage.ts";
import { readTicket } from "../lib/ticket.ts";
import { eventDate, formatClock } from "../lib/time.ts";
import { prefersReducedMotion } from "../shared/motion.ts";
import { useNow } from "../shared/useNow.ts";
import { Capsule } from "./Capsule.tsx";
import { Machine } from "./Machine.tsx";
import { ResultSheet } from "./ResultSheet.tsx";

type TicketState =
  | { readonly kind: "checking" }
  | { readonly kind: "missing" }
  | { readonly kind: "invalid" }
  | { readonly kind: "ok"; readonly config: EventConfig };

/** 画面に出す結果の件数 */
const HISTORY_SIZE = 10;

type Phase =
  | { readonly kind: "idle" }
  | { readonly kind: "spinning"; readonly record: DrawRecord }
  | { readonly kind: "result"; readonly recordId: string };

export interface GachaAppProps {
  /** テスト用。省略時はブラウザの localStorage を使います */
  readonly store?: KeyValueStore | null;
  /** 演出の長さ（ミリ秒）。省略時は 2600ms（動きを減らす設定なら 300ms） */
  readonly spinMs?: number;
}

function useTicket(): TicketState {
  const [state, setState] = useState<TicketState>({ kind: "checking" });
  useEffect(() => {
    let active = true;
    const check = () => {
      readTicket(window.location.hash, SECRET).then(
        (result) => {
          if (active) setState(result);
        },
        () => {
          if (active) setState({ kind: "invalid" });
        },
      );
    };
    check();
    window.addEventListener("hashchange", check);
    return () => {
      active = false;
      window.removeEventListener("hashchange", check);
    };
  }, []);
  return state;
}

export function GachaApp({ store, spinMs }: GachaAppProps) {
  const ticket = useTicket();
  const history = useMemo(() => {
    // 保存できない環境でも回せるよう、その場合はページを開いている間だけ記録する
    const resolved = (store === undefined ? getBrowserStore() : store) ?? memoryStore();
    return new DrawHistory(resolved);
  }, [store]);

  if (ticket.kind === "checking") {
    return <Notice title="読み込み中です" />;
  }
  if (ticket.kind === "missing") {
    return (
      <Notice title="QR コードから開いてください">
        配布された QR コードを読み取ると、ガチャを回せます。
      </Notice>
    );
  }
  if (ticket.kind === "invalid") {
    return (
      <Notice title="無効な QR コードです">
        URL が途中で切れているか、古い QR コードの可能性があります。受付でお問い合わせください。
      </Notice>
    );
  }
  return (
    <Gacha
      config={ticket.config}
      history={history}
      spinMs={spinMs ?? (prefersReducedMotion() ? 300 : 2600)}
    />
  );
}

interface GachaProps {
  readonly config: EventConfig;
  readonly history: DrawHistory;
  readonly spinMs: number;
}

function Gacha({ config, history, spinMs }: GachaProps) {
  const now = useNow();
  const date = eventDate(now);
  const [records, setRecords] = useState<DrawRecord[]>(() => history.list(config.id, date));
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  // 日付が変わったら、その日の記録を読み直す
  useEffect(() => {
    setRecords(history.list(config.id, date));
  }, [history, config.id, date]);

  useEffect(() => {
    if (phase.kind !== "spinning") return;
    const timer = window.setTimeout(() => {
      setPhase({ kind: "result", recordId: phase.record.id });
      navigator.vibrate?.(80);
    }, spinMs);
    return () => window.clearTimeout(timer);
  }, [phase, spinMs]);

  const spin = useCallback(() => {
    if (phase.kind !== "idle") return;
    const index = pickPrize(config.items);
    const prize = config.items[index];
    if (prize === undefined) return;
    // 演出より前に保存する。途中で再読み込みしても結果は変わらない
    const record = history.add(config.id, date, prize, index, new Date());
    setRecords(history.list(config.id, date));
    setPhase({ kind: "spinning", record });
  }, [phase.kind, config, history, date]);

  const resultRecord =
    phase.kind === "result" ? records.find((record) => record.id === phase.recordId) : undefined;
  const recent = records.slice(-HISTORY_SIZE).reverse();

  return (
    <main className="gacha">
      <header className="gacha-header">
        <h1>{config.name}</h1>
      </header>

      <Machine
        items={config.items}
        spinning={phase.kind === "spinning"}
        dropColor={phase.kind === "spinning" ? phase.record.color : null}
        spinMs={spinMs}
      />

      <div className="controls">
        {phase.kind === "spinning" && <p className="status">どれが出るかな…</p>}
        <button
          type="button"
          className="btn btn-spin"
          onClick={spin}
          disabled={phase.kind !== "idle"}
        >
          {phase.kind === "spinning" ? "回しています…" : "ガチャを回す"}
        </button>
      </div>

      {records.length > 0 && (
        <section className="history" aria-labelledby="history-title">
          <h2 id="history-title">最近の結果</h2>
          <ol>
            {recent.map((record) => (
              <li key={record.id}>
                <Capsule color={record.color} className="mini" />
                <span className="history-label">{record.label}</span>
                <span className="history-time">{formatClock(record.at)}</span>
                {phase.kind === "idle" && (
                  <button
                    type="button"
                    className="tag tag-open"
                    onClick={() => setPhase({ kind: "result", recordId: record.id })}
                  >
                    結果を見る
                  </button>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {resultRecord !== undefined && (
        <ResultSheet
          key={resultRecord.id}
          record={resultRecord}
          now={now}
          onClose={() => setPhase({ kind: "idle" })}
        />
      )}
    </main>
  );
}

function Notice({ title, children }: { readonly title: string; readonly children?: string }) {
  return (
    <main className="notice">
      <Capsule color="#c7ccd6" className="notice-capsule" />
      <h1>{title}</h1>
      {children !== undefined && <p>{children}</p>}
    </main>
  );
}
