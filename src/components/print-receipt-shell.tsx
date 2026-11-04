import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Printer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { PrintPageStyle } from "@/components/print-page-style";
import { PrintSizeSwitcher } from "@/components/print-size-switcher";
import { cn } from "@/lib/utils";
import type { AppSettings } from "@/lib/settings";

export function PrintReceiptShell({
  backHref,
  backLabel = "Quay lại",
  printLabel = "In phiếu",
  size = "A4",
  settings,
  children,
}: {
  backHref: string;
  backLabel?: string;
  printLabel?: string;
  size?: string;
  settings: AppSettings;
  children: React.ReactNode;
}) {
  void settings;
  const is80mm = size === "80mm";

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-100/70 dark:bg-slate-950/70 py-6 px-3 sm:px-6 print:p-0 print:m-0 print:bg-white print:min-h-0">
      <PrintPageStyle size={size} />

      {/* Screen-only Modern Floating Header */}
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-6 p-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold gap-1.5"
            )}
          >
            <ArrowLeft className="size-3.5" />
            <span>{backLabel}</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium pl-3 border-l border-slate-200 dark:border-slate-800">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bản xem trước mẫu in</span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-foreground">
              {is80mm ? "K80 (80mm)" : "A4 tiêu chuẩn"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <PrintSizeSwitcher current={size} />
          <PrintButton label={printLabel} />
        </div>
      </div>

      {/* Desk Canvas & Paper Receipt */}
      <div
        className={cn(
          "mx-auto transition-all duration-200",
          is80mm
            ? "max-w-[360px] print:max-w-none print:w-full print:mx-0"
            : "max-w-3xl sm:max-w-4xl print:max-w-none print:w-full print:mx-0"
        )}
      >
        {/* Physical Paper Simulation Container - ALWAYS WHITE IN BOTH LIGHT & DARK MODE */}
        <div
          className={cn(
            "print-receipt mx-auto transition-all bg-white text-slate-900 shadow-2xl shadow-slate-950/15 dark:shadow-black/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden",
            is80mm
              ? "max-w-[360px] border-b-4 border-dashed border-slate-300"
              : "w-full",
            "print:max-w-none print:w-full print:shadow-none print:border-none print:rounded-none print:bg-white print:text-black print:m-0 print:p-0"
          )}
        >
          {/* Thermal Feeder Line hint (only visible on screen in 80mm mode) */}
          {is80mm && (
            <div className="print:hidden h-1.5 w-full bg-slate-100 border-b border-slate-200/80" />
          )}

          {/* Paper Content Wrapper */}
          <div className="bg-white text-black font-sans leading-normal selection:bg-blue-100 selection:text-blue-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReceiptHeader({
  title,
  code,
  subtitle,
  settings,
}: {
  title: string;
  code: string;
  subtitle?: string;
  settings: AppSettings;
}) {
  return (
    <div className="receipt-padding border-b border-slate-200 p-5 bg-white text-black">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.shopName}
              width={48}
              height={48}
              className="object-contain max-h-12 print-hide-on-thermal"
              unoptimized
            />
          ) : null}
          <div className="min-w-0">
            <div className="font-bold text-base leading-tight truncate text-slate-950">
              {settings.shopName}
            </div>
            {settings.shopAddress && (
              <div className="text-[11px] text-slate-600 leading-tight">
                {settings.shopAddress}
              </div>
            )}
            {settings.shopPhone && (
              <div className="text-[11px] text-slate-600 leading-tight">
                ĐT: {settings.shopPhone}
                {settings.shopEmail ? ` · ${settings.shopEmail}` : ""}
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-bold uppercase tracking-wide leading-tight text-slate-950">
            {title}
          </div>
          <div className="font-mono text-xs mt-0.5 text-slate-800">#{code}</div>
          {subtitle && (
            <div className="text-[11px] text-slate-600 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReceiptSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
        {title}
      </h3>
      {children}
    </div>
  );
}
