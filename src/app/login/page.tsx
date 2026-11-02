import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Laptop, ShieldCheck, Moon } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LoginPage() {
  const user = await getSession();

  // If already logged in, go straight to POS
  if (user) {
    redirect("/pos");
  }

  const settings = await getSettings();
  const shopName = settings.shopName || "TechShop";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-mesh-light text-slate-900 dark:text-slate-100 p-4 sm:p-8 relative overflow-x-hidden selection:bg-blue-600/20 selection:text-blue-600">
      {/* Subtle Ambient Glowing Orbs */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-[380px] h-[380px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="max-w-[1440px] w-full mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Laptop className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              {shopName}
            </span>
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 hidden sm:inline">
              WORKSTATION V2.5
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
              Offline Local • Sẵn sàng
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="my-auto py-8 flex items-center justify-center relative z-10">
        <div className="w-full max-w-[460px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[32px] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_24px_60px_-15px_rgba(37,99,235,0.12)] p-6 sm:p-9 space-y-6 animate-cart-pop">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/60 dark:from-blue-950/80 dark:to-indigo-950/50 border border-blue-200/70 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
              <Laptop className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-1">
              Đăng nhập hệ thống
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[340px] mx-auto">
              Nhập thông tin tài khoản hoặc bấm chọn nhanh vai trò kiểm thử để bắt đầu ca làm việc.
            </p>
          </div>

          {/* Form */}
          <Suspense fallback={<div className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />}>
            <LoginForm />
          </Suspense>

          {/* Security footnote */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Dữ liệu lưu trữ cục bộ SQLite an toàn tuyệt đối</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
        © {new Date().getFullYear()} {shopName} · Hệ thống quản lý chuyên biệt bán lẻ & sửa chữa Workstation V2.5
      </footer>
    </div>
  );
}
