import { memo, useEffect, useMemo, useState } from "react";

type Props = {
  seconds: number;
  label?: string;
  size?: number;
  onComplete?: () => void;
};

function CountdownRingBase({ seconds, label = "ثانية", size = 96, onComplete }: Props) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      if (onComplete) onComplete();
      else if (typeof window !== "undefined") window.location.reload();
      return;
    }
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining, onComplete]);

  const { radius, circumference } = useMemo(() => {
    const r = (size - 10) / 2;
    return { radius: r, circumference: 2 * Math.PI * r };
  }, [size]);
  const offset = circumference * (1 - remaining / seconds);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={5}
          className="fill-none stroke-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-xl font-black text-primary">{remaining}</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

export const CountdownRing = memo(CountdownRingBase);
