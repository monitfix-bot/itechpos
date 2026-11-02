import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<
  string,
  { label: string; className: string; dotColor: string }
> = {
  received: {
    label: "Tiếp nhận",
    className: "bg-sky-50 text-sky-700 border-sky-200 font-medium",
    dotColor: "bg-sky-500",
  },
  diagnosing: {
    label: "Chẩn đoán",
    className: "bg-amber-50 text-amber-800 border-amber-200 font-medium",
    dotColor: "bg-amber-500 animate-pulse",
  },
  waiting_parts: {
    label: "Chờ linh kiện",
    className: "bg-orange-50 text-orange-800 border-orange-200 font-medium",
    dotColor: "bg-orange-500",
  },
  repairing: {
    label: "Đang sửa",
    className: "bg-blue-50 text-blue-700 border-blue-200 font-medium",
    dotColor: "bg-blue-600 animate-pulse",
  },
  completed: {
    label: "Đã sửa xong",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
    dotColor: "bg-emerald-500",
  },
  delivered: {
    label: "Đã trả máy",
    className: "bg-slate-100 text-slate-700 border-slate-300 font-medium",
    dotColor: "bg-slate-500",
  },
  cancelled: {
    label: "Đã huỷ",
    className: "bg-rose-50 text-rose-700 border-rose-200 font-medium",
    dotColor: "bg-rose-500",
  },
};

export function ServiceStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const s = STATUS_MAP[status] || {
    label: status,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-400",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-md shadow-xs transition-colors",
        s.className,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", s.dotColor)} />
      {s.label}
    </Badge>
  );
}

export const SERVICE_STATUSES = Object.entries(STATUS_MAP).map(
  ([value, { label }]) => ({ value, label }),
);
