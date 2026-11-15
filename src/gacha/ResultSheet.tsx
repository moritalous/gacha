import { type CSSProperties, useEffect, useId, useRef } from "react";
import type { DrawRecord } from "../lib/storage.ts";
import { formatClock, formatDateTime } from "../lib/time.ts";
import { Capsule } from "./Capsule.tsx";

interface ResultSheetProps {
  readonly record: DrawRecord;
  readonly now: Date;
  readonly onClose: () => void;
}

export function ResultSheet({ record, now, onClose }: ResultSheetProps) {
  const titleId = useId();
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

        <p className="sheet-hint">この画面を受付で見せてください。</p>

        <button ref={closeRef} type="button" className="btn" onClick={onClose}>
          閉じる
        </button>
      </section>
    </div>
  );
}
