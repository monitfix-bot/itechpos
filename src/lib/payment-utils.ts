import { formatVND } from "./format";

export type PaymentMethod = "cash" | "transfer" | "card" | "split";

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản VietQR",
  card: "Thẻ / POS",
  split: "Tiền mặt + Chuyển khoản",
};

export const PAYMENT_SHORT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "VietQR",
  card: "Thẻ",
  split: "Kết hợp",
};

const SPLIT_REGEX = /\[SPLIT:cash=(\d+),transfer=(\d+)\]/;

/**
 * Encodes cash and transfer split into a structured tag stored in the note field.
 */
export function formatSplitNote(
  userNote: string | null | undefined,
  cash: number,
  transfer: number
): string {
  const tag = `[SPLIT:cash=${Math.max(0, Math.round(cash))},transfer=${Math.max(0, Math.round(transfer))}]`;
  const clean = stripSplitTag(userNote || "");
  return clean ? `${tag}\n${clean}` : tag;
}

/**
 * Extracts cash and transfer amounts from the split tag in a note.
 */
export function parseSplitPayment(
  note: string | null | undefined,
  fallbackTotal = 0
): { isSplit: boolean; cash: number; transfer: number } {
  if (!note) return { isSplit: false, cash: 0, transfer: 0 };
  const match = note.match(SPLIT_REGEX);
  if (match) {
    const cash = Number(match[1]) || 0;
    const transfer = Number(match[2]) || 0;
    return { isSplit: true, cash, transfer };
  }
  return { isSplit: false, cash: 0, transfer: 0 };
}

/**
 * Strips the technical [SPLIT:...] tag so users and receipts only see the human-written note.
 */
export function stripSplitTag(note: string | null | undefined): string {
  if (!note) return "";
  return note.replace(SPLIT_REGEX, "").trim();
}

/**
 * Generates a human-friendly payment method label, including exact split numbers if applicable.
 */
export function formatPaymentMethodDisplay(
  method: string | null | undefined,
  note?: string | null | undefined
): string {
  if (!method) return "Chưa thanh toán";
  if (method === "split") {
    const split = parseSplitPayment(note);
    if (split.isSplit) {
      return `Kết hợp (Tiền mặt: ${formatVND(split.cash)} + CK: ${formatVND(split.transfer)})`;
    }
    return "Tiền mặt + Chuyển khoản";
  }
  return PAYMENT_LABELS[method] || method;
}
