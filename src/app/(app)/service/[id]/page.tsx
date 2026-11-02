import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import { formatVND, formatDateTime, formatDate } from "@/lib/format";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  Laptop,
  Tablet,
  User,
  Wrench,
  Printer,
  PackageCheck,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Phone,
  Receipt,
  Sparkles,
  ExternalLink,
  Cpu,
  Layers,
  Check,
} from "lucide-react";
import { ServiceStatusActions } from "./service-status-actions";
import { ServiceUpdateForm } from "./service-update-form";
import { ReturnDialog } from "./return-dialog";
import { cn } from "@/lib/utils";

const DEVICE_LABELS: Record<string, string> = {
  phone: "Điện thoại",
  laptop: "Laptop",
  tablet: "Máy tính bảng",
  other: "Khác",
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  phone: <Smartphone className="size-5" />,
  laptop: <Laptop className="size-5" />,
  tablet: <Tablet className="size-5" />,
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản VietQR",
  card: "Thẻ ngân hàng",
};

const PIPELINE_STEPS = [
  { id: "received", label: "Tiếp nhận" },
  { id: "diagnosing", label: "Chẩn đoán" },
  { id: "waiting_parts", label: "Linh kiện" },
  { id: "repairing", label: "Đang sửa" },
  { id: "completed", label: "Sửa xong" },
  { id: "delivered", label: "Bàn giao" },
];

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, technicians, products] = await Promise.all([
    prisma.serviceTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: true,
        assignedTo: true,
        items: { include: { product: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({
      where: { active: true, role: { in: ["technician", "admin"] } },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ticket) notFound();

  const itemsTotal = ticket.items.reduce((s, i) => s + i.subtotal, 0);
  const due =
    (ticket.status === "delivered" ? ticket.finalCost : itemsTotal || ticket.estimatedCost) -
    ticket.paid -
    ticket.deposit;
  const isDelivered = ticket.status === "delivered";
  const isCancelled = ticket.status === "cancelled";

  // Compute active step in pipeline
  const currentStepIdx = PIPELINE_STEPS.findIndex((s) => s.id === ticket.status);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/service"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold",
            })}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            Danh sách phiếu
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span>Sửa chữa</span>
            <ChevronRight className="size-3.5 opacity-50" />
            <span className="font-mono font-bold text-foreground">{ticket.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/service/${id}/intake`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-xl border-slate-200 dark:border-slate-800 shadow-sm font-semibold hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
            })}
          >
            <Printer className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
            In phiếu nhận máy
          </Link>
          {isDelivered && (
            <Link
              href={`/service/${id}/return`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "rounded-xl border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm hover:bg-emerald-100/50",
              })}
            >
              <Printer className="size-4 mr-1.5" />
              In phiếu trả & Bảo hành
            </Link>
          )}
        </div>
      </div>

      {/* Hero Workstation Status Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-mono font-black text-sm tracking-wide border border-blue-200/60 dark:border-blue-800/60">
                #{ticket.code}
              </span>
              <ServiceStatusBadge status={ticket.status} className="px-3 py-1 text-xs font-bold" />
              {ticket.warranty > 0 && (
                <Badge variant="outline" className="rounded-xl border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold gap-1">
                  <ShieldCheck className="size-3.5 text-amber-600 dark:text-amber-400" />
                  Bảo hành {ticket.warranty} tháng
                </Badge>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <span>{[ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || ticket.deviceType}</span>
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Tiếp nhận: <strong className="text-foreground">{formatDateTime(ticket.receivedAt)}</strong></span>
              <span>•</span>
              <span>Nhân viên: <strong className="text-foreground">{ticket.createdBy.name}</strong></span>
              {ticket.assignedTo && (
                <>
                  <span>•</span>
                  <span>KTV: <strong className="text-blue-600 dark:text-blue-400">{ticket.assignedTo.name}</strong></span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-right">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {isDelivered ? "Tổng chi phí cuối" : "Báo giá ước tính"}
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                {formatVND(isDelivered ? ticket.finalCost : (ticket.estimatedCost || itemsTotal))}
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {due <= 0 ? "Thanh toán" : "Còn nợ"}
              </div>
              <div className={cn(
                "text-xl font-black tracking-tight",
                due <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {due <= 0 ? "Đã thu đủ" : formatVND(due)}
              </div>
            </div>
          </div>
        </div>

        {/* 6-Step Visual Timeline Pipeline */}
        {!isCancelled ? (
          <div className="pt-6">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
              <Layers className="size-3.5 text-blue-500" />
              Tiến trình xử lý thiết bị
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PIPELINE_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all text-xs",
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 font-bold ring-2 ring-blue-500/30"
                        : isPassed
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 font-semibold"
                        : "bg-slate-50 dark:bg-slate-800/40 text-muted-foreground border-slate-200/60 dark:border-slate-800"
                    )}
                  >
                    <div
                      className={cn(
                        "size-6 rounded-xl flex items-center justify-center shrink-0 font-mono text-[11px] font-bold",
                        isCurrent
                          ? "bg-white text-blue-600"
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {isPassed ? <Check className="size-3.5 stroke-[3]" /> : idx + 1}
                    </div>
                    <span className="truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            Phiếu sửa chữa này đã bị huỷ bỏ. Thiết bị đã được hoàn trả lại cho khách hàng hoặc lưu kho.
          </div>
        )}
      </div>

      {/* Main Grid: Left Detailed Intel & Right Operational Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Specs, Device, Fault, Parts, Diagnosis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Device Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    <User className="size-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Khách hàng</h3>
                </div>
                <Link
                  href={`/customers/${ticket.customer.id}`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Hồ sơ CRM
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Họ và tên</span>
                  <span className="font-bold text-foreground">{ticket.customer.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Số điện thoại</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{ticket.customer.phone}</span>
                </div>
                {ticket.customer.code && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Mã khách</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">{ticket.customer.code}</span>
                  </div>
                )}
                {ticket.customer.address && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-muted-foreground text-xs shrink-0">Địa chỉ</span>
                    <span className="text-xs text-right text-foreground line-clamp-2">{ticket.customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Device Box */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    {DEVICE_ICONS[ticket.deviceType] || <Laptop className="size-4" />}
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Thông tin thiết bị</h3>
                </div>
                <Badge variant="outline" className="text-[11px] rounded-lg font-semibold capitalize">
                  {DEVICE_LABELS[ticket.deviceType] || ticket.deviceType}
                </Badge>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Model máy</span>
                  <span className="font-bold text-foreground">
                    {[ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Số IMEI / Serial</span>
                  <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-foreground">
                    {ticket.imei || "Không có IMEI"}
                  </span>
                </div>
                {ticket.accessories && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-muted-foreground text-xs shrink-0">Phụ kiện đi kèm</span>
                    <span className="text-xs text-right text-foreground">{ticket.accessories}</span>
                  </div>
                )}
                {ticket.appearance && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground text-xs shrink-0">Ngoại quan máy</span>
                    <span className="text-xs text-right text-foreground">{ticket.appearance}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Issue & Diagnosis Section */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-4" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Tình trạng lỗi & Báo cáo kỹ thuật</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Yêu cầu sửa chữa & Lỗi khách báo
                </div>
                <p className="text-sm font-semibold text-foreground whitespace-pre-wrap leading-relaxed">
                  {ticket.problem}
                </p>
              </div>

              {ticket.diagnosis && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1">
                    Kết quả chẩn đoán kỹ thuật
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {ticket.diagnosis}
                  </p>
                </div>
              )}

              {ticket.solution && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-1">
                    Giải pháp kỹ thuật đã xử lý
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {ticket.solution}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parts & Services Replacement Table */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Cpu className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Linh kiện & Dịch vụ ({ticket.items.length})</h3>
                  <p className="text-xs text-muted-foreground">Các hạng mục công việc và phụ tùng sử dụng</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Tạm tính linh kiện: </span>
                <span className="font-black text-sm text-foreground">{formatVND(itemsTotal)}</span>
              </div>
            </div>

            {ticket.items.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Chưa có linh kiện hoặc dịch vụ nào được ghi nhận cho phiếu này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-5 py-3 text-left">Hạng mục / Dịch vụ</th>
                      <th className="px-4 py-3 text-center">Số lượng</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-5 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ticket.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-sm text-foreground">{it.description}</div>
                          {it.product?.sku && (
                            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                              SKU: {it.product.sku}
                            </div>
                          )}
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
                  <tfoot className="bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 font-bold">
                    <tr>
                      <td colSpan={3} className="px-5 py-3 text-right text-muted-foreground">
                        Tổng cộng dịch vụ & vật tư:
                      </td>
                      <td className="px-5 py-3 text-right text-blue-600 dark:text-blue-400 text-sm">
                        {formatVND(itemsTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Update Diagnosis & Pricing Form for Techs */}
          {!isDelivered && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Wrench className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Cập nhật chẩn đoán & Báo giá</h3>
                  <p className="text-xs text-muted-foreground">Dành cho kỹ thuật viên cập nhật tiến độ và chi phí sửa chữa</p>
                </div>
              </div>

              <ServiceUpdateForm
                ticket={{
                  id: ticket.id,
                  diagnosis: ticket.diagnosis,
                  solution: ticket.solution,
                  estimatedCost: ticket.estimatedCost,
                  finalCost: ticket.finalCost,
                  paid: ticket.paid,
                  warranty: ticket.warranty,
                  assignedToId: ticket.assignedToId,
                  promisedAt: ticket.promisedAt
                    ? ticket.promisedAt.toISOString().slice(0, 16)
                    : null,
                  note: ticket.note,
                }}
                technicians={technicians.map((t) => ({
                  id: t.id,
                  name: t.name,
                }))}
              />
            </div>
          )}
        </div>

        {/* Right 1 Column: Return Dialog, Payment & History */}
        <div className="space-y-6">
          {/* Handover & Delivery Action Widget */}
          {!isDelivered && (
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-white/80 to-blue-500/5 dark:from-blue-950/40 dark:via-slate-900/90 dark:to-slate-900/95 p-6 shadow-sm backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                  <PackageCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Hoàn tất & Trả máy</h3>
                  <p className="text-xs text-muted-foreground">Tất toán chi phí, xuất bảo hành và bàn giao cho khách</p>
                </div>
              </div>

              <Suspense fallback={null}>
                <ReturnDialog
                  ticketId={ticket.id}
                  ticketCode={ticket.code}
                  existingItems={ticket.items.map((it) => ({
                    id: it.id,
                    description: it.description,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    subtotal: it.subtotal,
                  }))}
                  deposit={ticket.deposit}
                  initialFinalCost={ticket.finalCost || itemsTotal || ticket.estimatedCost}
                  initialPaid={ticket.paid}
                  products={products
                    .filter((p) => p.category.type !== "service")
                    .map((p) => ({
                      id: p.id,
                      sku: p.sku,
                      name: p.name,
                      price: p.price,
                      stock: p.stock,
                      categoryType: p.category.type,
                    }))}
                />
              </Suspense>
            </div>
          )}

          {/* Payment & Financial Breakdown Card */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Receipt className="size-4" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Chi tiết thanh toán</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Báo giá ước tính</span>
                <span className="font-semibold text-foreground">
                  {formatVND(ticket.estimatedCost || itemsTotal)}
                </span>
              </div>

              {ticket.deposit > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="size-3.5" />
                    Đã đặt cọc trước
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    -{formatVND(ticket.deposit)}
                  </span>
                </div>
              )}

              {isDelivered && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Tổng chi phí cuối
                  </span>
                  <span className="font-black text-base text-foreground">
                    {formatVND(ticket.finalCost)}
                  </span>
                </div>
              )}

              {ticket.paid > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Đã thanh toán</span>
                  <span className="font-semibold text-foreground">
                    {formatVND(ticket.paid)}
                  </span>
                </div>
              )}

              {ticket.paymentMethod && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Phương thức</span>
                  <span className="font-semibold text-foreground">
                    {PAYMENT_LABELS[ticket.paymentMethod] || ticket.paymentMethod}
                  </span>
                </div>
              )}

              <Separator className="my-2" />

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                  {due > 0 ? "Còn nợ cần thu" : "Trạng thái công nợ"}
                </span>
                <span
                  className={cn(
                    "font-black text-lg",
                    due > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {due > 0 ? formatVND(due) : "Đã thanh toán đủ"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Status Transition Action */}
          {!isDelivered && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                  <Clock className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Chuyển trạng thái phiếu</h3>
              </div>

              <ServiceStatusActions
                ticketId={ticket.id}
                currentStatus={ticket.status}
              />
            </div>
          )}

          {/* Schedule & Staff Info Card */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Calendar className="size-4" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Lịch hẹn & Nhân sự</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Tiếp nhận lúc:</span>
                <span className="font-semibold text-foreground">{formatDateTime(ticket.receivedAt)}</span>
              </div>
              {ticket.promisedAt && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Hẹn trả máy:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{formatDateTime(ticket.promisedAt)}</span>
                </div>
              )}
              {ticket.completedAt && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Hoàn thành:</span>
                  <span className="font-semibold text-emerald-600">{formatDateTime(ticket.completedAt)}</span>
                </div>
              )}
              {ticket.deliveredAt && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Đã trả khách:</span>
                  <span className="font-semibold text-foreground">{formatDateTime(ticket.deliveredAt)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Người tiếp nhận:</span>
                <span className="font-semibold text-foreground">{ticket.createdBy.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">KTV xử lý:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {ticket.assignedTo?.name || "Chưa phân công"}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Activity Log */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Layers className="size-4" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Lịch sử cập nhật</h3>
            </div>

            <div className="space-y-4">
              {ticket.history.map((h, i) => (
                <div key={h.id} className="flex gap-3 text-xs relative">
                  {i < ticket.history.length - 1 && (
                    <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                  )}
                  <div className="size-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 z-10 font-bold text-[10px]">
                    •
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ServiceStatusBadge status={h.status} className="text-[10px] py-0" />
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatDateTime(h.createdAt)}
                      </span>
                    </div>
                    {h.note && (
                      <p className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        {h.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
