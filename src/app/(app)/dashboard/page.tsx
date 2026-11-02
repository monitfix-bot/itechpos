import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatVND, formatDateTime, formatNumber } from "@/lib/format";
import {
  ShoppingCart,
  Wrench,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Smartphone,
  ChevronRight,
  BarChart3,
  Package,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Banknote,
  Wallet,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import { RevenueChart } from "@/components/revenue-chart";
import { cn } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  card: "Thẻ NH",
  transfer: "VietQR",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    todaySaleRevenue,
    todayServiceRevenue,
    monthSaleRevenue,
    monthServiceRevenue,
    todayOrdersCount,
    todayServiceCount,
    activeTicketsCount,
    customerCount,
    monthNewCustomers,
    lowStockProducts,
    recentTickets,
    recentSales,
    dueTickets,
    last30Sales,
    last30ServiceRevenue,
    technicians,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today }, status: "paid" },
      _sum: { total: true },
    }),
    prisma.serviceTicket.aggregate({
      where: { deliveredAt: { gte: today } },
      _sum: { finalCost: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: "paid" },
      _sum: { total: true },
    }),
    prisma.serviceTicket.aggregate({
      where: { deliveredAt: { gte: startOfMonth } },
      _sum: { finalCost: true },
    }),
    prisma.sale.count({ where: { createdAt: { gte: today } } }),
    prisma.serviceTicket.count({ where: { deliveredAt: { gte: today } } }),
    prisma.serviceTicket.count({
      where: { status: { notIn: ["delivered", "cancelled"] } },
    }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.product.findMany({
      where: { stock: { lte: 5 }, isActive: true, category: { type: { not: "service" } } },
      orderBy: { stock: "asc" },
      take: 4,
    }),
    prisma.serviceTicket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true, assignedTo: true },
    }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: { select: { id: true } } },
    }),
    prisma.serviceTicket.findMany({
      where: {
        status: { notIn: ["delivered", "cancelled"] },
        promisedAt: { not: null },
      },
      orderBy: { promisedAt: "asc" },
      take: 4,
      include: { customer: true, assignedTo: true },
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: last30 }, status: "paid" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, total: true },
    }),
    prisma.serviceTicket.findMany({
      where: { deliveredAt: { gte: last30 } },
      orderBy: { deliveredAt: "asc" },
      select: { deliveredAt: true, finalCost: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["technician", "admin"] }, active: true },
      take: 4,
      include: {
        serviceAssigned: {
          where: { status: "delivered", deliveredAt: { gte: startOfMonth } },
          select: { id: true, finalCost: true },
        },
      },
    }),
  ]);

  const totalTodayRevenue =
    (todaySaleRevenue._sum.total || 0) + (todayServiceRevenue._sum.finalCost || 0);
  const totalMonthRevenue =
    (monthSaleRevenue._sum.total || 0) + (monthServiceRevenue._sum.finalCost || 0);

  // Build chart data
  const revenueByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    revenueByDay.set(key, 0);
  }
  for (const s of last30Sales) {
    const key = s.createdAt.toISOString().slice(0, 10);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) || 0) + s.total);
    }
  }
  for (const s of last30ServiceRevenue) {
    if (!s.deliveredAt) continue;
    const key = s.deliveredAt.toISOString().slice(0, 10);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) || 0) + s.finalCost);
    }
  }
  const chartData = Array.from(revenueByDay.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  // Top technicians leaderboard
  const techLeaderboard = technicians
    .map((tech) => {
      const completedCount = tech.serviceAssigned.length;
      const revenue = tech.serviceAssigned.reduce((s: number, t: { finalCost: number }) => s + t.finalCost, 0);
      return { id: tech.id, name: tech.name, count: completedCount, revenue };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. EXECUTIVE WORKSTATION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Xin chào, {session.name} 👋
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase border border-blue-500/20">
              {session.role === "admin" ? "Quản Trị Viên" : "Kỹ Thuật Viên"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium">
            <Calendar className="size-3.5 text-blue-500" />
            <span>
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pos"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-10 px-4 rounded-2xl font-extrabold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 gap-2 transition-all active:scale-95"
            )}
          >
            <ShoppingCart className="size-4" />
            <span>Tạo đơn bán (F2)</span>
          </Link>
          <Link
            href="/pos"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-10 px-4 rounded-2xl font-bold text-xs border-slate-200 dark:border-slate-700 gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            )}
          >
            <Wrench className="size-4 text-amber-500" />
            <span>Nhận máy sửa (F2)</span>
          </Link>
        </div>
      </div>

      {/* 2. PRECISION METRICS BANNER */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Metric 1: Today Revenue */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Doanh thu hôm nay
            </span>
            <div className="size-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400 tabular-numbers">
              {formatVND(totalTodayRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              {todayOrdersCount} đơn bán • {todayServiceCount} phiếu sửa
            </p>
          </div>
        </div>

        {/* Metric 2: Month Revenue */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Doanh thu tháng này
            </span>
            <div className="size-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-xs">
              M
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
              {formatVND(totalMonthRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Metric 3: Active Repair Tickets */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Máy đang sửa chữa
            </span>
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-numbers">
              {formatNumber(activeTicketsCount)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">thiết bị</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Đang xử lý tại phòng kỹ thuật</p>
        </div>

        {/* Metric 4: Total Customers */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Hồ sơ khách hàng
            </span>
            <div className="size-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
              {formatNumber(customerCount)}
            </span>
            <span className="text-xs text-emerald-600 font-bold">+{monthNewCustomers} mới</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đã lưu trong danh bạ</p>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT: 2-COLUMN WORKSTATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN (2/3): REVENUE CHART & RECENT OPERATIONS */}
        <div className="lg:col-span-2 space-y-5">
          {/* Revenue Chart Card */}
          <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="size-4 text-blue-600" />
                  Biểu Đồ Doanh Thu 30 Ngày Gần Nhất
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Tổng hợp doanh số bán lẻ linh kiện và doanh thu dịch vụ sửa chữa
                </CardDescription>
              </div>
              <Link
                href="/sales"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Xem chi tiết</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[280px]">
                <RevenueChart data={chartData} />
              </div>
            </CardContent>
          </Card>

          {/* Recent Service Tickets Stream */}
          <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="size-4 text-amber-500" />
                  Phiếu Sửa Chữa Tiếp Nhận Gần Nhất
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Tiến độ tiếp nhận & chẩn đoán thiết bị tại quầy
                </CardDescription>
              </div>
              <Link
                href="/service"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả ({activeTicketsCount})</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentTickets.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Chưa có phiếu sửa chữa nào trong hệ thống.
                  </div>
                ) : (
                  recentTickets.map((t) => (
                    <Link
                      key={t.id}
                      href={`/service/${t.id}`}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
                          <Smartphone className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                              {t.code}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                              {[t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || "Thiết bị"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{t.customer.name}</span>
                            <span>•</span>
                            <span className="font-mono">{t.customer.phone}</span>
                            <span>•</span>
                            <span className="font-mono">{formatDateTime(t.receivedAt || t.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                            {formatVND(t.estimatedCost)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {t.assignedTo ? t.assignedTo.name : "Chưa giao KTV"}
                          </div>
                        </div>
                        <ServiceStatusBadge status={t.status} />
                        <ChevronRight className="size-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales Orders Stream */}
          <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="size-4 text-blue-600" />
                  Đơn Hàng Bán Lẻ Mới Nhất
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Linh kiện & phụ kiện xuất bán trực tiếp tại quầy
                </CardDescription>
              </div>
              <Link
                href="/sales"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentSales.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Chưa có đơn bán hàng nào hôm nay.
                  </div>
                ) : (
                  recentSales.map((s) => (
                    <Link
                      key={s.id}
                      href={`/sales/${s.id}`}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-105 transition-transform">
                          <ShoppingCart className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                              {s.code}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {s.customer ? s.customer.name : "Khách lẻ tại quầy"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{s.items.length} món</span>
                            <span>•</span>
                            <span>{PAYMENT_LABELS[s.paymentMethod || ""] || "Tiền mặt"}</span>
                            <span>•</span>
                            <span className="font-mono">{formatDateTime(s.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                          {formatVND(s.total)}
                        </div>
                        <ChevronRight className="size-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3): OPERATIONAL WIDGETS */}
        <div className="space-y-5">
          {/* WIDGET 1: DUE / OVERDUE TICKETS ALERT */}
          <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <CardHeader className="py-4 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="size-4 text-amber-500" />
                  Hẹn Trả Máy Sửa
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                  Thiết bị cần bàn giao trong hôm nay
                </CardDescription>
              </div>
              <Link
                href="/service"
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Xem tất cả
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {dueTickets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle2 className="size-7 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Không có máy trễ hẹn</p>
                  <p className="text-[11px]">Tất cả ca sửa đang được xử lý đúng lịch.</p>
                </div>
              ) : (
                dueTickets.map((t) => {
                  const isOverdue = t.promisedAt ? new Date(t.promisedAt) < now : false;
                  return (
                    <Link
                      key={t.id}
                      href={`/service/${t.id}`}
                      className="block p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600">
                          {t.code}
                        </span>
                        {isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold border border-rose-500/20 animate-pulse">
                            Quá hạn trả
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            Đến hạn
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {[t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || "Thiết bị"}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>{t.customer.name}</span>
                        <span>{t.promisedAt ? formatDateTime(t.promisedAt) : "—"}</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* WIDGET 2: LOW STOCK ALERT */}
          <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <CardHeader className="py-4 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="size-4 text-rose-500" />
                  Linh Kiện Tồn Kho Ít
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                  Cần lên đơn nhập thêm (tồn $\le 5$)
                </CardDescription>
              </div>
              <Link
                href="/products"
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Quản lý kho
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle2 className="size-7 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Kho hàng đầy đủ</p>
                  <p className="text-[11px]">Không có linh kiện nào chạm ngưỡng báo động.</p>
                </div>
              ) : (
                lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold shrink-0 border",
                        p.stock === 0
                          ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                          : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                      )}
                    >
                      Còn: {p.stock}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* WIDGET 3: TECHNICIAN LEADERBOARD */}
          <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <CardHeader className="py-4 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="size-4 text-emerald-500" />
                  Top Kỹ Thuật Viên Tháng Này
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                  Số ca sửa chữa hoàn tất & doanh số dịch vụ
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {techLeaderboard.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có ca sửa bàn giao trong tháng này.
                </div>
              ) : (
                techLeaderboard.map((tech, index) => (
                  <div
                    key={tech.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "size-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 text-white shadow-xs",
                          index === 0
                            ? "bg-amber-500"
                            : index === 1
                            ? "bg-slate-400"
                            : index === 2
                            ? "bg-amber-700"
                            : "bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {tech.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {tech.count} ca sửa bàn giao
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatVND(tech.revenue)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
