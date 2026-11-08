"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  Settings,
  Store,
} from "lucide-react";
import { getMainPosUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";

type PortalUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin?: boolean;
};

export function PortalBottomNav({ user }: { user: PortalUser }) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin" || user.isSuperAdmin;

  const navItems = [
    {
      title: "Trang chủ",
      url: "/",
      icon: LayoutDashboard,
      active: pathname === "/" || pathname === "/portal",
    },
    {
      title: "Chấm công",
      url: "/attendance",
      icon: Clock,
      active: pathname === "/attendance" || pathname === "/portal/attendance",
    },
  ];

  if (isAdmin) {
    navItems.push({
      title: "Bảng công",
      url: "/manage",
      icon: ClipboardList,
      active:
        pathname === "/manage" ||
        pathname === "/portal/manage" ||
        pathname === "/attendance/manage",
    });
    navItems.push({
      title: "Cài đặt",
      url: "/settings",
      icon: Settings,
      active: pathname === "/settings" || pathname === "/portal/settings",
    });
  }

  const posUrl = getMainPosUrl();

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-flow-col auto-cols-fr h-14 items-stretch px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "relative flex flex-col items-center justify-center min-h-[48px] py-1 select-none transition-colors group",
                item.active
                  ? "text-blue-600 dark:text-blue-400 font-extrabold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
              )}
            >
              {/* Active Top Bar Indicator */}
              {item.active && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}

              <div
                className={cn(
                  "size-8 rounded-xl flex items-center justify-center transition-all",
                  item.active
                    ? "bg-blue-50 dark:bg-blue-950/60 scale-105"
                    : "group-hover:scale-105"
                )}
              >
                <Icon className="size-4.5 shrink-0 stroke-[2.2]" />
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-0.5">
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* Quick Link to POS */}
        <a
          href={posUrl}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 select-none text-slate-500 dark:text-slate-400 hover:text-foreground font-medium transition-colors group"
        >
          <div className="size-8 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all">
            <Store className="size-4.5 shrink-0 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-0.5">
            Về POS
          </span>
        </a>
      </div>
    </nav>
  );
}
