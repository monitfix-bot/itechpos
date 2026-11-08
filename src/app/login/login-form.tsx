"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { loginAction } from "./actions";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { playPosSound } from "@/lib/sound";
import { isAppSubdomain } from "@/lib/domain";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await loginAction(email, password);
      if (res.ok) {
        playPosSound("success");
        toast.success("Đăng nhập thành công!");
        const isApp = typeof window !== "undefined" && isAppSubdomain(window.location.host);
        const defaultFrom = isApp ? "/" : "/pos";
        const from = searchParams.get("from") || defaultFrom;
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
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="nhanvien@techshop.com"
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mật khẩu
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Bảo mật chuẩn</span>
          </div>
          <div className="input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
            <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={pending}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập ca làm việc</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
