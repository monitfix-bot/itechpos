"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND, formatDateTime } from "@/lib/format";
import {
  Calendar,
  User,
  Wallet,
  Building2,
  Receipt,
  Wrench,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Printer,
} from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  card: "Thẻ NH",
  wallet: "Ví ĐT",
};

export type ReconRow = {
  type: "sale" | "service";
  id: string;
  code: string;
  createdAt: string; // iso
  customerName: string | null;
  paymentMethod: string;
  total: number;
  note?: string | null;
};

export type ReconStaff = {
  id: string;
  name: string;
  email: string;
  role: string;
  rows: ReconRow[];
};

export function Reconciliation({
  date,
  staff,
}: {
  date: string;
  staff: ReconStaff[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function setDate(v: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("date", v);
    router.replace(`/reports?${params.toString()}`);
  }

  function printReport() {
    const html = document.getElementById("recon-print")?.innerHTML;
    if (!html) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>Báo cáo ca trực ${date}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;padding:20px;color:#000}
h1,h2,h3{margin:0 0 8px}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12px}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
th{background:#f5f5f5}
.right{text-align:right}
.muted{color:#666;font-size:11px}
.staff{margin:24px 0;page-break-inside:avoid}
.totals{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}
.totals>div{border:1px solid #ddd;border-radius:6px;padding:8px}
</style></head><body>${html}</body></html>`);
    doc.close();
    iframe.contentWindow!.focus();
    setTimeout(() => {
      iframe.contentWindow!.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 200);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="date" className="text-xs">
              Ngày đối soát
            </Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-8 w-44"
              />
            </div>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={printReport}>
            <Printer className="size-4" />
            In báo cáo ca
          </Button>
        </CardContent>
      </Card>

      <div id="recon-print">
        <div className="hidden print:block mb-4">
          <h1 className="text-xl font-bold">Báo cáo đối soát ca trực</h1>
          <div className="text-sm">Ngày: {date}</div>
        </div>

        {staff.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              Không có giao dịch nào trong ngày {date}.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {staff.map((s) => (
              <StaffBlock key={s.id} staff={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StaffBlock({ staff }: { staff: ReconStaff }) {
  const [open, setOpen] = useState(true);
  const [actualCash, setActualCash] = useState("");
  const [actualTransfer, setActualTransfer] = useState("");

  const totals = useMemo(() => {
    const t = {
      cash: 0,
      transfer: 0,
      card: 0,
      wallet: 0,
      saleCount: 0,
      serviceCount: 0,
      grand: 0,
    };
    for (const r of staff.rows) {
      const m = r.paymentMethod || "cash";
      if (m === "cash") t.cash += r.total;
      else if (m === "transfer") t.transfer += r.total;
      else if (m === "card") t.card += r.total;
      else if (m === "wallet") t.wallet += r.total;
      if (r.type === "sale") t.saleCount += 1;
      else t.serviceCount += 1;
      t.grand += r.total;
    }
    return t;
  }, [staff.rows]);

  const actualCashNum = Number(actualCash.replace(/[^\d]/g, "")) || 0;
  const actualTransferNum = Number(actualTransfer.replace(/[^\d]/g, "")) || 0;
  const cashDiff = actualCash === "" ? null : actualCashNum - totals.cash;
  const transferDiff =
    actualTransfer === "" ? null : actualTransferNum - totals.transfer;

  return (
    <Card className="overflow-hidden staff">
      <CardHeader className="bg-muted/30 border-b py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="size-7 rounded-md hover:bg-muted flex items-center justify-center print:hidden"
          >
            {open ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
          <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <User className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm flex items-center gap-2">
              {staff.name}
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {ROLE_LABEL[staff.role] || staff.role}
              </Badge>
            </CardTitle>
            <div className="text-[11px] text-muted-foreground">
              {staff.email} · {staff.rows.length} giao dịch
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Tổng cộng
            </div>
            <div className="text-base font-bold text-primary">
              {formatVND(totals.grand)}
            </div>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="p-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 totals">
            <SmallStat
              icon={<Wallet className="size-3.5" />}
              label="Tiền mặt"
              value={formatVND(totals.cash)}
              tone="emerald"
            />
            <SmallStat
              icon={<Building2 className="size-3.5" />}
              label="Chuyển khoản"
              value={formatVND(totals.transfer)}
              tone="blue"
            />
            <SmallStat
              icon={<ShoppingCart className="size-3.5" />}
              label="HD bán hàng"
              value={String(totals.saleCount)}
            />
            <SmallStat
              icon={<Wrench className="size-3.5" />}
              label="HDSC sửa chữa"
              value={String(totals.serviceCount)}
            />
          </div>

          {/* Reconciliation form */}
          <div className="rounded-md border bg-muted/20 p-3 space-y-2 print:hidden">
            <div className="text-xs font-semibold flex items-center gap-1.5">
              <Receipt className="size-3.5" />
              Đối soát cuối ca
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ReconRow
                label="Tiền mặt thực nhận"
                expected={totals.cash}
                value={actualCash}
                onChange={setActualCash}
                diff={cashDiff}
              />
              <ReconRow
                label="Chuyển khoản thực nhận"
                expected={totals.transfer}
                value={actualTransfer}
                onChange={setActualTransfer}
                diff={transferDiff}
              />
            </div>
          </div>

          {/* Transactions table */}
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr className="text-left">
                  <th className="px-2 py-1.5 font-medium">Giờ</th>
                  <th className="px-2 py-1.5 font-medium">Mã</th>
                  <th className="px-2 py-1.5 font-medium">Loại</th>
                  <th className="px-2 py-1.5 font-medium">Khách hàng</th>
                  <th className="px-2 py-1.5 font-medium">TT</th>
                  <th className="px-2 py-1.5 font-medium right text-right">
                    Tổng tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {staff.rows.map((r) => (
                  <tr key={`${r.type}-${r.id}`} className="border-t">
                    <td className="px-2 py-1.5 muted text-muted-foreground">
                      {formatDateTime(new Date(r.createdAt)).slice(0, 5)}
                    </td>
                    <td className="px-2 py-1.5 font-mono">
                      {r.type === "service"
                        ? r.code.replace(/^SC/, "HDSC")
                        : r.code}
                    </td>
                    <td className="px-2 py-1.5">
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1"
                      >
                        {r.type === "sale" ? "Bán hàng" : "Sửa chữa"}
                      </Badge>
                    </td>
                    <td className="px-2 py-1.5">
                      {r.customerName || "Khách lẻ"}
                    </td>
                    <td className="px-2 py-1.5">
                      {PAYMENT_LABELS[r.paymentMethod] || r.paymentMethod}
                    </td>
                    <td className="px-2 py-1.5 right text-right font-medium">
                      {formatVND(r.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Quản trị",
  staff: "Nhân viên",
  technician: "Kỹ thuật",
};

function SmallStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "emerald" | "blue";
}) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : tone === "blue"
        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
        : "bg-muted text-muted-foreground";
  return (
    <div className="rounded-md border bg-card p-2 flex items-center gap-2">
      <div
        className={`size-7 shrink-0 rounded flex items-center justify-center ${toneCls}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </div>
        <div className="text-sm font-bold truncate">{value}</div>
      </div>
    </div>
  );
}

function ReconRow({
  label,
  expected,
  value,
  onChange,
  diff,
}: {
  label: string;
  expected: number;
  value: string;
  onChange: (v: string) => void;
  diff: number | null;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">Hệ thống: {formatVND(expected)}</span>
      </div>
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập số tiền thực nhận..."
        className="font-mono"
      />
      {diff !== null && (
        <div
          className={`text-xs font-medium ${
            diff === 0
              ? "text-emerald-600"
              : diff > 0
                ? "text-blue-600"
                : "text-red-600"
          }`}
        >
          {diff === 0
            ? "✓ Khớp"
            : diff > 0
              ? `Thừa ${formatVND(diff)}`
              : `Thiếu ${formatVND(Math.abs(diff))}`}
        </div>
      )}
    </div>
  );
}
