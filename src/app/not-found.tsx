import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
        <div className="size-14 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto">
          <FileQuestion className="size-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Không tìm thấy trang</h2>
          <p className="text-sm text-slate-400 mt-1">
            Dữ liệu hoặc đường dẫn này không tồn tại trên hệ thống.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/pos" className={buttonVariants({ className: "gap-2" })}>
            <Home className="size-4" />
            Về trang bán hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
