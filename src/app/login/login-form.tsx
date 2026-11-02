"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { loginAction } from "./actions";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, UserCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { playPosSound } from "@/lib/sound";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<"admin" | "tech" | null>(null);

  function fillRole(role: "admin" | "tech") {
    playPosSound("tab");
    if (role === "admin") {
      setEmail("admin@techshop.com");
      setPassword("admin123");
      setActiveRole("admin");
      toast.info("Đã chọn: Tài khoản Quản trị viên (Admin)");
    } else {
      setEmail("tuan.ktv@techshop.com");
      setPassword("admin123");
      setActiveRole("tech");
      toast.info("Đã chọn: Tài khoản Kỹ thuật viên (Tuấn KTV)");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await loginAction(email, password);
      if (res.ok) {
        playPosSound("success");
        toast.success("Đăng nhập thành công!");
        const from = searchParams.get("from") || "/pos";
        router.push(from);
        router.refresh();
      } else {
        playPosSound("warn");
        toast.error(res.error || "Email hoặc mật khẩu không chính xác");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* ── 1-Click Fast Fill Role Selector ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="text-amber-500">✨</span>
            <span>Tài khoản kiểm thử nhanh</span>
          </span>
          <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
            1 click
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card Admin */}
          <button
            type="button"
            onClick={() => fillRole("admin")}
            className={cn(
              "group p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all hover:shadow-md active:scale-98",
              activeRole === "admin"
                ? "border-2 border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm"
                : "border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-blue-400"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                activeRole === "admin"
                  ? "bg-blue-600 text-white shadow-blue-600/30"
                  : "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
              )}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">Admin</p>
              <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 truncate">Quản trị & POS</p>
            </div>
          </button>

          {/* Card Tech */}
          <button
            type="button"
            onClick={() => fillRole("tech")}
            className={cn(
              "group p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all hover:shadow-md active:scale-98",
              activeRole === "tech"
                ? "border-2 border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 shadow-sm"
                : "border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-amber-400"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                activeRole === "tech"
                  ? "bg-amber-500 text-white shadow-amber-500/30"
                  : "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
              )}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">Kỹ thuật</p>
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">Tuấn KTV</p>
            </div>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200/80 dark:border-slate-800" />
        <span className="flex-shrink mx-3 text-[10px] font-extrabold tracking-widest uppercase text-slate-400 dark:text-slate-500">
          HOẶC ĐĂNG NHẬP THỦ CÔNG
        </span>
        <div className="flex-grow border-t border-slate-200/80 dark:border-slate-800" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Email tài khoản
          </label>
          <div className="input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
            <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setActiveRole(null);
              }}
              required
              autoComplete="email"
              placeholder="admin@techshop.com"
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Mật khẩu
            </label>
            <span className="text-[10px] font-mono text-slate-400">Mặc định: admin123</span>
          </div>
          <div className="input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
            <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setActiveRole(null);
              }}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-transparent text-xs sm:text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Vào Ca Làm Việc Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
