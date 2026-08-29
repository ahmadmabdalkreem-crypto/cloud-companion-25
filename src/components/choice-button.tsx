import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChoiceButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  selected: boolean;
  children: ReactNode;
};

export function ChoiceButton({ selected, children, className, ...props }: ChoiceButtonProps) {
  return (
    <Button
      type="button"
      variant={selected ? "selected" : "choice"}
      aria-pressed={selected}
      className={cn("h-auto min-h-11 whitespace-normal", className)}
      {...props}
    >
      {children}
    </Button>
  );
}