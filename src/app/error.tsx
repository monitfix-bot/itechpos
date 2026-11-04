"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
        <div className="size-14 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="size-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Đã xảy ra sự cố khi tải trang</h2>
          <p className="text-sm text-slate-400 mt-1">
            {error?.message || "Không thể tải trang này. Vui lòng kiểm tra lại kết nối hoặc thử lại."}
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => reset()} className="gap-2">
            <RefreshCcw className="size-4" />
            Thử lại
          </Button>
          <Link href="/pos" className={buttonVariants({ className: "gap-2" })}>
            <Home className="size-4" />
            Về trang bán hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
