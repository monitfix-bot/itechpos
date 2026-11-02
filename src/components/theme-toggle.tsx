"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, []);

  function toggle() {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("pos_theme_mode", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("pos_theme_mode", "light");
      } catch {}
    }
  }

  if (!mounted) {
    return (
      <div className={cn("size-8.5 rounded-lg border border-border/80 bg-card/50", className)} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "relative inline-flex items-center justify-center size-8.5 rounded-lg border border-border/80 bg-card hover:bg-muted/70 transition-all duration-200 shadow-2xs tactile-button group outline-none",
        isDark ? "text-amber-400 hover:text-amber-300" : "text-slate-600 hover:text-slate-900",
        className
      )}
      title={isDark ? "Chuyển sang giao diện Sáng (Light Mode)" : "Chuyển sang giao diện Tối (Dark Mode)"}
      aria-label="Đổi giao diện Sáng / Tối"
    >
      {isDark ? (
        <Sun className="size-4.5 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}
