import type { CSSProperties } from "react";

interface CapsuleProps {
  readonly color: string;
  readonly className?: string;
}

/** 上半分が色付き、下半分が透明のカプセルです。 */
export function Capsule({ color, className }: CapsuleProps) {
  return (
    <span
      className={["capsule", className].filter(Boolean).join(" ")}
      style={{ "--cap": color } as CSSProperties}
      aria-hidden="true"
    >
      <span className="capsule-top" />
      <span className="capsule-bottom" />
    </span>
  );
}
