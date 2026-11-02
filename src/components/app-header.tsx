"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Laptop,
  LogOut,
  Settings,
  ShoppingCart,
  Wrench,
  ClipboardList,
  ChevronDown,
  Receipt,
  Search,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/app/(app)/actions";
import type { SessionUser } from "@/lib/auth";
import Image from "next/image";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import { THEME_COLOR_PRESETS } from "@/lib/settings";
import {
  SeasonalGarland,
  ChristmasSantaHat,
  HalloweenLogoPumpkin,
} from "@/components/seasonal-garland";
import { cn } from "@/lib/utils";

type PendingTicket = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  deviceLabel: string;
  status: string;
};

export function AppHeader({
  user,
  pendingTickets,
  shopName,
  shopTagline,
  logoUrl,
  themeColor: initialThemeColor,
}: {
  user: SessionUser;
  pendingTickets: PendingTicket[];
  shopName: string;
  shopTagline: string;
  logoUrl: string | null;
  themeColor?: string;
}) {
  const pathname = usePathname();
  const [pendingQ, setPendingQ] = useState("");
  const [currentTheme, setCurrentTheme] = useState<string>(initialThemeColor || "blue");
  const [effectsEnabled, setEffectsEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme_color") || document.documentElement.getAttribute("data-theme");
      if (saved) setCurrentTheme(saved);

      const savedPref = localStorage.getItem("seasonal_effects_enabled");
      if (savedPref !== null) setEffectsEnabled(savedPref === "true");

      const handler = (e: Event) => {
        const detail = (e as CustomEvent<string>)?.detail;
        if (detail) {
          setCurrentTheme(detail);
        } else {
          const t = localStorage.getItem("theme_color") || document.documentElement.getAttribute("data-theme");
          if (t) setCurrentTheme(t);
        }
      };

      const toggleHandler = (e: Event) => {
        const custom = e as CustomEvent<boolean>;
        if (typeof custom.detail === "boolean") setEffectsEnabled(custom.detail);
      };

      window.addEventListener("pos_theme_changed", handler);
      window.addEventListener("pos_toggle_seasonal_effects", toggleHandler);

      return () => {
        window.removeEventListener("pos_theme_changed", handler);
        window.removeEventListener("pos_toggle_seasonal_effects", toggleHandler);
      };
    }
  }, []);

  const activeSeasonal = useMemo(() => {
    return THEME_COLOR_PRESETS.find((p) => p.id === currentTheme && p.category === "seasonal");
  }, [currentTheme]);

  const filteredPending = useMemo(() => {
    const s = pendingQ.trim().toLowerCase();
    if (!s) return pendingTickets;
    return pendingTickets.filter(
      (t) =>
        t.customerPhone.toLowerCase().includes(s) ||
        t.customerName.toLowerCase().includes(s) ||
        t.deviceLabel.toLowerCase().includes(s) ||
        t.code.toLowerCase().includes(s),
    );
  }, [pendingTickets, pendingQ]);

  // Primary workspace tabs
  const mainNavLinks = [
    {
      title: "Bán hàng (POS)",
      url: "/pos",
      icon: ShoppingCart,
      active: pathname === "/pos",
    },
    {
      title: "Tiếp nhận & Sửa chữa",
      url: "/service",
      icon: Wrench,
      active: pathname.startsWith("/service"),
      badge: pendingTickets.length > 0 ? pendingTickets.length : null,
    },
    {
      title: "Đơn bán",
      url: "/sales",
      icon: Receipt,
      active: pathname.startsWith("/sales"),
    },
    {
      title: "Kho & Linh kiện",
      url: "/products",
      icon: Package,
      active: pathname.startsWith("/products") || pathname.startsWith("/stock") || pathname.startsWith("/categories"),
    },
    {
      title: "Khách hàng",
      url: "/customers",
      icon: Users,
      active: pathname.startsWith("/customers"),
    },
  ];

  // Secondary menu navigation
  const secondaryNav = [
    { title: "Bảng điều khiển (Dashboard)", url: "/dashboard", icon: LayoutDashboard },
    { title: "Báo cáo doanh thu & Lợi nhuận", url: "/reports", icon: BarChart3 },
    { title: "Kiểm kê & Biến động kho", url: "/stock", icon: ClipboardList },
    { title: "Danh mục linh kiện", url: "/categories", icon: Layers },
  ];

  if (user.role === "admin") {
    secondaryNav.push({ title: "Quản lý nhân sự & Kỹ thuật", url: "/users", icon: Users });
    secondaryNav.push({ title: "Cấu hình cửa hàng & Mẫu in", url: "/settings", icon: Settings });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl px-3 sm:px-4 shadow-2xs relative">
      {/* Brand & Shop identity */}
      <Link href="/pos" className="flex items-center gap-2.5 shrink-0 group mr-1">
        <div className="relative">
          {logoUrl ? (
            <div className="size-9 rounded-xl overflow-hidden bg-surface border border-border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src={logoUrl}
                alt={shopName}
                width={36}
                height={36}
                className="object-contain max-h-9"
                unoptimized
              />
            </div>
          ) : (
            <div className="size-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 transition-transform group-hover:scale-105">
              <Laptop className="size-4.5" />
            </div>
          )}

          {/* Seasonal Festive Corner Badges (Santa Hat for Christmas, Pumpkin for Halloween) */}
          {effectsEnabled && currentTheme === "christmas" && (
            <ChristmasSantaHat />
          )}
          {effectsEnabled && currentTheme === "halloween" && (
            <HalloweenLogoPumpkin />
          )}
        </div>
        <div className="hidden xl:flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight leading-tight text-slate-900 dark:text-white">
              {shopName}
            </span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 font-mono">
              V2.5
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[140px] leading-tight">
            {shopTagline}
          </span>
        </div>
        {activeSeasonal && (
          <span className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 shadow-2xs animate-in fade-in zoom-in-95 duration-300">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-primary"></span>
            </span>
            {activeSeasonal.tag || activeSeasonal.name}
          </span>
        )}
      </Link>

      {/* Primary Workstation Nav Links */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
        {mainNavLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs transition-all duration-150 border tactile-button",
                item.active
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs border-slate-200/80 dark:border-slate-700/80"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800 font-semibold border-transparent"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.title}</span>
              {typeof item.badge === "number" && item.badge > 0 && (
                <span
                  className={cn(
                    "ml-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold leading-none border",
                    item.active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  )}
                >
                  <span className="relative flex size-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-1.5 bg-amber-500"></span>
                  </span>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Global Quick Search (Ctrl+K) */}
      <GlobalSearch />

      {/* Live Repair Tickets Popover / Ticker */}
      <DropdownMenu>
        <DropdownMenuTrigger className="relative inline-flex items-center gap-2 h-8.5 px-2.5 rounded-lg text-xs font-semibold border border-border/80 bg-card hover:bg-muted/70 transition-all shadow-2xs tactile-button">
          <span className="relative flex size-2">
            {pendingTickets.length > 0 ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            )}
          </span>
          <span className="hidden md:inline text-foreground">Phiếu chờ</span>
          <span className={cn(
            "font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none tabular-numbers",
            pendingTickets.length > 0
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
              : "bg-muted text-muted-foreground border-border/50"
          )}>
            {pendingTickets.length}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-88 p-0 border border-border shadow-xl rounded-xl">
          <div className="p-3 bg-muted/30 border-b border-border/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                Phiếu sửa chữa chưa trả ({pendingTickets.length})
              </span>
              <Link
                href="/service"
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={pendingQ}
                onChange={(e) => setPendingQ(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Tìm nhanh SĐT, model, mã phiếu..."
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40 p-1">
            {filteredPending.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {pendingTickets.length === 0
                  ? "Tuyệt vời! Không còn phiếu nào đang tồn đọng."
                  : "Không tìm thấy phiếu phù hợp."}
              </div>
            ) : (
              filteredPending.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  render={
                    <Link
                      href={`/pos?ticket=${t.id}&code=${encodeURIComponent(t.code)}`}
                    />
                  }
                  className="flex flex-col items-start gap-1 p-2 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {t.code}
                    </span>
                    <ServiceStatusBadge status={t.status} className="scale-90 origin-right" />
                  </div>
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="font-medium text-foreground truncate max-w-[170px]">
                      {t.customerName}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {t.customerPhone}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate w-full flex items-center gap-1">
                    <Smartphone className="size-3 shrink-0 text-slate-400" />
                    {t.deviceLabel}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationBell />
      <ThemeToggle />

      {/* User profile & Navigation Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 h-8.5 px-2 rounded-md hover:bg-muted/80 transition-all duration-150 outline-none border border-border/60 shadow-2xs">
          <Avatar className="size-6.5 shrink-0 border border-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-bold">
              {user.name
                .split(" ")
                .map((s) => s[0])
                .slice(-2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left leading-none">
            <span className="font-bold text-xs text-foreground truncate max-w-[120px]">
              {user.name}
            </span>
            <span className="text-muted-foreground text-[10px] mt-0.5">
              {roleLabel(user.role)}
            </span>
          </div>
          <ChevronDown className="size-3 text-muted-foreground hidden sm:inline" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-68 p-1.5 rounded-xl border border-border shadow-xl bg-popover/98 backdrop-blur-md">
          {/* User profile card */}
          <div className="px-3 py-2.5 mb-1 rounded-lg bg-primary text-primary-foreground shadow-sm">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-9 border border-white/20 shadow-xs">
                <AvatarFallback className="bg-primary-foreground text-primary text-xs font-bold">
                  {user.name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(-2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs truncate text-primary-foreground">{user.name}</span>
                <span className="text-[10px] text-primary-foreground/80 truncate">{user.email}</span>
                <span className="inline-flex items-center mt-1 w-fit px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/20 text-primary-foreground">
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick mobile navigation */}
          <div className="lg:hidden">
            <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Điều hướng chính
            </div>
            {mainNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.url}
                  render={<Link href={item.url} />}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs font-medium"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span>{item.title}</span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator className="my-1 bg-border/60" />
          </div>

          <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
            Quản trị & Báo cáo
          </div>
          <div className="space-y-0.5">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.url}
                  render={<Link href={item.url} />}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/60 text-xs font-medium group"
                >
                  <div className="p-1 rounded-md bg-muted/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon className="size-3.5" />
                  </div>
                  <span>{item.title}</span>
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1 bg-border/60" />

          <DropdownMenuItem
            render={<form action={logoutAction} className="w-full" />}
            className="p-0"
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <div className="p-1 rounded-md bg-rose-100/60 dark:bg-rose-900/40">
                <LogOut className="size-3.5 text-rose-600" />
              </div>
              Đăng xuất
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Festive Hanging Garland (Hangs immediately under the header) */}
      {effectsEnabled && <SeasonalGarland theme={currentTheme} />}
    </header>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Quản trị viên";
    case "technician":
      return "Kỹ thuật viên";
    default:
      return "Nhân viên thu ngân";
  }
}
