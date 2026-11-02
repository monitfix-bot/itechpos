export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

export function formatDate(d: Date | string | null | undefined, timezone = "Asia/Ho_Chi_Minh"): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString("vi-VN");
  }
}

export function formatTime(d: Date | string | null | undefined, timezone = "Asia/Ho_Chi_Minh"): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
}

export function formatDateTime(d: Date | string | null | undefined, timezone = "Asia/Ho_Chi_Minh"): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  try {
    const timeStr = formatTime(date, timezone);
    const dateStr = formatDate(date, timezone);
    return `${timeStr} ${dateStr}`;
  } catch {
    return date.toLocaleString("vi-VN");
  }
}

export function generateCode(prefix: string, n: number, pad = 5): string {
  return `${prefix}${String(n).padStart(pad, "0")}`;
}
