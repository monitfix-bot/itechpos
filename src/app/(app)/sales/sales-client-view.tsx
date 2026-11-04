"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Wrench,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Banknote,
  CreditCard,
  Wallet,
  WalletCards,
  Printer,
  Eye,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import { formatVND, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { printInBackground } from "@/lib/print";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  card: "Thẻ NH",
  transfer: "VietQR",
  wallet: "Ví ĐT",
  split: "Tiền mặt + CK",
};

const PAYMENT_ICONS: Record<string, any> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Wallet,
  wallet: Wallet,
  split: WalletCards,
};

export type InvoiceRow = {
  id: string;
  code: string;
  type: "sale" | "service";
  createdAt: string; // ISO string
  customerName: string | null;
  customerPhone: string | null;
  itemCount: number;
  paymentMethod: string | null;
  total: number;
  href: string;
  device?: string;
};

export function SalesClientView({
  initialRows,
}: {
  initialRows: InvoiceRow[];
}) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "sale" | "service">("all");
  const [payFilter, setPayFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "total-desc" | "total-asc">("latest");

  // Filtering & Sorting
  const filteredRows = useMemo(() => {
    let result = [...initialRows];

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((r) => r.type === typeFilter);
    }

    // Payment method filter
    if (payFilter !== "all") {
      result = result.filter((r) => (r.paymentMethod || "cash") === payFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.customerPhone && r.customerPhone.includes(q)) ||
          (r.device && r.device.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (sortBy === "latest") return timeB - timeA;
      if (sortBy === "oldest") return timeA - timeB;
      if (sortBy === "total-desc") return b.total - a.total;
      if (sortBy === "total-asc") return a.total - b.total;
      return 0;
    });

    return result;
  }, [initialRows, typeFilter, payFilter, searchQuery, sortBy]);

  const saleCount = useMemo(() => initialRows.filter((r) => r.type === "sale").length, [initialRows]);
  const serviceCount = useMemo(() => initialRows.filter((r) => r.type === "service").length, [initialRows]);
  const currentTotal = useMemo(() => filteredRows.reduce((s, r) => s + r.total, 0), [filteredRows]);

  const hasActiveFilters = searchQuery.trim() || typeFilter !== "all" || payFilter !== "all" || sortBy !== "latest";

  function resetFilters() {
    setSearchQuery("");
    setTypeFilter("all");
    setPayFilter("all");
    setSortBy("latest");
  }

  return (
    <div className="space-y-4">
      {/* FILTER & VIEW TOOLBAR */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã hoá đơn, tên khách, số điện thoại, thiết bị..."
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

          {/* Controls: Sort + View Mode Switcher */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200">
              <ArrowUpDown className="size-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="latest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="total-desc">Giá trị cao nhất</option>
                <option value="total-asc">Giá trị thấp nhất</option>
              </select>
            </div>

            {/* View Mode Switcher (Grid vs Table) */}
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
                title="Xem dạng thẻ trực quan (Grid)"
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
                title="Xem dạng bảng số liệu chi tiết (Table)"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Bảng chi tiết</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills (Category Tabs & Payment filter) */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* All Types */}
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                typeFilter === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {initialRows.length}
              </span>
            </button>

            {/* Sales Only */}
            <button
              type="button"
              onClick={() => setTypeFilter("sale")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                typeFilter === "sale"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <ShoppingCart className="size-3.5" />
              <span>Đơn bán lẻ</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {saleCount}
              </span>
            </button>

            {/* Service Only */}
            <button
              type="button"
              onClick={() => setTypeFilter("service")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                typeFilter === "service"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <Wrench className="size-3.5" />
              <span>Hoá đơn sửa chữa</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {serviceCount}
              </span>
            </button>

            {/* Payment Method Filter */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
            <select
              value={payFilter}
              onChange={(e) => setPayFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Mọi PTTT</option>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản (VietQR)</option>
              <option value="card">Thẻ NH</option>
            </select>
          </div>

          {/* Active summary & Reset Button */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
              Hiển thị <span className="font-bold text-slate-800 dark:text-white">{filteredRows.length}</span> hoá đơn
              {" • "}Tổng: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatVND(currentTotal)}</span>
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

      {/* RESULT CONTAINER: GRID VIEW OR TABLE VIEW */}
      {filteredRows.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3">
          <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <Search className="size-7 opacity-50" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Không tìm thấy giao dịch nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hãy thử tìm kiếm với từ khoá khác hoặc đặt lại bộ lọc.
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
          {filteredRows.map((r) => (
            <InvoiceCard key={`${r.type}-${r.id}`} row={r} />
          ))}
        </div>
      ) : (
        /* HIGH-DENSITY TABLE VIEW */
        <div className="overflow-x-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm [scrollbar-width:thin]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                <th className="py-3 px-4">Mã Hóa Đơn</th>
                <th className="py-3 px-4">Loại hình</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Thiết bị / Ghi chú</th>
                <th className="py-3 px-4">PTTT</th>
                <th className="py-3 px-4 text-center">Số lượng</th>
                <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredRows.map((r) => {
                const PaymentIcon = PAYMENT_ICONS[r.paymentMethod ?? ""] || Banknote;
                const isSale = r.type === "sale";
                const dateObj = new Date(r.createdAt);

                return (
                  <tr
                    key={`${r.type}-${r.id}`}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                      <Link href={r.href} className="hover:text-blue-600 transition-colors">
                        {r.code}
                      </Link>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border",
                          isSale
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                            : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        )}
                      >
                        {isSale ? (
                          <ShoppingCart className="size-3" />
                        ) : (
                          <Wrench className="size-3" />
                        )}
                        <span>{isSale ? "Bán lẻ" : "Sửa chữa"}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTime(dateObj)}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {r.customerName || "Khách lẻ tại quầy"}
                      </div>
                      {r.customerPhone && (
                        <div className="text-[10px] font-mono text-slate-400">{r.customerPhone}</div>
                      )}
                    </td>

                    {/* Device / Note */}
                    <td className="py-3 px-4">
                      {r.device ? (
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-500/20 truncate max-w-[180px]">
                          {r.device}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <PaymentIcon className="size-3 text-slate-400" />
                        <span>{PAYMENT_LABELS[r.paymentMethod ?? ""] || "Tiền mặt"}</span>
                      </span>
                    </td>

                    {/* Items count */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {r.itemCount}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {formatVND(r.total)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={r.href}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Xem chi tiết hoá đơn"
                        >
                          <Eye className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            printInBackground(r.href);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 transition-colors"
                          title="In lại hoá đơn"
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

function InvoiceCard({ row }: { row: InvoiceRow }) {
  const PaymentIcon = PAYMENT_ICONS[row.paymentMethod ?? ""] || Banknote;
  const isSale = row.type === "sale";
  const dateObj = new Date(row.createdAt);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 transition-all duration-200 hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-0.5 shadow-sm">
      <Link href={row.href} className="absolute inset-0 z-0 rounded-2xl" aria-label={`Xem hoá đơn ${row.code}`} />

      <div className="relative z-10 pointer-events-none">
        {/* Top Code & Badge */}
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 shadow-xs",
                isSale
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
              )}
            >
              {isSale ? <ShoppingCart className="size-5" /> : <Wrench className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {row.code}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 font-extrabold uppercase tracking-wider rounded-full border",
                    isSale
                      ? "border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300"
                      : "border-amber-300 text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
                  )}
                >
                  {isSale ? "Bán lẻ" : "Sửa chữa"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Calendar className="size-3 text-slate-400" />
                <span>{formatDateTime(dateObj)}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="size-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </div>

        {/* Customer Information Card */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {row.customerName || "Khách lẻ tại quầy"}
          </div>
          {row.customerPhone && (
            <div className="text-[11px] text-slate-500 font-mono font-semibold">
              {row.customerPhone}
            </div>
          )}
          {row.device && (
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-bold truncate bg-amber-500/10 px-2 py-0.5 rounded-lg inline-block border border-amber-500/20 mt-1">
              {row.device}
            </div>
          )}
        </div>
      </div>

      {/* Financials & Quick Action Footer */}
      <div className="relative z-10 pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
            Tổng giá trị
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-blue-600 dark:text-blue-400 tabular-numbers">
            {formatVND(row.total)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">
              {row.itemCount} sản phẩm
            </span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              <PaymentIcon className="size-3 text-slate-400" />
              <span>{PAYMENT_LABELS[row.paymentMethod ?? ""] || "Tiền mặt"}</span>
            </div>
          </div>

          {/* Quick Print Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              printInBackground(row.href);
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-all shadow-2xs pointer-events-auto"
            title="In nhanh hoá đơn"
          >
            <Printer className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
