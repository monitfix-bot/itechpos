import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatVND } from "@/lib/format";
import {
  Users,
  UserPlus,
  TrendingUp,
  Award,
  Crown,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { NewCustomerButton } from "./customer-actions";
import { CustomersClientView, type CustomerRow } from "./customers-client-view";

export default async function CustomersPage() {
  const [customers, totalCount, monthCount] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sales: { select: { total: true } },
        serviceTickets: { select: { id: true } },
      },
      take: 300,
    }),
    prisma.customer.count(),
    prisma.customer.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    }),
  ]);

  const totalSpent = customers.reduce(
    (s, c) => s + c.sales.reduce((ss, x) => ss + x.total, 0),
    0
  );
  const totalSC = customers.reduce((s, c) => s + c.serviceTickets.length, 0);

  const serializableCustomers: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    note: c.note,
    createdAt: c.createdAt.toISOString(),
    totalSpent: c.sales.reduce((s, x) => s + x.total, 0),
    salesCount: c.sales.length,
    serviceTicketsCount: c.serviceTickets.length,
  }));

  return (
    <div className="space-y-5 pb-12">
      {/* 1. HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 border border-white/20">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Danh Bạ & Trung Tâm Khách Hàng (CRM)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý hồ sơ khách hàng, phân hạng VIP, theo dõi doanh thu tích luỹ và lịch sử bảo hành thiết bị.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <NewCustomerButton />
        </div>
      </div>

      {/* 2. PRECISION METRICS BAR */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Metric 1: Total Customers */}
        <div className="p-5 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Tổng hồ sơ khách hàng
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">khách hàng</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đã lưu trong hệ thống danh bạ</p>
        </div>

        {/* Metric 2: New in 30 days */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Khách mới (30 ngày)
            </span>
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-numbers">
              +{monthCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">hồ sơ mới</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tăng trưởng khách hàng tháng này</p>
        </div>

        {/* Metric 3: Total Spend */}
        <div className="p-5 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Doanh số tích luỹ
          </span>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400 tabular-numbers">
              {formatVND(totalSpent)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">Tổng doanh thu bán lẻ & dịch vụ</p>
          </div>
        </div>

        {/* Metric 4: Total Service Repairs */}
        <div className="p-5 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Lượt tiếp nhận sửa máy
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-numbers">
              {totalSC}
            </span>
            <span className="text-xs text-slate-500 font-semibold">lượt ca</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Thiết bị bảo hành & sửa chữa</p>
        </div>
      </div>

      {/* 3. CLIENT CRM WORKBENCH (GRID & DENSE TABLE) */}
      <CustomersClientView initialCustomers={serializableCustomers} />
    </div>
  );
}
