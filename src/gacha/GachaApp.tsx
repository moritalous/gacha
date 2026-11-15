import { useCallback, useEffect, useMemo, useState } from "react";
import { SECRET } from "../config.ts";
import { pickPrize } from "../lib/draw.ts";
import type { EventConfig } from "../lib/event.ts";
import { type EventStatus, evaluateStatus } from "../lib/status.ts";
import {
  DrawHistory,
  type DrawRecord,
  getBrowserStore,
  type KeyValueStore,
} from "../lib/storage.ts";
import { readTicket } from "../lib/ticket.ts";
import { eventDate, formatClock, formatDateTime } from "../lib/time.ts";
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
    const resolved = store === undefined ? getBrowserStore() : store;
    return resolved === null ? null : new DrawHistory(resolved);
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
  if (history === null) {
    return (
      <Notice title="このブラウザでは回せません">
        回数を記録できない設定になっています。シークレットモードを解除するか、別のブラウザで開いてください。
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

  const status = evaluateStatus(config, now, records.length);

  const spin = useCallback(() => {
    if (phase.kind !== "idle" || status.kind !== "ready") return;
    const index = pickPrize(config.items);
    const prize = config.items[index];
    if (prize === undefined) return;
    // 演出より前に保存する。途中で再読み込みしても回数は戻らない
    const record = history.add(config.id, date, prize, index, new Date());
    setRecords(history.list(config.id, date));
    setPhase({ kind: "spinning", record });
  }, [phase.kind, status.kind, config, history, date]);

  const claim = useCallback(
    (recordId: string) => {
      setRecords(history.markClaimed(config.id, date, recordId));
    },
    [history, config.id, date],
  );

  const resultRecord =
    phase.kind === "result" ? records.find((record) => record.id === phase.recordId) : undefined;
  const remaining = status.kind === "ready" ? status.remaining : 0;

  return (
    <main className="gacha">
      <header className="gacha-header">
        <h1>{config.name}</h1>
        <p className="period">
          {formatDateTime(config.from)} 〜 {formatDateTime(config.to)}
        </p>
      </header>

      <Machine
        items={config.items}
        spinning={phase.kind === "spinning"}
        dropColor={phase.kind === "spinning" ? phase.record.color : null}
        spinMs={spinMs}
      />

      <div className="controls">
        {phase.kind === "idle" ? (
          <StatusLine status={status} config={config} />
        ) : (
          <p className="status">どれが出るかな…</p>
        )}
        <button
          type="button"
          className="btn btn-spin"
          onClick={spin}
          disabled={phase.kind !== "idle" || status.kind !== "ready"}
        >
          {phase.kind === "spinning" ? "回しています…" : "ガチャを回す"}
        </button>
      </div>

      {records.length > 0 && (
        <section className="history" aria-labelledby="history-title">
          <h2 id="history-title">本日の結果</h2>
          <ol>
            {records.map((record) => (
              <li key={record.id}>
                <Capsule color={record.color} className="mini" />
                <span className="history-label">{record.label}</span>
                <span className="history-time">{formatClock(record.at)}</span>
                {record.claimed ? (
                  <span className="tag tag-done">受け取り済み</span>
                ) : (
                  phase.kind === "idle" && (
                    <button
                      type="button"
                      className="tag tag-open"
                      onClick={() => setPhase({ kind: "result", recordId: record.id })}
                    >
                      結果を見る
                    </button>
                  )
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
          remaining={remaining}
          onClaim={claim}
          onClose={() => setPhase({ kind: "idle" })}
        />
      )}
    </main>
  );
}

interface StatusLineProps {
  readonly status: EventStatus;
  readonly config: EventConfig;
}

function StatusLine({ status, config }: StatusLineProps) {
  switch (status.kind) {
    case "ready":
      return (
        <p className="status status-ready">
          本日あと <strong>{status.remaining}</strong> 回
        </p>
      );
    case "limitReached":
      return <p className="status status-stop">本日の回数は終了しました。また明日どうぞ。</p>;
    case "notStarted":
      return (
        <p className="status status-stop">
          開始前です。{formatDateTime(config.from)} から回せます。
        </p>
      );
    case "ended":
      return <p className="status status-stop">このイベントは終了しました。</p>;
  }
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
