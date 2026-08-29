import type { ComponentType } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  LoaderCircle,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "new"
  | "review"
  | "approved"
  | "rejected"
  | "online"
  | "offline"
  | "completed"
  | "processing";

const STATUS_META: Record<StatusTone, { label: string; icon: ComponentType<{ className?: string }> }> = {
  new: { label: "جديد", icon: Circle },
  review: { label: "قيد المراجعة", icon: Clock3 },
  approved: { label: "مقبول", icon: CheckCircle2 },
  rejected: { label: "مرفوض", icon: XCircle },
  online: { label: "متصل", icon: Wifi },
  offline: { label: "غير متصل", icon: WifiOff },
  completed: { label: "مكتمل", icon: CheckCircle2 },
  processing: { label: "قيد التنفيذ", icon: LoaderCircle },
};

type StatusBadgeProps = {
  status: StatusTone;
  label?: string;
  compact?: boolean;
  pulse?: boolean;
  className?: string;
};

export function StatusBadge({ status, label, compact, pulse, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge
      variant={status}
      className={cn("gap-1.5 whitespace-nowrap", compact && "px-2 py-0.5 text-[10px]", className)}
    >
      <Icon className={cn("h-3.5 w-3.5", (pulse || status === "processing") && "animate-pulse")} />
      {label ?? meta.label}
    </Badge>
  );
}