import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Store, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BranchManager } from "./branch-manager";

export default async function BranchesPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const branches = await prisma.branch.findMany({
    include: { _count: { select: { users: true, sales: true } } },
    orderBy: { isMain: "desc" },
  });

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Store className="size-8 text-blue-500" />
            Cửa hàng & Chi nhánh
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            Quản lý địa điểm kinh doanh, kho hàng và cấu hình tọa độ GPS chấm công cho từng chi nhánh.
          </p>
        </div>
      </div>

      <BranchManager branches={JSON.parse(JSON.stringify(branches))} />
    </div>
  );
}
