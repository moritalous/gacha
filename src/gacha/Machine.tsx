import type { CSSProperties } from "react";
import type { Prize } from "../lib/event.ts";
import { BALL_POSITIONS, ballColors } from "./balls.ts";
import { Capsule } from "./Capsule.tsx";

interface MachineProps {
  readonly items: readonly Prize[];
  readonly spinning: boolean;
  /** 取り出し口に出てくるカプセルの色。回していないときは null */
  readonly dropColor: string | null;
  readonly spinMs: number;
}

export function Machine({ items, spinning, dropColor, spinMs }: MachineProps) {
  const colors = ballColors(items);
  return (
    <div
      className={`machine${spinning ? " is-spinning" : ""}`}
      style={{ "--spin-ms": `${spinMs}ms` } as CSSProperties}
      aria-hidden="true"
    >
      <div className="dome">
        <div className="dome-glass" />
        {colors.map((color, index) => {
          const [x, y] = BALL_POSITIONS[index] ?? [50, 50];
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: 位置が固定の飾りなので index で十分
              key={index}
              className="ball"
              style={{ left: `${x}%`, top: `${y}%`, "--i": index } as CSSProperties}
            >
              <Capsule color={color} />
            </span>
          );
        })}
      </div>
      <div className="body">
        <div className="coin-slot" />
        <div className="handle">
          <span className="handle-bar" />
        </div>
        <div className="outlet">
          {dropColor !== null && <Capsule color={dropColor} className="dropped" />}
        </div>
      </div>
      <div className="foot" />
    </div>
  );
}
