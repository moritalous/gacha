import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import type { DrawRecord } from "../lib/storage.ts";
import { formatClock, formatDateTime } from "../lib/time.ts";
import { Capsule } from "./Capsule.tsx";

interface ResultSheetProps {
  readonly record: DrawRecord;
  readonly now: Date;
  readonly remaining: number;
  readonly onClaim: (recordId: string) => void;
  readonly onClose: () => void;
}

export function ResultSheet({ record, now, remaining, onClaim, onClose }: ResultSheetProps) {
  const titleId = useId();
  const [confirming, setConfirming] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="sheet-backdrop">
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="open-capsule" style={{ "--cap": record.color } as CSSProperties}>
          <Capsule color={record.color} className="big" />
        </div>
        <p className="sheet-eyebrow">結果</p>
        <h2 id={titleId} className="prize-label">
          {record.label}
        </h2>

        <dl className="proof">
          <div>
            <dt>当選</dt>
            <dd>{formatDateTime(record.at)}</dd>
          </div>
          <div>
            <dt>現在時刻</dt>
            <dd className="live-clock" aria-live="off">
              {formatClock(now)}
            </dd>
          </div>
        </dl>

        {record.claimed ? (
          <p className="claimed-badge">受け取り済み</p>
        ) : confirming ? (
          <div className="confirm">
            <p>スタッフの方が押してください。受け取り済みにしますか？</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClaim(record.id);
                  setConfirming(false);
                }}
              >
                受け取り済みにする
              </button>
              <button type="button" className="btn" onClick={() => setConfirming(false)}>
                やめる
              </button>
            </div>
          </div>
        ) : (
          <p className="sheet-hint">この画面を受付で見せてください。</p>
        )}

        <div className="sheet-actions">
          {!record.claimed && !confirming && (
            <button type="button" className="btn btn-quiet" onClick={() => setConfirming(true)}>
              受け取り済みにする（スタッフ用）
            </button>
          )}
          <button ref={closeRef} type="button" className="btn" onClick={onClose}>
            {remaining > 0 ? `閉じる（本日あと ${remaining} 回）` : "閉じる"}
          </button>
        </div>
      </section>
    </div>
  );
}
