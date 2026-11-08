"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  User,
  MapPin,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/(app)/actions";
import { getMainPosUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";

type PortalUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin?: boolean;
};

export function PortalHeader({
  user,
  shopName,
}: {
  user: PortalUser;
  shopName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      title: "Trang chủ",
      url: "/",
      icon: LayoutDashboard,
      active: pathname === "/" || pathname === "/portal",
    },
    {
      title: "Chấm công GPS",
      url: "/attendance",
      icon: Clock,
      active: pathname === "/attendance" || pathname === "/portal/attendance",
    },
  ];

  if (user.role === "admin" || user.isSuperAdmin) {
    navItems.push({
      title: "Bảng công nhân sự",
      url: "/manage",
      icon: ClipboardList,
      active:
        pathname === "/manage" ||
        pathname === "/portal/manage" ||
        pathname === "/attendance/manage",
    });
    navItems.push({
      title: "Cài đặt ca & GPS",
      url: "/settings",
      icon: Settings,
      active: pathname === "/settings" || pathname === "/portal/settings",
    });
  }

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  const posUrl = getMainPosUrl();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & Subdomain Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight text-foreground">
                  {shopName}
                </span>
                <Badge className="bg-blue-600 text-white font-mono text-[10px] px-2 py-0 border-none uppercase tracking-wider font-extrabold shadow-xs">
                  APP
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                Phân hệ Chấm công & Kỹ thuật
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                  item.active
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/80"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Back to POS & User Menu */}
        <div className="flex items-center gap-2.5">
          {/* Back to POS Button */}
          <a
            href={posUrl}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:border-slate-300"
            title="Quay lại hệ thống bán hàng POS"
          >
            <span>Hệ thống POS</span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </a>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-xl flex items-center gap-2 px-2.5 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none">
              <div className="size-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <div className="text-xs font-bold text-foreground truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {user.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl">
              <div className="px-2.5 py-2 mb-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                <div className="text-xs font-bold text-foreground">{user.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">
                  {user.email}
                </div>
                {user.role === "admin" && (
                  <Badge variant="outline" className="mt-1.5 text-[10px] border-blue-200 text-blue-600 bg-blue-50/50">
                    <ShieldCheck className="size-3 mr-1" />
                    Quản trị viên
                  </Badge>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={<a href={posUrl} />}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium"
              >
                <ExternalLink className="size-3.5" />
                <span>Mở Hệ thống POS</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 text-xs font-bold cursor-pointer"
              >
                <LogOut className="size-3.5 mr-2" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl size-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.url}
                href={item.url}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                  item.active
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <a
              href={posUrl}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="size-3.5 text-blue-600" />
                Chuyển sang Hệ thống POS
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">localhost:3000</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
