import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatVND, formatDate, formatDateTime } from "@/lib/format";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingCart,
  Wrench,
  TrendingUp,
  StickyNote,
  Receipt,
  Sparkles,
  Crown,
  ChevronRight,
  ExternalLink,
  Plus,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
} from "lucide-react";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import { CustomerRowActions } from "../customer-actions";
import { cn } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  card: "Thẻ NH",
  transfer: "Chuyển khoản VietQR",
  wallet: "Ví ĐT",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      serviceTickets: {
        orderBy: { createdAt: "desc" },
        include: { assignedTo: true },
      },
    },
  });
  if (!customer) notFound();

  const totalSalesSpent = customer.sales.reduce((s, x) => s + x.total, 0);
  const totalRepairSpent = customer.serviceTickets
    .filter((t) => t.status === "delivered")
    .reduce((s, x) => s + x.finalCost, 0);
  const lifetimeSpent = totalSalesSpent + totalRepairSpent;

  // Determine VIP Tier
  let tier = {
    label: "Khách mới",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
    icon: Sparkles,
  };
  if (lifetimeSpent >= 50_000_000) {
    tier = {
      label: "VIP Kim Cương",
      badgeClass: "bg-gradient-to-r from-purple-500/15 via-blue-500/15 to-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-bold",
      icon: Crown,
    };
  } else if (lifetimeSpent >= 20_000_000) {
    tier = {
      label: "VIP Vàng",
      badgeClass: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold",
      icon: Crown,
    };
  } else if (lifetimeSpent >= 5_000_000) {
    tier = {
      label: "Khách Thân Thiết",
      badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold",
      icon: Sparkles,
    };
  }

  const TierIcon = tier.icon;
  const initials = customer.name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold",
            })}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            Danh sách khách hàng
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span>Khách hàng</span>
            <ChevronRight className="size-3.5 opacity-50" />
            <span className="font-mono font-bold text-foreground">{customer.code || customer.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <CustomerRowActions
            customer={{
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              note: customer.note,
            }}
            variant="label"
          />
          <Link
            href="/pos"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20",
            })}
          >
            <Plus className="size-4 mr-1.5" />
            Tạo đơn / Phiếu sửa
          </Link>
        </div>
      </div>

      {/* Hero Customer CRM Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="size-16 sm:size-20 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20 shrink-0">
              {initials}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {customer.name}
                </h1>
                <Badge variant="outline" className={cn("rounded-xl px-2.5 py-0.5 text-xs flex items-center gap-1.5", tier.badgeClass)}>
                  <TierIcon className="size-3.5" />
                  {tier.label}
                </Badge>
                {customer.code && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-muted-foreground border border-slate-200/60 dark:border-slate-700/60">
                    {customer.code}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium">
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1.5 font-mono text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  <Phone className="size-3.5" />
                  {customer.phone}
                </a>
                {customer.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    <span className="max-w-[300px] truncate">{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <span>Tham gia: {formatDate(customer.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Tổng chi tiêu trọn đời
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                {formatVND(lifetimeSpent)}
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Lượt giao dịch
              </div>
              <div className="text-xl font-black text-foreground tracking-tight">
                {customer.sales.length + customer.serviceTickets.length} lần
              </div>
            </div>
          </div>
        </div>

        {/* 4 Precision KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6">
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
              <ShoppingCart className="size-4" />
              Doanh số bán lẻ
            </div>
            <div className="text-xl font-black text-foreground">{formatVND(totalSalesSpent)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{customer.sales.length} đơn hàng đã mua</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              <Wrench className="size-4" />
              Chi phí sửa chữa
            </div>
            <div className="text-xl font-black text-foreground">{formatVND(totalRepairSpent)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{customer.serviceTickets.length} lượt tiếp nhận sửa</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 mb-1">
              <Crown className="size-4" />
              Hạng thành viên
            </div>
            <div className="text-base font-black text-foreground truncate">{tier.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Dựa trên tổng tích luỹ</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <StickyNote className="size-4" />
              Ghi chú hồ sơ
            </div>
            <div className="text-xs font-medium text-foreground line-clamp-2">
              {customer.note || "Không có ghi chú nào"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Split Retail History & Repair History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Retail Sales History */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <ShoppingCart className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Lịch sử bán hàng ({customer.sales.length})</h3>
                <p className="text-xs text-muted-foreground">Các hoá đơn mua sắm thiết bị & phụ kiện</p>
              </div>
            </div>
          </div>

          {customer.sales.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              Khách hàng chưa có hoá đơn bán hàng nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-5 py-3 text-left">Mã đơn</th>
                    <th className="px-3 py-3 text-left">Thời gian</th>
                    <th className="px-3 py-3 text-center">Mặt hàng</th>
                    <th className="px-3 py-3 text-left">PTTT</th>
                    <th className="px-5 py-3 text-right">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customer.sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/sales/${s.id}`}
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          #{s.code}
                          <ExternalLink className="size-3 opacity-60" />
                        </Link>
                      </td>
                      <td className="px-3 py-3.5 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(s.createdAt)}
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-foreground">
                        {s.items.length} sp
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap font-medium text-muted-foreground">
                        {PAYMENT_LABELS[s.paymentMethod] || s.paymentMethod}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-foreground text-sm">
                        {formatVND(s.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Repair & Service History */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Wrench className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Lịch sử sửa chữa ({customer.serviceTickets.length})</h3>
                <p className="text-xs text-muted-foreground">Các lượt tiếp nhận bảo hành & sửa chữa máy</p>
              </div>
            </div>
          </div>

          {customer.serviceTickets.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              Khách hàng chưa có phiếu sửa chữa nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-5 py-3 text-left">Mã phiếu</th>
                    <th className="px-3 py-3 text-left">Thiết bị & Lỗi</th>
                    <th className="px-3 py-3 text-center">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Chi phí</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customer.serviceTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/service/${t.id}`}
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          #{t.code}
                          <ExternalLink className="size-3 opacity-60" />
                        </Link>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(t.receivedAt)}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-foreground">
                          {[t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || t.deviceType}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {t.problem}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <ServiceStatusBadge status={t.status} className="text-[10px]" />
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-foreground text-sm">
                        {t.status === "delivered"
                          ? formatVND(t.finalCost)
                          : t.estimatedCost > 0
                          ? formatVND(t.estimatedCost)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
