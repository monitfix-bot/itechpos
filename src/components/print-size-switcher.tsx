"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FileText, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrintSizeSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  function setSize(s: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("size", s);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const isA4 = current !== "80mm";

  return (
    <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-1 shadow-xs">
      <button
        type="button"
        onClick={() => setSize("A4")}
        className={cn(
          "px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
          isA4
            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <FileText className="size-3.5" />
        <span>Khổ A4</span>
      </button>
      <button
        type="button"
        onClick={() => setSize("80mm")}
        className={cn(
          "px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
          !isA4
            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Receipt className="size-3.5" />
        <span>K80 (80mm)</span>
      </button>
    </div>
  );
}
