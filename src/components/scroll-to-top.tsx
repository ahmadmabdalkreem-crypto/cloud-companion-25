import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * زر «العودة للأعلى» خفيف: يعتمد على IntersectionObserver بدل مستمعي التمرير،
 * فلا يوجد أي عمل أثناء التمرير ولا إعادة رندر متكررة.
 */
export function ScrollToTop() {
  const sentinel = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry?.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute top-[400px] h-px w-px" />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="العودة للأعلى"
        className={
          "fixed start-6 z-50 grid h-12 w-12 place-items-center rounded-full text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity duration-300 " +
          (visible ? "opacity-100" : "pointer-events-none opacity-0")
        }
        style={{
          backgroundImage: "var(--gradient-primary)",
          bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
        }}
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </>
  );
}
