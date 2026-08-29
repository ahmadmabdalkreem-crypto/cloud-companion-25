import { memo } from "react";
import { Check } from "lucide-react";

const STEPS = [
  { key: "collection", label: "اختيار الساعة" },
  { key: "register", label: "البيانات الشخصية" },
  { key: "login", label: "تسجيل الدخول" },
  { key: "processing", label: "مراجعة الطلب" },
] as const;

export type OrderStepKey = (typeof STEPS)[number]["key"];

function OrderStepsBase({
  current,
  className = "",
}: {
  current: OrderStepKey;
  className?: string;
}) {
  const index = STEPS.findIndex((s) => s.key === current);

  const activeStep = STEPS[index] ?? STEPS[0];
  return (
    <nav
      aria-label="مراحل إتمام الطلب"
      className={`mx-auto w-full max-w-3xl px-4 ${className}`}
    >
      <ol className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center gap-1 sm:gap-2">
                <span
                  aria-current={active ? "step" : undefined}
                  aria-label={step.label}
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black transition-colors ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-[image:var(--gradient-gold)] text-primary-deep shadow-[var(--shadow-gold)]"
                        : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`h-0.5 flex-1 rounded-full ${
                      i < index ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
              {/* Desktop / tablet: label per step */}
              <span
                className={`hidden w-full truncate text-center text-xs font-bold sm:block ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      {/* Mobile: single active label centered under the bar */}
      <p className="mt-2 text-center text-[13px] font-black text-primary sm:hidden">
        {`الخطوة ${index + 1} من ${STEPS.length} — ${activeStep.label}`}
      </p>
    </nav>
  );
}

export const OrderSteps = memo(OrderStepsBase);
