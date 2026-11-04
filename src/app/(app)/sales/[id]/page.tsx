import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatVND, formatDateTime, formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { renderTemplate } from "@/lib/template-engine";
import { sanitizeTemplateHtml } from "@/lib/sanitize-html";
import { SALE_LAYOUT } from "@/lib/default-templates";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { PrintPageStyle } from "@/components/print-page-style";
import { PrintSizeSwitcher } from "@/components/print-size-switcher";
import {
  ArrowLeft,
  Printer,
  Receipt,
  User,
  ExternalLink,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  cash: {
    label: "Tiền mặt",
    icon: Banknote,
    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200",
  },
  transfer: {
    label: "Chuyển khoản VietQR",
    icon: QrCode,
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200",
  },
  card: {
    label: "Thẻ ngân hàng",
    icon: CreditCard,
    color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200",
  },
};

export default async function SaleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSession();
  if (!user) notFound();
  const settings = await getSettings();
  const size = sp.size || settings.printSize || "80mm";

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: true,
      items: { include: { product: true } },
    },
  });
  if (!sale) notFound();

  const template = await prisma.printTemplate.findUnique({
    where: {
      slug: "sale-receipt",
    },
  });

  const payInfo = PAYMENT_LABELS[sale.paymentMethod || ""] || {
    label: sale.paymentMethod || "Khác",
    icon: Receipt,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
  };
  const PayIcon = payInfo.icon;
  const due = Math.max(0, sale.total - sale.paid);

  const templateData = {
    ten_cua_hang: settings.shopName,
    shop_tagline: settings.shopTagline,
    dia_chi_cua_hang: settings.shopAddress || "",
    sdt_cua_hang: settings.shopPhone || "",
    ma_phieu: sale.code,
    ngay_tao: sale.createdAt,
    timezone: settings.timezone,
    ten_khach: sale.customer?.name,
    sdt_khach: sale.customer?.phone,
    dia_chi_khach: sale.customer?.address,
    tam_tinh: sale.subtotal,
    chiet_khau: sale.discount,
    tong_cong: sale.total,
    tong_chi_phi: sale.total,
    da_thanh_toan: sale.paid,
    thuc_thu: sale.paid,
    con_no: due,
    ten_nhan_vien: sale.user?.name || "Nhân viên",
    ghi_chu: sale.note || "",
    bank_id: settings.bankId,
    bank_account: settings.bankAccount,
    payment_method: payInfo.label,
    items: sale.items.map((item) => ({
      ten: item.product.name,
      sl: item.quantity,
      gia: item.unitPrice,
      thanh_tien: item.subtotal,
      imei: item.imei || undefined,
    })),
  };

  const itemsTableHtml = `
<div style="margin: 15px 0;">
  <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
    <thead>
      <tr style="border-bottom: 2px solid #000; text-align: left; font-size: 11px; text-transform: uppercase;">
        <th style="padding: 8px 0; width: 60%; color: #000;">Sản phẩm</th>
        <th style="padding: 8px 0; width: 10%; text-align: center; color: #000;">SL</th>
        <th style="padding: 8px 0; width: 30%; text-align: right; color: #000;">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${sale.items
        .map(
          (item) => `
        <tr style="border-bottom: 1px dashed #ccc;">
          <td style="padding: 8px 0;">
            <div style="font-weight: bold; font-size: 13px; color: #000;">${item.product.name}</div>
            ${item.product.warranty > 0 ? `<div style="font-size: 10px; color: #666; margin-top: 2px;">BH: ${item.product.warranty} tháng</div>` : ""}
            ${item.imei ? `<div style="font-size: 10px; color: #888; margin-top: 1px; font-family: monospace;">IMEI: ${item.imei}</div>` : ""}
          </td>
          <td style="padding: 8px 0; text-align: center; font-size: 13px;">${item.quantity}</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 13px;">${formatVND(item.subtotal)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
</div>
  `.trim();

  const templateContent = template?.content || SALE_LAYOUT;
  const renderedContent = sanitizeTemplateHtml(
    renderTemplate(templateContent, templateData, itemsTableHtml)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PrintPageStyle size={size} />

      {/* Screen-only Top Navigation and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold",
            })}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            Danh sách hoá đơn
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span>Bán lẻ</span>
            <span className="opacity-50">/</span>
            <span className="font-mono font-bold text-foreground">{sale.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <PrintSizeSwitcher current={size} />
          <PrintButton label="In hoá đơn" />
          <Link
            href="/pos"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20",
            })}
          >
            + Bán hàng mới
          </Link>
        </div>
      </div>

      {/* Screen-only Hero Banner */}
      <div className="print:hidden relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-mono font-black text-sm tracking-wide border border-blue-200/60 dark:border-blue-800/60">
                #{sale.code}
              </span>
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border", payInfo.color)}>
                <PayIcon className="size-3.5" />
                {payInfo.label}
              </span>
              <Badge variant="outline" className={cn(
                "rounded-xl text-xs font-bold",
                due <= 0 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
              )}>
                {due <= 0 ? "Đã thanh toán đủ" : `Còn nợ: ${formatVND(due)}`}
              </Badge>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">
              Hoá đơn bán lẻ #{sale.code}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Thời gian: <strong className="text-foreground">{formatDateTime(sale.createdAt)}</strong></span>
              <span>•</span>
              <span>Thu ngân: <strong className="text-foreground">{sale.user.name}</strong></span>
              {sale.customer && (
                <>
                  <span>•</span>
                  <span>Khách: <strong className="text-blue-600 dark:text-blue-400">{sale.customer.name}</strong></span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Tổng hoá đơn
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                {formatVND(sale.total)}
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Thực thu
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {formatVND(sale.paid)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Detailed Intel & Right Thermal Receipt Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Invoice Breakdown (Screen-only) */}
        <div className="print:hidden lg:col-span-7 space-y-6">
          {/* Customer Information Card */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <User className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Thông tin người mua</h3>
              </div>
              {sale.customer && (
                <Link
                  href={`/customers/${sale.customer.id}`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Hồ sơ CRM
                  <ExternalLink className="size-3" />
                </Link>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Họ và tên</span>
                <span className="font-bold text-foreground">{sale.customer?.name || "Khách lẻ vãng lai"}</span>
              </div>
              {sale.customer?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Số điện thoại</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{sale.customer.phone}</span>
                </div>
              )}
              {sale.customer?.address && (
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-muted-foreground text-xs shrink-0">Địa chỉ</span>
                  <span className="text-xs text-right text-foreground">{sale.customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Purchased Items Table */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Package className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Chi tiết mặt hàng ({sale.items.length})</h3>
                  <p className="text-xs text-muted-foreground">Danh mục thiết bị và phụ kiện đã mua</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-5 py-3 text-left">Sản phẩm</th>
                    <th className="px-4 py-3 text-center">SL</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-5 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sale.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-sm text-foreground">{it.product.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {it.product.sku && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                              {it.product.sku}
                            </span>
                          )}
                          {it.product.warranty > 0 && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                              <ShieldCheck className="size-3" />
                              BH {it.product.warranty}T
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-foreground">
                        {it.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-muted-foreground">
                        {formatVND(it.unitPrice)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-foreground text-sm">
                        {formatVND(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals in Table Footer */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính:</span>
                <span className="font-semibold text-foreground">{formatVND(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Chiết khấu / Giảm giá:</span>
                  <span>-{formatVND(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold">
                <span className="text-foreground">Tổng hoá đơn:</span>
                <span className="text-blue-600 dark:text-blue-400 font-black text-base">{formatVND(sale.total)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-muted-foreground">Đã thanh toán:</span>
                <span className="font-bold text-foreground">{formatVND(sale.paid)}</span>
              </div>
              {due > 0 && (
                <div className="flex justify-between text-xs font-bold text-rose-600 dark:text-rose-400 pt-1">
                  <span>Còn nợ cần thanh toán:</span>
                  <span>{formatVND(due)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side / Print View: High Fidelity Thermal K80 / A4 Bill */}
        <div
          className={cn(
            "w-full transition-all",
            "lg:col-span-5",
            "print:col-span-12 print:max-w-none print:w-full print:m-0 print:p-0"
          )}
        >
          <div className="sticky top-6">
            <div className="print:hidden text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Printer className="size-3.5 text-blue-500" />
                Bản xem trước mẫu in ({size === "80mm" ? "Khổ K80 nhiệt" : "Khổ A4/A5"})
              </div>
              <span className="text-[11px] font-normal lowercase opacity-75">chuẩn in nhiệt</span>
            </div>

            {/* Thermal Slip Simulation Container */}
            <div
              className={cn(
                "print-receipt mx-auto transition-all bg-white text-black shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden",
                size === "80mm" ? "max-w-[340px]" : "max-w-full",
                "print:max-w-none print:w-full print:shadow-none print:border-none print:rounded-none"
              )}
            >
              <div className="p-6 sm:p-8">
                <div
                  className="prose prose-sm max-w-none text-black font-sans leading-snug"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
