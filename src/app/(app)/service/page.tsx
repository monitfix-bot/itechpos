import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatVND } from "@/lib/format";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ServiceClientView, type ServiceTicketRow } from "./service-client-view";

export default async function ServicePage() {
  const [tickets, counts, technicians] = await Promise.all([
    prisma.serviceTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        assignedTo: { select: { name: true } },
      },
      take: 300,
    }),
    prisma.serviceTicket.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.user.findMany({
      where: { role: { in: ["technician", "admin"] }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const countMap: Record<string, number> = {};
  counts.forEach((c) => (countMap[c.status] = c._count));
  const totalActive =
    (countMap.received || 0) +
    (countMap.diagnosing || 0) +
    (countMap.waiting_parts || 0) +
    (countMap.repairing || 0);

  const serializableTickets: ServiceTicketRow[] = tickets.map((t) => ({
    id: t.id,
    code: t.code,
    deviceType: t.deviceType,
    deviceBrand: t.deviceBrand,
    deviceModel: t.deviceModel,
    imei: t.imei,
    problem: t.problem,
    status: t.status,
    estimatedCost: t.estimatedCost,
    deposit: t.deposit,
    finalCost: t.finalCost,
    customerName: t.customer.name,
    customerPhone: t.customer.phone,
    assignedToName: t.assignedTo?.name ?? null,
    createdAt: t.createdAt.toISOString(),
    receivedAt: t.receivedAt ? t.receivedAt.toISOString() : null,
    promisedAt: t.promisedAt ? t.promisedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-5 pb-12">
      {/* 1. HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25 border border-white/20">
            <Wrench className="size-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Trạm Quản Lý Dịch Vụ Sửa Chữa
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tiếp nhận máy, phân công kỹ thuật viên, theo dõi tiến độ sửa chữa và xuất phiếu bàn giao.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pos"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-10 px-4 rounded-2xl font-extrabold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 gap-2 transition-all active:scale-95"
            )}
          >
            <Plus className="size-4" />
            <span>Tiếp nhận máy mới (F2)</span>
          </Link>
        </div>
      </div>

      {/* 2. PRECISION SERVICE PIPELINE METRICS BAR */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Metric 1: Active in Progress */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Đang trong xưởng sửa
            </span>
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-numbers">
              {totalActive}
            </span>
            <span className="text-xs text-slate-500 font-semibold">thiết bị</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đang kiểm tra / sửa chữa</p>
        </div>

        {/* Metric 2: Completed, Ready for Pickup */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Đã xong, chờ trả khách
            </span>
            <span className="size-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400 tabular-numbers">
              {countMap.completed || 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">máy</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đã kiểm tra xong tại quầy</p>
        </div>

        {/* Metric 3: Delivered & Settled */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Đã bàn giao hoàn tất
            </span>
            <span className="size-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-numbers">
              {countMap.delivered || 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">phiếu</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Khách đã nhận máy & thanh toán</p>
        </div>

        {/* Metric 4: Cancelled / Returned */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Không sửa / Trả máy
            </span>
            <span className="size-2 rounded-full bg-slate-400"></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-400 tabular-numbers">
              {countMap.cancelled || 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">phiếu</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Khách huỷ hoặc trả lại máy</p>
        </div>
      </div>

      {/* 3. CLIENT WORKBENCH VIEW */}
      <ServiceClientView initialTickets={serializableTickets} technicians={technicians} />
    </div>
  );
}
