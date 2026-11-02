"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Wrench,
  Search,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  DollarSign,
  TrendingUp,
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductActions } from "./product-actions";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  categoryType: string;
  categoryIcon: string;
};

export function ProductsClientView({
  initialProducts,
  categories,
}: {
  initialProducts: ProductRow[];
  categories: { id: string; name: string; type: string; icon: string }[];
}) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price-desc" | "price-asc" | "stock-asc" | "stock-desc">("name");

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Category filter
    if (selectedCat !== "all") {
      result = result.filter((p) => p.categoryType === selectedCat);
    }

    // Low stock filter
    if (onlyLowStock) {
      result = result.filter((p) => p.categoryType !== "service" && p.stock <= 5);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "stock-asc") return a.stock - b.stock;
      if (sortBy === "stock-desc") return b.stock - a.stock;
      return 0;
    });

    return result;
  }, [initialProducts, selectedCat, onlyLowStock, searchQuery, sortBy]);

  // Counts
  const lowStockCount = useMemo(
    () => initialProducts.filter((p) => p.categoryType !== "service" && p.stock <= 5).length,
    [initialProducts]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialProducts.length };
    initialProducts.forEach((p) => {
      counts[p.categoryType] = (counts[p.categoryType] || 0) + 1;
    });
    return counts;
  }, [initialProducts]);

  const hasActiveFilters = searchQuery.trim() || selectedCat !== "all" || onlyLowStock || sortBy !== "name";

  function resetFilters() {
    setSearchQuery("");
    setSelectedCat("all");
    setOnlyLowStock(false);
    setSortBy("name");
  }

  return (
    <div className="space-y-4">
      {/* FILTER & VIEW TOOLBAR */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, mã SKU, hãng sản xuất..."
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

          {/* Controls: Low stock toggle + Sort + View Mode */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Low stock quick button */}
            <button
              type="button"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                onlyLowStock
                  ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              )}
            >
              <AlertTriangle className={cn("size-3.5", onlyLowStock ? "text-white" : "text-amber-500")} />
              <span>Sắp hết kho</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-mono",
                  onlyLowStock ? "bg-white/20 text-white" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {lowStockCount}
              </span>
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200">
              <ArrowUpDown className="size-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="name">Tên A-Z</option>
                <option value="price-desc">Giá cao nhất</option>
                <option value="price-asc">Giá thấp nhất</option>
                <option value="stock-asc">Tồn kho ít nhất</option>
                <option value="stock-desc">Tồn kho nhiều nhất</option>
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
                title="Xem dạng thẻ linh kiện (Grid)"
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
                title="Xem bảng kiểm kê kho (Table)"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Bảng chi tiết</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto [scrollbar-width:none]">
            {/* All Category */}
            <button
              type="button"
              onClick={() => setSelectedCat("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                selectedCat === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              )}
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                {categoryCounts.all}
              </span>
            </button>

            {/* Each Category */}
            {categories.map((cat) => {
              const count = categoryCounts[cat.type] || 0;
              const isActive = selectedCat === cat.type;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.type)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                  )}
                >
                  <span>{cat.name}</span>
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
              Tìm thấy <span className="font-bold text-slate-800 dark:text-white">{filteredProducts.length}</span> SKU
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
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3">
          <div className="size-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Package className="size-7 opacity-50" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Không tìm thấy sản phẩm nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Không có mặt hàng nào phù hợp với bộ lọc hoặc từ khoá tìm kiếm.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredProducts.map((p) => (
            <ProductCardItem key={p.id} product={p} categories={categories} />
          ))}
        </div>
      ) : (
        /* HIGH-DENSITY TABLE VIEW */
        <div className="overflow-x-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm [scrollbar-width:thin]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4">Tên sản phẩm / Linh kiện</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Hãng</th>
                <th className="py-3 px-4 text-right">Giá vốn</th>
                <th className="py-3 px-4 text-right">Giá bán lẻ</th>
                <th className="py-3 px-4 text-center">Tồn kho</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredProducts.map((p) => {
                const isService = p.categoryType === "service";
                const isLow = !isService && p.stock <= 5 && p.stock > 0;
                const isOut = !isService && p.stock <= 0;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    {/* SKU */}
                    <td className="py-3 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {p.sku}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate max-w-[240px]">
                        {p.name}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-[11px]">
                        {p.categoryName}
                      </span>
                    </td>

                    {/* Brand */}
                    <td className="py-3 px-4 text-slate-500 font-semibold whitespace-nowrap">
                      {p.brand || "—"}
                    </td>

                    {/* Cost Price */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-500 whitespace-nowrap">
                      {p.costPrice ? formatVND(p.costPrice) : "—"}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {formatVND(p.price)}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-center font-mono font-extrabold">
                      {isService ? (
                        <span className="text-slate-400 font-normal">Dịch vụ</span>
                      ) : (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-mono font-bold inline-block",
                            isOut
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : isLow
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          )}
                        >
                          {p.stock}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {isService ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600">
                          <CheckCircle2 className="size-3 text-sky-500" />
                          <span>Sẵn sàng</span>
                        </span>
                      ) : isOut ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <AlertCircle className="size-3 text-rose-500" />
                          <span>Hết hàng</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <AlertTriangle className="size-3 text-amber-500" />
                          <span>Sắp hết</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="size-3 text-emerald-500" />
                          <span>Còn hàng</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <ProductActions product={p as any} categories={categories as any} />
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

function ProductCardItem({
  product,
  categories,
}: {
  product: ProductRow;
  categories: { id: string; name: string; type: string; icon: string }[];
}) {
  const isService = product.categoryType === "service";
  const isLow = !isService && product.stock <= 5 && product.stock > 0;
  const isOut = !isService && product.stock <= 0;

  // Margin percent
  const marginPercent =
    product.costPrice && product.costPrice > 0
      ? Math.round(((product.price - product.costPrice) / product.costPrice) * 100)
      : null;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-4.5 transition-all duration-200 hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-0.5 shadow-sm">
      <div className="space-y-3">
        {/* Header: Category Badge + SKU + Action Menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wide border border-blue-500/20 truncate">
              {product.categoryName}
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {product.sku}
            </span>
          </div>

          <div className="shrink-0">
            <ProductActions product={product as any} categories={categories as any} />
          </div>
        </div>

        {/* Product Name & Brand */}
        <div className="space-y-1">
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
          {product.brand && (
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="size-3" />
              <span>{product.brand}</span>
            </div>
          )}
        </div>

        {/* Stock Level Progress Bar (for physical products) */}
        {!isService && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500">Tồn kho khả dụng:</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600"
                )}
              >
                {product.stock} cái
              </span>
            </div>
            {/* Meter Bar */}
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isOut ? "w-0" : isLow ? "bg-amber-500 w-1/3" : "bg-emerald-500 w-full"
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pricing Footer */}
      <div className="pt-3 mt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
        <div>
          {product.costPrice && product.costPrice > 0 ? (
            <div className="text-[10px] text-slate-400 font-mono">
              Vốn: {formatVND(product.costPrice)}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-semibold">Giá bán lẻ</div>
          )}
          <div className="text-base sm:text-lg font-black font-mono text-blue-600 dark:text-blue-400 tabular-numbers">
            {formatVND(product.price)}
          </div>
        </div>

        {marginPercent !== null && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold",
              marginPercent >= 30
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            )}
            title="Tỷ suất lợi nhuận gộp"
          >
            +{marginPercent}%
          </span>
        )}
      </div>
    </div>
  );
}
