import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatVND } from "@/lib/format";
import {
  ShoppingCart,
  Plus,
  Wrench,
  Receipt,
  TrendingUp,
  CreditCard,
  Banknote,
  Wallet,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SalesClientView, type InvoiceRow } from "./sales-client-view";

export default async function SalesPage() {
  const [sales, tickets] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { select: { id: true } },
      },
      take: 300,
    }),
    prisma.serviceTicket.findMany({
      where: { status: "delivered" },
      orderBy: { deliveredAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { select: { id: true } },
      },
      take: 300,
    }),
  ]);

  const rows: InvoiceRow[] = [
    ...sales.map((s) => ({
      id: s.id,
      code: s.code,
      type: "sale" as const,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customer?.name ?? null,
      customerPhone: s.customer?.phone ?? null,
      itemCount: s.items.length,
      paymentMethod: s.paymentMethod,
      total: s.total,
      href: `/sales/${s.id}`,
    })),
    ...tickets.map((t) => ({
      id: t.id,
      code: t.code.replace(/^SC/, "HDSC"),
      type: "service" as const,
      createdAt: (t.deliveredAt ?? t.createdAt).toISOString(),
      customerName: t.customer?.name ?? null,
      customerPhone: t.customer?.phone ?? null,
      itemCount: t.items.length,
      paymentMethod: t.paymentMethod,
      total: t.finalCost,
      href: `/service/${t.id}`,
      device: [t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || undefined,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalRevenue = rows.reduce((s, r) => s + r.total, 0);
  const saleCount = rows.filter((r) => r.type === "sale").length;
  const serviceCount = rows.filter((r) => r.type === "service").length;

  return (
    <div className="space-y-5 pb-12">
      {/* 1. HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 border border-white/20">
            <Receipt className="size-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Lịch Sử Hoá Đơn & Doanh Thu
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý, tra cứu và in lại toàn bộ hoá đơn bán lẻ phụ kiện và hoá đơn sửa chữa đã thanh toán.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pos"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-10 px-4 rounded-2xl font-extrabold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 gap-2 transition-all active:scale-95"
            )}
          >
            <Plus className="size-4" />
            <span>Tạo đơn bán hàng (F2)</span>
          </Link>
        </div>
      </div>

      {/* 2. PRECISION METRICS BAR */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Metric 1: Total Revenue */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Tổng doanh thu thực thu
            </span>
            <div className="size-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400 tabular-numbers">
              {formatVND(totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500 inline" />
              Đã thu & đối soát quỹ
            </p>
          </div>
        </div>

        {/* Metric 2: Total Invoices */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Tổng số giao dịch
            </span>
            <div className="size-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono font-bold text-xs">
              #
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
              {rows.length}
            </span>
            <span className="text-xs text-slate-500 font-semibold">hoá đơn</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Toàn bộ giao dịch ghi nhận</p>
        </div>

        {/* Metric 3: Retail Sales Count */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Hoá đơn bán lẻ
            </span>
            <div className="size-7 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShoppingCart className="size-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
              {saleCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">đơn</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Bán linh kiện & máy</p>
        </div>

        {/* Metric 4: Service Orders Count */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Hoá đơn sửa chữa
            </span>
            <div className="size-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wrench className="size-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-numbers">
              {serviceCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">phiếu</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đã hoàn thành & bàn giao</p>
        </div>
      </div>

      {/* 3. CLIENT INTERACTIVE VIEW (GRID & DENSE TABLE + MULTI-FILTER) */}
      <SalesClientView initialRows={rows} />
    </div>
  );
}
