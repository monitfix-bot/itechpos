"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "In phiếu" }: { label?: string }) {
  const params = useSearchParams();
  const auto = params.get("print") === "1";
  const fired = useRef(false);

  useEffect(() => {
    if (!auto || fired.current) return;
    fired.current = true;

    const t = setTimeout(() => {
      window.onafterprint = () => {
        setTimeout(() => window.close(), 500);
      };
      window.print();
    }, 800);

    return () => clearTimeout(t);
  }, [auto]);

  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 px-4 h-8 text-xs flex items-center gap-1.5 transition-all active:scale-95"
    >
      <Printer className="size-3.5" />
      <span>{label}</span>
      <kbd className="hidden sm:inline-block ml-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-700/60 text-blue-100 font-mono font-medium">
        Ctrl+P
      </kbd>
    </Button>
  );
}
