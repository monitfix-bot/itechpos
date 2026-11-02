"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as Icons from "lucide-react";
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Trash2,
  Receipt,
  Loader2,
  ChevronDown,
  Smartphone,
  Tag,
  User,
  ArrowRight,
  CreditCard,
  Banknote,
  QrCode,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { printInBackground } from "@/lib/print";
import { toast } from "sonner";
import { createSale } from "./actions";
import {
  CustomerPhoneField,
  type CustomerSelection,
} from "@/components/customer-phone-field";

import { playPosSound } from "@/lib/sound";

type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  price: number;
  stock: number;
  categoryType: string;
  categoryIcon: string;
  categoryId: string;
};

type Category = { id: string; name: string; type: string; icon: string };
type Customer = { id: string; name: string; phone: string; code: string };

type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  imei?: string;
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const pascalName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const IconComponent = (Icons as any)[pascalName] || Icons.Package;
  return <IconComponent className={className} />;
}

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Tiền mặt" },
  { value: "transfer", label: "Chuyển khoản (VietQR)" },
];

function spawnFlyingDot(startX: number, startY: number) {
  if (typeof document === "undefined") return;
  const target = document.getElementById("cart-icon-box");
  if (!target) return;
  const rect = target.getBoundingClientRect();

  const dot = document.createElement("div");
  dot.className = "flying-dot";
  dot.textContent = "+1";
  dot.style.left = `${startX - 14}px`;
  dot.style.top = `${startY - 14}px`;
  document.body.appendChild(dot);

  requestAnimationFrame(() => {
    dot.style.left = `${rect.left + rect.width / 2 - 14}px`;
    dot.style.top = `${rect.top + rect.height / 2 - 14}px`;
    dot.style.transform = "scale(0.35)";
    dot.style.opacity = "0.2";
  });

  setTimeout(() => {
    dot.remove();
  }, 520);
}

export function PosClient({
  isActive = true,
  products,
  categories,
  customers,
  onCreated,
  showHeader = true,
}: {
  isActive?: boolean;
  products: Product[];
  categories: Category[];
  customers: Customer[];
  onCreated?: (info: { id: string; code: string; print: boolean }) => void;
  showHeader?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "stock-asc">("default");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerSelection>({ mode: "none" });
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [discount, setDiscount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [openCheckout, setOpenCheckout] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [mobileView, setMobileView] = useState<"catalog" | "cart">("catalog");
  const [customerError, setCustomerError] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = products.filter((p) => {
      if (activeCat !== "all" && p.categoryId !== activeCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
      );
    });

    const sorted = [...base];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === "stock-asc") sorted.sort((a, b) => a.stock - b.stock);
    return sorted;
  }, [products, search, activeCat, sortBy]);

  function addToCart(p: Product, e?: React.MouseEvent) {
    if (p.stock <= 0 && p.categoryType !== "service") {
      toast.error("Sản phẩm đã hết hàng trong kho");
      playPosSound("warn");
      return;
    }

    if (e) {
      spawnFlyingDot(e.clientX, e.clientY);
    }
    playPosSound("beep");

    setCart((curr) => {
      const idx = curr.findIndex((c) => c.productId === p.id);
      if (idx >= 0) {
        const next = [...curr];
        if (next[idx].quantity >= p.stock && p.categoryType !== "service") {
          toast.error("Vượt quá số lượng tồn kho khả dụng");
          return curr;
        }
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...curr,
        {
          productId: p.id,
          name: p.name,
          unitPrice: p.price,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((curr) => curr.filter((c) => c.productId !== productId));
      return;
    }
    setCart((curr) =>
      curr.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c)),
    );
  }

  function updateImei(productId: string, imei: string) {
    setCart((curr) =>
      curr.map((c) => (c.productId === productId ? { ...c, imei } : c)),
    );
  }

  function removeItem(productId: string) {
    setCart((curr) => curr.filter((c) => c.productId !== productId));
  }

  const subtotal = cart.reduce(
    (s, c) => s + c.unitPrice * c.quantity - c.discount,
    0,
  );
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

    

  useEffect(() => {
    function handleShortcut(e: Event) {
      if (!isActive) return;
      const customEvent = e as CustomEvent;
      const key = customEvent.detail;
      if (key === "F2") {
        const input = document.getElementById("pos-search-input") as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      } else if (key === "F4") {
        const input = document.getElementById("customer-phone-input") as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      } else if (key === "F9") {
        if (!openCheckout) {
          handleCheckout();
        } else {
          confirmCheckout();
        }
      }
    }
    window.addEventListener("pos-shortcut", handleShortcut);
    return () => window.removeEventListener("pos-shortcut", handleShortcut);
  }, [isActive, openCheckout, cart, customer, discount, note, paymentMethod, customers, mobileView]);

    function isCustomerValid(): boolean {
    if (customer.mode === "existing") return true;
    if (customer.mode === "new") {
      return Boolean(customer.phone.trim() && customer.name.trim());
    }
    return false;
  }

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Giỏ hàng đang trống! Vui lòng chọn sản phẩm.");
      playPosSound("warn");
      return;
    }
    if (!isCustomerValid()) {
      toast.error("⚠️ Vui lòng nhập thông tin khách hàng trước khi thanh toán!");
      playPosSound("warn");
      setCustomerError(true);
      setTimeout(() => setCustomerError(false), 2500);
      setMobileView("cart");
      const input = document.getElementById("customer-phone-input") as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }
    setOpenCheckout(true);
    playPosSound("tab");
  }

  function confirmCheckout() {
    if (!isCustomerValid()) {
      toast.error("⚠️ Vui lòng nhập thông tin khách hàng trước khi thanh toán!");
      playPosSound("warn");
      setOpenCheckout(false);
      setCustomerError(true);
      setMobileView("cart");
      return;
    }
    startTransition(async () => {
      const customerPayload =
        customer.mode === "existing"
          ? { customerId: customer.customer.id }
          : customer.mode === "new"
            ? {
                newCustomer: {
                  name: customer.name.trim(),
                  phone: customer.phone.trim(),
                },
              }
            : {};
      const res = await createSale({
        items: cart,
        ...customerPayload,
        paymentMethod,
        discount,
        note,
      });
      if (res.ok) {
        playPosSound("success");
        toast.success(`Tạo hoá đơn ${res.code} thành công!`);
        setCart([]);
        setDiscount(0);
        setNote("");
        setCustomer({ mode: "none" });
        setOpenCheckout(false);
        setOpenCart(false);
        await printInBackground(`/sales/${res.id}`);
        if (onCreated) {
          onCreated({ id: res.id, code: res.code, print: true });
        } else {
          router.refresh();
          router.push(`/sales/${res.id}`);
        }
      } else {
        playPosSound("warn");
        toast.error(res.error || "Có lỗi xảy ra khi tạo đơn");
      }
    });
  }

  return (
    <div className="space-y-3 pb-24 lg:pb-0">
      {/* Mobile View Switcher (Chuyển đổi Sản phẩm / Giỏ hàng trên điện thoại) */}
      <div className="lg:hidden flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 select-none">
        <button
          type="button"
          onClick={() => {
            setMobileView("catalog");
            playPosSound("tab");
          }}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all",
            mobileView === "catalog"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          )}
        >
          <Package className="size-3.5" />
          <span>Sản phẩm ({filtered.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileView("cart");
            playPosSound("tab");
          }}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all relative",
            mobileView === "cart"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          )}
        >
          <ShoppingCart className="size-3.5" />
          <span>Giỏ hàng</span>
          {itemCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* CỘT TRÁI (8/12): DANH MỤC, TÌM KIẾM & LƯỚI SẢN PHẨM V2.5 */}
      <section className={cn("lg:col-span-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-sm flex-col gap-4", mobileView === "cart" ? "hidden lg:flex" : "flex")}>
        {/* Thanh Tìm kiếm sản phẩm / Quét Barcode */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="input-glow flex-1 relative flex items-center bg-slate-50 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-4 py-2.5 transition-all">
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-3 shrink-0" />
            <input
              type="text"
              id="pos-search-input"
              placeholder="[F2] Tìm nhanh theo tên sản phẩm, mã SKU, thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 mr-1"
              >
                <X className="size-4" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-700 ml-2 text-xs text-slate-400 shrink-0">
              <span className="font-mono text-[11px] font-semibold">Auto-Scan</span>
            </div>
          </div>


        </div>

        {/* Thanh Danh mục (Category Pills) */}
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => {
                setActiveCat("all");
                playPosSound("tab");
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shrink-0",
                activeCat === "all"
                  ? "font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]"
                  : "font-semibold bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700"
              )}
            >
              <span>Tất cả</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-mono",
                  activeCat === "all" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}
              >
                {products.length}
              </span>
            </button>

            {categories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length;
              const isActive = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCat(c.id);
                    playPosSound("tab");
                  }}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shrink-0",
                    isActive
                      ? "font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]"
                      : "font-semibold bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700"
                  )}
                >
                  <DynamicIcon name={c.icon || "package"} className="size-3.5" />
                  <span>{c.name}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-md text-[10px] font-mono",
                      isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs font-medium text-slate-400 hidden sm:inline">
            Hiển thị {filtered.length} sản phẩm
          </span>
        </div>

        {/* Lưới Thẻ Sản Phẩm (V2.5 POS Card Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 min-h-[460px] content-start">
          {filtered.map((p) => {
            const isOutOfStock = p.stock <= 0 && p.categoryType !== "service";
            const inCartItem = cart.find((c) => c.productId === p.id);
            const inCartQty = inCartItem ? inCartItem.quantity : 0;

            let iconColorClass = "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60";
            if (p.categoryType === "service") {
              iconColorClass = "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60";
            } else if (p.categoryType === "phone") {
              iconColorClass = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60";
            } else if (p.categoryType === "accessory") {
              iconColorClass = "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60";
            }

            return (
              <div
                key={p.id}
                onClick={(e) => addToCart(p, e)}
                className={cn(
                  "pos-card group cursor-pointer rounded-2xl bg-white dark:bg-slate-800/90 p-4 flex flex-col justify-between min-h-[140px] sm:min-h-[164px] p-2.5 sm:p-4 select-none border transition-all",
                  inCartQty > 0
                    ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/15"
                    : "border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500",
                  isOutOfStock && "opacity-50 pointer-events-none"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform", iconColorClass)}>
                        <DynamicIcon name={p.categoryIcon || "package"} className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-slate-400">
                        {p.sku}
                      </span>
                    </div>

                    {p.categoryType === "service" ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        Dịch vụ
                      </span>
                    ) : p.stock <= 5 ? (
                      <span className="px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                        Kho: {p.stock}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        Kho: {p.stock}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 mt-3 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {p.name}
                  </h3>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400">
                    {formatVND(p.price)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {inCartQty > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold">
                        x{inCartQty}
                      </span>
                    )}
                    <button
                      type="button"
                      className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-600 group-hover:text-white text-slate-600 dark:text-slate-200 flex items-center justify-center transition-all shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-20 flex flex-col items-center gap-3 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Không tìm thấy sản phẩm nào khớp với từ khóa.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CỘT PHẢI (4/12): GIỎ HÀNG BÁN LẺ & THANH TOÁN V2.5 */}
      <aside className={cn("lg:col-span-4 lg:sticky lg:top-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/5 flex-col overflow-hidden", mobileView === "catalog" ? "hidden lg:flex" : "flex")}>
        {/* Header Giỏ hàng */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-950/30 dark:to-transparent">
          <div className="flex items-center gap-2.5">
            <div
              id="cart-icon-box"
              className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
                Giỏ Hàng Bán Lẻ
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                TechShop Workstation V2.5
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-mono text-xs font-bold shadow-sm shadow-blue-600/30">
            {itemCount} món
          </span>
        </div>

        {/* Khối Thông tin Khách hàng */}
        <div className={cn(
          "px-4 sm:px-5 pt-4 pb-3 border-b transition-all space-y-2",
          customerError
            ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
            : "border-slate-100 dark:border-slate-800/80"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Khách Hàng <span className="text-rose-500">*</span>
              </span>
            </div>
            {isCustomerValid() ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                ✓ Đã chọn
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Bắt buộc
              </span>
            )}
          </div>
          <CustomerPhoneField
            customers={customers}
            value={customer}
            onChange={(c) => {
              setCustomer(c);
              if (customerError) setCustomerError(false);
            }}
            hasError={customerError}
            required
          />
        </div>

        {/* Danh sách sản phẩm trong Giỏ hàng */}
        <div className="p-4 sm:p-5 flex-1 min-h-[260px] max-h-[360px] overflow-y-auto space-y-2.5 [scrollbar-width:thin]">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center px-4 select-none opacity-70">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2.5">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Giỏ hàng đang trống</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                Chọn sản phẩm bên trái hoặc quét mã barcode để thêm nhanh.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="cart-item-enter p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-3 group hover:border-blue-400/60 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatVND(item.unitPrice)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5" title={item.name}>
                    {item.name}
                  </p>
                  <p className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                    {formatVND(item.unitPrice * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs transition-colors"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold w-6 text-center text-slate-800 dark:text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Khu vực Chiết khấu & Tổng tiền */}
        <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Chiết khấu thêm
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDiscount(50000)}
                  className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[10px] font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  -50K
                </button>
                <button
                  type="button"
                  onClick={() => setDiscount(100000)}
                  className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[10px] font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  -100K
                </button>
                <button
                  type="button"
                  onClick={() => setDiscount(Math.round((subtotal * 5) / 100))}
                  className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-bold text-amber-600 dark:text-amber-400 transition-colors"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => setDiscount(0)}
                  className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-rose-500"
                >
                  Xoá
                </button>
              </div>
            </div>

            <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-500 transition-all">
              <Tag className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <input
                type="number"
                min={0}
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-transparent font-mono text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-xs font-mono text-slate-400">₫</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Tạm tính ({itemCount} sản phẩm)</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {formatVND(subtotal)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span>Giảm giá trực tiếp</span>
                <span className="font-mono font-semibold">-{formatVND(discount)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                TỔNG THANH TOÁN
              </span>
              <span className="font-mono text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                {formatVND(total)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Bạn có chắc muốn xoá toàn bộ giỏ hàng?")) {
                  setCart([]);
                  setDiscount(0);
                  playPosSound("warn");
                }
              }}
              disabled={cart.length === 0}
              className="col-span-4 py-3 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Huỷ đơn</span>
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="col-span-8 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-45 disabled:pointer-events-none"
            >
              <Banknote className="w-4 h-4" />
              <span>THANH TOÁN (F9)</span>
            </button>
          </div>
        </div>
      </aside>
      </div>

      {/* Mobile Floating Cart Action Bar */}
      {mobileView === "catalog" && itemCount > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-40 lg:hidden p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-700/80 text-white shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative p-2 rounded-xl bg-blue-600 text-white shrink-0">
              <ShoppingCart className="size-4.5" />
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 font-mono font-extrabold text-[10px] leading-tight">
                {itemCount}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 truncate">TỔNG ({itemCount} MÓN)</div>
              <div className="font-mono text-sm sm:text-base font-extrabold text-blue-400 truncate">{formatVND(total)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMobileView("cart");
              playPosSound("tab");
            }}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <span>Xem Giỏ</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Checkout Modal V2.5 */}
      <Dialog open={openCheckout} onOpenChange={setOpenCheckout}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <DialogTitle className="text-base font-extrabold flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              Xác Nhận Thanh Toán Đơn Hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kiểm tra thông tin chi tiết và chọn hình thức thanh toán.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Payment Method Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "p-3 rounded-2xl flex flex-col items-center gap-1 text-xs transition-all",
                  paymentMethod === "cash"
                    ? "border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                    : "border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 font-semibold"
                )}
              >
                <Banknote className="w-5 h-5" />
                <span>Tiền mặt</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={cn(
                  "p-3 rounded-2xl flex flex-col items-center gap-1 text-xs transition-all",
                  paymentMethod === "transfer"
                    ? "border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                    : "border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 font-semibold"
                )}
              >
                <QrCode className="w-5 h-5" />
                <span>VietQR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "p-3 rounded-2xl flex flex-col items-center gap-1 text-xs transition-all",
                  paymentMethod === "card"
                    ? "border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                    : "border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 font-semibold"
                )}
              >
                <CreditCard className="w-5 h-5" />
                <span>Thẻ / POS</span>
              </button>
            </div>

            {/* Breakdown box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Số lượng món:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{itemCount} sản phẩm</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatVND(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Giảm giá:</span>
                  <span className="font-mono font-bold">-{formatVND(discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-extrabold">
                <span className="text-slate-900 dark:text-white">Cần thu khách:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 text-lg">{formatVND(total)}</span>
              </div>
            </div>

            {/* Note input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Ghi chú hoá đơn (nếu có)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú giao hàng, yêu cầu đặc biệt..."
                className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2.5 sm:gap-2.5 sm:flex-row flex-col pt-2">
            <button
              type="button"
              onClick={() => setOpenCheckout(false)}
              className="w-1/3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={confirmCheckout}
              disabled={pending}
              className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              <span>Hoàn Tất & In Hóa Đơn</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}