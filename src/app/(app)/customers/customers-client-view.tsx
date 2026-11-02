"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  Mail,
  MapPin,
  Wrench,
  ShoppingCart,
  ArrowUpDown,
  Crown,
  Sparkles,
  ChevronRight,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CustomerRowActions } from "./customer-actions";

export type CustomerRow = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  note: string | null;
  createdAt: string;
  totalSpent: number;
  salesCount: number;
  serviceTicketsCount: number;
};

function getTier(totalSpent: number): {
  label: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
} {
  if (totalSpent >= 20000000) {
    return {
      label: "VIP Kim Cương",
      icon: Crown,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    };
  }
  if (totalSpent >= 5000000) {
    return {
      label: "VIP Vàng",
      icon: Sparkles,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    };
  }
  if (totalSpent >= 1000000) {
    return {
      label: "Thân Thiết",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    };
  }
  return {
    label: "Thành Viên",
    icon: Users,
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
  };
}

export function CustomersClientView({
  initialCustomers,
}: {
  initialCustomers: CustomerRow[];
}) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "diamond" | "gold" | "silver" | "service">("all");
  const [sortBy, setSortBy] = useState<"latest" | "spent-desc" | "service-desc" | "name">("spent-desc");

  // Filtering & Sorting
  const filteredCustomers = useMemo(() => {
    let result = [...initialCustomers];

    // Tier / Category filter
    if (tierFilter === "diamond") {
      result = result.filter((c) => c.totalSpent >= 20000000);
    } else if (tierFilter === "gold") {
      result = result.filter((c) => c.totalSpent >= 5000000 && c.totalSpent < 20000000);
    } else if (tierFilter === "silver") {
      result = result.filter((c) => c.totalSpent >= 1000000 && c.totalSpent < 5000000);
    } else if (tierFilter === "service") {
      result = result.filter((c) => c.serviceTicketsCount > 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "spent-desc") return b.totalSpent - a.totalSpent;
      if (sortBy === "service-desc") return b.serviceTicketsCount - a.serviceTicketsCount;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "latest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return result;
  }, [initialCustomers, tierFilter, searchQuery, sortBy]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      all: initialCustomers.length,
      diamond: initialCustomers.filter((c) => c.totalSpent >= 20000000).length,
      gold: initialCustomers.filter((c) => c.totalSpent >= 5000000 && c.totalSpent < 20000000).length,
      silver: initialCustomers.filter((c) => c.totalSpent >= 1000000 && c.totalSpent < 5000000).length,
      service: initialCustomers.filter((c) => c.serviceTicketsCount > 0).length,
    };
  }, [initialCustomers]);

  const hasActiveFilters = searchQuery.trim() || tierFilter !== "all" || sortBy !== "spent-desc";

  function resetFilters() {
    setSearchQuery("");
    setTierFilter("all");
    setSortBy("spent-desc");
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
              placeholder="Tìm theo tên, SĐT, mã khách hàng (KH...), địa chỉ, email..."
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

          {/* Controls: Sorter & View Switcher */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200">
              <ArrowUpDown className="size-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="spent-desc">Chi tiêu nhiều nhất</option>
                <option value="service-desc">Lượt sửa nhiều nhất</option>
                <option value="latest">Mới thêm gần nhất</option>
                <option value="name">Tên A-Z</option>
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
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="Xem dạng hồ sơ khách hàng (Grid)"
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
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="Xem dạng bảng CRM chi tiết (Table)"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Bảng chi tiết</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Segmentation Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto [scrollbar-width:none]">
            {/* All */}
            <button
              type="button"
              onClick={() => setTierFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                tierFilter === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {counts.all}
              </span>
            </button>

            {/* Diamond VIP */}
            <button
              type="button"
              onClick={() => setTierFilter("diamond")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                tierFilter === "diamond"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <Crown className="size-3.5 text-amber-300" />
              <span>VIP Kim Cương</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {counts.diamond}
              </span>
            </button>

            {/* Gold VIP */}
            <button
              type="button"
              onClick={() => setTierFilter("gold")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                tierFilter === "gold"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <Sparkles className="size-3.5" />
              <span>VIP Vàng</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {counts.gold}
              </span>
            </button>

            {/* Silver / Regular */}
            <button
              type="button"
              onClick={() => setTierFilter("silver")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                tierFilter === "silver"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <span>Thân thiết (≥1M)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {counts.silver}
              </span>
            </button>

            {/* Service customers */}
            <button
              type="button"
              onClick={() => setTierFilter("service")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                tierFilter === "service"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <Wrench className="size-3.5" />
              <span>Từng sửa máy</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {counts.service}
              </span>
            </button>
          </div>

          {/* Active summary & Reset */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
              Hiển thị <span className="font-bold text-slate-800 dark:text-white">{filteredCustomers.length}</span> hồ sơ
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
      {filteredCustomers.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3">
          <div className="size-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Users className="size-7 opacity-50" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Không tìm thấy khách hàng nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Không có hồ sơ nào phù hợp với bộ lọc hoặc từ khoá tìm kiếm.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
            >
              Xoá bộ lọc tìm kiếm
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => (
            <CustomerCardItem key={c.id} customer={c} />
          ))}
        </div>
      ) : (
        /* HIGH-DENSITY TABLE VIEW */
        <div className="overflow-x-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm [scrollbar-width:thin]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                <th className="py-3 px-4">Mã KH</th>
                <th className="py-3 px-4">Tên khách hàng</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Hạng thành viên</th>
                <th className="py-3 px-4">Địa chỉ / Email</th>
                <th className="py-3 px-4 text-center">Đơn mua</th>
                <th className="py-3 px-4 text-center">Ca sửa</th>
                <th className="py-3 px-4 text-right">Tổng tích luỹ</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredCustomers.map((c) => {
                const tier = getTier(c.totalSpent);
                const TierIcon = tier.icon;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      <Link href={`/customers/${c.id}`} className="hover:underline">
                        {c.code}
                      </Link>
                    </td>

                    {/* Customer Name */}
                    <td className="py-3 px-4">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-extrabold text-slate-900 dark:text-white truncate max-w-[160px] block hover:text-blue-600 transition-colors"
                      >
                        {c.name}
                      </Link>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <a href={`tel:${c.phone}`} className="hover:text-blue-600 hover:underline">
                        {c.phone}
                      </a>
                    </td>

                    {/* Tier badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                          tier.bg,
                          tier.color,
                          tier.border
                        )}
                      >
                        <TierIcon className="size-3" />
                        <span>{tier.label}</span>
                      </span>
                    </td>

                    {/* Address / Email */}
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate text-[11px]">
                      {c.address || c.email || "—"}
                    </td>

                    {/* Orders count */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {c.salesCount}
                    </td>

                    {/* Repair count */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      {c.serviceTicketsCount}
                    </td>

                    {/* Total Spent */}
                    <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {formatVND(c.totalSpent)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <CustomerRowActions
                          customer={{
                            id: c.id,
                            name: c.name,
                            phone: c.phone,
                            email: c.email,
                            address: c.address,
                            note: c.note,
                          }}
                        />
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

function CustomerCardItem({ customer }: { customer: CustomerRow }) {
  const tier = getTier(customer.totalSpent);
  const TierIcon = tier.icon;
  const initials =
    customer.name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "KH";

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 transition-all duration-200 hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-0.5 shadow-sm">
      <Link
        href={`/customers/${customer.id}`}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`Xem chi tiết ${customer.name}`}
      />

      {/* Action buttons on top right */}
      <div className="absolute right-3.5 top-3.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <CustomerRowActions
          customer={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            note: customer.note,
          }}
        />
      </div>

      <div className="relative z-10 pointer-events-none space-y-3.5">
        {/* Customer Header */}
        <div className="flex items-start gap-3.5">
          <div className="size-11 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform border border-white/20">
            {initials}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {customer.name}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                {customer.code}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-mono font-semibold pointer-events-auto hover:text-blue-600"
              >
                <Phone className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{customer.phone}</span>
              </a>

              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-extrabold border",
                  tier.bg,
                  tier.color,
                  tier.border
                )}
              >
                <TierIcon className="size-2.5" />
                <span>{tier.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Optional Contact info */}
        {(customer.email || customer.address) && (
          <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {customer.email && (
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="size-3 text-slate-400 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="size-3 text-slate-400 shrink-0" />
                <span className="truncate">{customer.address}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Stats Footer */}
      <div className="relative z-10 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 pointer-events-none">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">
            Tổng chi tiêu ({customer.salesCount} đơn)
          </span>
          <span className="font-mono font-black text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-0.5 block truncate">
            {formatVND(customer.totalSpent)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">
            Lượt sửa chữa
          </span>
          <span className="font-mono font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-0.5 block">
            {customer.serviceTicketsCount} ca máy
          </span>
        </div>
      </div>
    </div>
  );
}
