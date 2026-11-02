import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatVND } from "@/lib/format";
import {
  Package,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  Layers,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductDialog } from "./product-dialog";
import { CategoryDialog } from "../categories/category-dialog";
import { CategoryActions } from "../categories/category-actions";
import { ProductsClientView, type ProductRow } from "./products-client-view";

import * as Icons from "lucide-react";

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const pascalName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const IconComponent = (Icons as any)[pascalName] || Icons.Package;
  return <IconComponent className={className} />;
}

export default async function ProductsPage() {
  const [products, categories, totalProducts, lowStockCount, allActive] =
    await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { category: true },
        take: 300,
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: 5 },
          category: { type: { not: "service" } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { stock: true, costPrice: true, category: true },
      }),
    ]);

  const inventoryValue = allActive.reduce(
    (s, p) =>
      p.category.type === "service" ? s : s + p.stock * (p.costPrice || 0),
    0
  );
  const serviceCount = allActive.filter(
    (p) => p.category.type === "service"
  ).length;

  const serializableProducts: ProductRow[] = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    price: p.price,
    costPrice: p.costPrice,
    stock: p.stock,
    isActive: p.isActive,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    categoryType: p.category.type,
    categoryIcon: p.category.icon,
  }));

  const serializableCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon,
  }));

  return (
    <div className="space-y-5 pb-12">
      {/* 1. HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 border border-white/20">
            <Package className="size-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Kho Hàng & Danh Mục Sản Phẩm
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý danh mục linh kiện, tồn kho phụ kiện và bảng giá các dịch vụ sửa chữa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/stock"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-10 px-4 rounded-2xl text-xs font-bold gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            )}
          >
            <ArrowRightLeft className="size-4" />
            <span>Biến động kho</span>
          </Link>
          <ProductDialog categories={categories} />
        </div>
      </div>

      {/* 2. PRECISION INVENTORY METRICS BAR */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Metric 1: Total SKUs */}
        <div className="p-5 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Tổng mặt hàng (SKU)
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
              {totalProducts}
            </span>
            <span className="text-xs text-slate-500 font-semibold">mã hàng</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đang hoạt động trong danh mục</p>
        </div>

        {/* Metric 2: Inventory Value */}
        <div className="p-5 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Giá trị vốn tồn kho
          </span>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400 tabular-numbers">
              {formatVND(inventoryValue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">Vốn hàng hóa lưu động</p>
          </div>
        </div>

        {/* Metric 3: Low Stock Warning */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Cảnh báo tồn ít
            </span>
            {lowStockCount > 0 && (
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl lg:text-3xl font-black font-mono tracking-tight tabular-numbers",
                lowStockCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"
              )}
            >
              {lowStockCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">mặt hàng</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tồn kho khả dụng ≤ 5 món</p>
        </div>

        {/* Metric 4: Service Packages */}
        <div className="p-5 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Gói dịch vụ sửa chữa
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
              {serviceCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">gói</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dịch vụ kỹ thuật tính công</p>
        </div>
      </div>

      {/* 3. CLIENT PRODUCTS WORKBENCH (GRID & DENSE TABLE) */}
      <ProductsClientView
        initialProducts={serializableProducts}
        categories={serializableCategories}
      />

      {/* 4. CATEGORY MANAGEMENT SECTION */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="size-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                Nhóm Danh Mục Thiết Bị ({categories.length})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Phân loại thiết bị & linh kiện để gán mã SKU tự động
              </p>
            </div>
          </div>
          <CategoryDialog />
        </div>

        <div className="p-4 sm:p-5">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Chưa có danh mục nào được khởi tạo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {categories.map((cat: any) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-all bg-slate-50/60 dark:bg-slate-900/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <DynamicIcon name={cat.icon || "package"} className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {cat.skuPrefix || "—"}
                        </span>
                        <span>•</span>
                        <span>{cat._count?.products ?? 0} sản phẩm</span>
                      </div>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <CategoryActions category={cat} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
