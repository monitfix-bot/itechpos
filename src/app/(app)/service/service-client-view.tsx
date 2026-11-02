"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Smartphone,
  Laptop,
  Tablet,
  Package,
  Clock,
  User,
  ArrowUpDown,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
} from "lucide-react";
import { formatVND, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ServiceStatusBadge, SERVICE_STATUSES } from "@/components/service-status-badge";
import { printInBackground } from "@/lib/print";

const DEVICE_ICONS: Record<string, any> = {
  phone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  other: Package,
};

export type ServiceTicketRow = {
  id: string;
  code: string;
  deviceType: string;
  deviceBrand: string | null;
  deviceModel: string | null;
  imei: string | null;
  problem: string;
  status: string;
  estimatedCost: number;
  deposit: number;
  finalCost: number;
  customerName: string;
  customerPhone: string;
  assignedToName: string | null;
  createdAt: string; // ISO
  receivedAt: string | null; // ISO
  promisedAt: string | null; // ISO
};

export function ServiceClientView({
  initialTickets,
  technicians,
}: {
  initialTickets: ServiceTicketRow[];
  technicians: { id: string; name: string }[];
}) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "cost-desc" | "cost-asc">("latest");

  // Filtering & Sorting
  const filteredTickets = useMemo(() => {
    let result = [...initialTickets];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Technician filter
    if (techFilter !== "all") {
      if (techFilter === "unassigned") {
        result = result.filter((t) => !t.assignedToName);
      } else {
        result = result.filter((t) => t.assignedToName === techFilter);
      }
    }

    // Device type filter
    if (deviceFilter !== "all") {
      result = result.filter((t) => t.deviceType === deviceFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          (t.deviceBrand && t.deviceBrand.toLowerCase().includes(q)) ||
          (t.deviceModel && t.deviceModel.toLowerCase().includes(q)) ||
          (t.imei && t.imei.toLowerCase().includes(q)) ||
          t.customerName.toLowerCase().includes(q) ||
          t.customerPhone.includes(q) ||
          t.problem.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.receivedAt || a.createdAt).getTime();
      const timeB = new Date(b.receivedAt || b.createdAt).getTime();
      if (sortBy === "latest") return timeB - timeA;
      if (sortBy === "oldest") return timeA - timeB;
      if (sortBy === "cost-desc") return b.estimatedCost - a.estimatedCost;
      if (sortBy === "cost-asc") return a.estimatedCost - b.estimatedCost;
      return 0;
    });

    return result;
  }, [initialTickets, statusFilter, techFilter, deviceFilter, searchQuery, sortBy]);

  // Counts by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialTickets.length };
    initialTickets.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [initialTickets]);

  const hasActiveFilters =
    searchQuery.trim() || statusFilter !== "all" || techFilter !== "all" || deviceFilter !== "all" || sortBy !== "latest";

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setTechFilter("all");
    setDeviceFilter("all");
    setSortBy("latest");
  }

  return (
    <div className="space-y-4">
      {/* FILTER & TOOLBAR CARD */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã phiếu (#SC...), IMEI, model máy, tên/SĐT khách..."
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-rose-500"
                title="Xoá tìm kiếm"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selectors & View Switcher */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Technician Select */}
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Mọi Kỹ thuật viên</option>
              <option value="unassigned">⚠️ Chưa giao KTV</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.name}>
                  {tech.name}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200">
              <ArrowUpDown className="size-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="latest">Mới tiếp nhận</option>
                <option value="oldest">Cũ nhất</option>
                <option value="cost-desc">Chi phí cao nhất</option>
                <option value="cost-asc">Chi phí thấp nhất</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="Xem dạng thẻ tiến trình (Grid)"
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Lưới thẻ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="Xem dạng bảng xưởng sửa chữa (Table)"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Bảng chi tiết</span>
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Pipeline Status Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto [scrollbar-width:none]">
            {/* All */}
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                statusFilter === "all"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {statusCounts.all}
              </span>
            </button>

            {/* Stages */}
            {SERVICE_STATUSES.map((st) => {
              const count = statusCounts[st.value] || 0;
              const isActive = statusFilter === st.value;

              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setStatusFilter(st.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                    isActive
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                  )}
                >
                  <span>{st.label}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active summary & Reset */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
              Tìm thấy <span className="font-bold text-slate-800 dark:text-white">{filteredTickets.length}</span> phiếu
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <X className="size-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RESULT CONTAINER */}
      {filteredTickets.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3">
          <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Wrench className="size-7 opacity-50" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Không tìm thấy phiếu sửa chữa nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Không có thiết bị nào phù hợp với bộ lọc hoặc từ khoá tìm kiếm hiện tại.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
            >
              Xoá bộ lọc tìm kiếm
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTickets.map((t) => (
            <TicketCardItem key={t.id} ticket={t} />
          ))}
        </div>
      ) : (
        /* HIGH-DENSITY TABLE VIEW */
        <div className="overflow-x-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm [scrollbar-width:thin]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                <th className="py-3 px-4">Mã Phiếu</th>
                <th className="py-3 px-4">Thiết bị & Model</th>
                <th className="py-3 px-4">IMEI / SN</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Tình trạng lỗi</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Kỹ thuật viên</th>
                <th className="py-3 px-4 text-right">Chi phí dự kiến</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTickets.map((t) => {
                const DeviceIcon = DEVICE_ICONS[t.deviceType] || Smartphone;
                const deviceLabel = [t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || "Thiết bị";

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-amber-50/40 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    {/* Ticket Code */}
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                      <Link href={`/service/${t.id}`} className="hover:text-amber-600 transition-colors">
                        {t.code}
                      </Link>
                    </td>

                    {/* Device */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="size-4 text-blue-500 shrink-0" />
                        <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {deviceLabel}
                        </span>
                      </div>
                    </td>

                    {/* IMEI */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {t.imei ? t.imei.slice(-8) : "—"}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {t.customerName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{t.customerPhone}</div>
                    </td>

                    {/* Problem */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate italic">
                      "{t.problem}"
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <ServiceStatusBadge status={t.status} />
                    </td>

                    {/* Technician */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      {t.assignedToName ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="size-3 text-slate-400" />
                          <span>{t.assignedToName}</span>
                        </span>
                      ) : (
                        <span className="text-amber-500 italic text-[10px]">Chưa phân công</span>
                      )}
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {formatVND(t.estimatedCost)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/service/${t.id}`}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-600 transition-colors"
                          title="Cập nhật tiến độ phiếu"
                        >
                          <Eye className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            printInBackground(`/service/${t.id}`);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 transition-colors"
                          title="In lại biên nhận sửa"
                        >
                          <Printer className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TicketCardItem({ ticket }: { ticket: ServiceTicketRow }) {
  const DeviceIcon = DEVICE_ICONS[ticket.deviceType] || Smartphone;
  const deviceLabel = [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "Thiết bị tiếp nhận";
  const dateObj = new Date(ticket.receivedAt || ticket.createdAt);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 transition-all duration-200 hover:border-amber-500/50 hover:shadow-xl hover:-translate-y-0.5 shadow-sm">
      <Link href={`/service/${ticket.id}`} className="absolute inset-0 z-0 rounded-2xl" aria-label={`Xem phiếu ${ticket.code}`} />

      <div className="relative z-10 pointer-events-none space-y-3">
        {/* Top Code & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <DeviceIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {ticket.code}
              </span>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Clock className="size-3 text-slate-400" />
                <span>{formatDateTime(dateObj)}</span>
              </div>
            </div>
          </div>
          <ServiceStatusBadge status={ticket.status} />
        </div>

        {/* Customer & Device Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[170px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {ticket.customerName}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              {ticket.customerPhone}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Smartphone className="size-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{deviceLabel}</span>
            {ticket.imei && (
              <span className="font-mono text-[10px] text-slate-400 ml-auto shrink-0">
                SN: {ticket.imei.slice(-6)}
              </span>
            )}
          </div>

          {/* Problem description quote */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed italic">
            "{ticket.problem}"
          </div>
        </div>
      </div>

      {/* Technician & Financials Footer */}
      <div className="relative z-10 pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
          <User className="size-3.5 text-slate-400" />
          <span className="truncate max-w-[120px]">
            {ticket.assignedToName ?? "Chưa giao KTV"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
              Báo giá dự kiến
            </div>
            <div className="text-sm font-black font-mono text-blue-600 dark:text-blue-400 tabular-numbers">
              {formatVND(ticket.estimatedCost)}
            </div>
          </div>

          {/* Quick Print Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              printInBackground(`/service/${ticket.id}`);
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-all shadow-2xs pointer-events-auto"
            title="In biên nhận tiếp nhận máy"
          >
            <Printer className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
