import { buttonVariants } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TemplateEditor } from "./template-editor";
import { RestoreDefaultButton } from "./restore-button";
import Link from "next/link";

export default async function TemplatesPage() {
  const templates = await prisma.printTemplate.findMany({
    orderBy: { slug: "asc" },
  });

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header section matched with Settings & Workstation V2.5 style */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-blue-500/10 via-background to-background p-6 sm:p-8 rounded-[2rem] border border-border/60 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold",
              })}
            >
              <ArrowLeft className="size-3.5 mr-1.5" />
              Cài đặt hệ thống
            </Link>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              {templates.length} mẫu in
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <Printer className="size-6" />
            </div>
            Tuỳ biến mẫu in & hoá đơn
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-2xl">
            Tự do soạn thảo văn bản, căn chỉnh khổ in K80/A4/A5 và chèn các biến dữ liệu động (IMEI, VietQR, bảo hành, tiền cọc...).
          </p>
        </div>

        <RestoreDefaultButton />
      </div>

      <TemplateEditor templates={templates} />
    </div>
  );
}
