import { memo, useCallback, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  max?: number;
};

function TiltCardBase({ children, className = "", max = 8 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-4px)`;
      el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    },
    [max],
  );

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={"transition-transform duration-300 ease-out will-change-transform " + className}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--mx,50%) var(--my,50%), oklch(1 0 0 / 0.14), transparent 45%)",
        }}
      />
      {children}
    </div>
  );
}

export const TiltCard = memo(TiltCardBase);
