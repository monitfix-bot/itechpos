import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatVND } from "@/lib/format";
import { formatPaymentMethodDisplay } from "@/lib/payment-utils";
import {
  PrintReceiptShell,
} from "@/components/print-receipt-shell";
import { getSettings } from "@/lib/settings";
import { renderTemplate } from "@/lib/template-engine";
import { sanitizeTemplateHtml } from "@/lib/sanitize-html";
import { INTAKE_LAYOUT } from "@/lib/default-templates";

const DEVICE_LABELS: Record<string, string> = {
  phone: "Điện thoại",
  laptop: "Laptop",
  tablet: "Máy tính bảng",
  other: "Khác",
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
};

export default async function ServiceIntakePrintPage({
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
  const size = sp.size || settings.printSize || "A4";
  const ticket = await prisma.serviceTicket.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: true,
      assignedTo: true,
      items: {
        include: { product: true }
      },
    },
  });
  if (!ticket) notFound();

  const template = await prisma.printTemplate.findUnique({
    where: {
      slug: "service-intake",
    },
  });

  const staffName = ticket.assignedTo?.name || ticket.createdBy?.name || "Kỹ thuật viên";

  const templateData = {
    ten_cua_hang: settings.shopName,
    shop_tagline: settings.shopTagline,
    dia_chi_cua_hang: settings.shopAddress || "",
    sdt_cua_hang: settings.shopPhone || "",
    ma_phieu: ticket.code,
    ngay_tao: ticket.receivedAt,
    timezone: settings.timezone,
    ten_khach: ticket.customer?.name || "Khách lẻ",
    sdt_khach: ticket.customer?.phone || "",
    dia_chi_khach: ticket.customer?.address || "",
    loai_may: DEVICE_LABELS[ticket.deviceType] || ticket.deviceType,
    ten_may: [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" "),
    hang: ticket.deviceBrand || "",
    model: ticket.deviceModel || "",
    imei: ticket.imei,
    imei_serial: ticket.imei,
    phu_kien: ticket.accessories,
    accessories: ticket.accessories,
    tinh_trang: ticket.appearance,
    tinh_trang_may: ticket.appearance,
    loi_yeu_cau: ticket.problem,
    yeu_cau_khach: ticket.problem,
    hen_tra: ticket.promisedAt,
    ngay_hen_tra: ticket.promisedAt,
    tam_tinh: ticket.estimatedCost,
    du_kien_chi_phi: ticket.estimatedCost,
    da_thanh_toan: ticket.deposit,
    da_dat_coc: ticket.deposit,
    tien_dat_coc: ticket.deposit,
    ten_nhan_vien: staffName,
    ktv_phu_trach: staffName,
    ghi_chu: ticket.note || "",
    bank_id: settings.bankId,
    bank_account: settings.bankAccount,
    payment_method: formatPaymentMethodDisplay(ticket.paymentMethod, ticket.note),
    items: ticket.items.map(it => ({
      ten: it.description,
      sl: it.quantity,
      gia: it.unitPrice,
      thanh_tien: it.subtotal,
    }))
  };

  const itemsTableHtml = `
<div style="margin: 15px 0;">
  <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
    <thead>
      <tr style="border-bottom: 2px solid #000; text-align: left; font-size: 11px; text-transform: uppercase;">
        <th style="padding: 8px 0; width: 60%; color: #000;">Nội dung</th>
        <th style="padding: 8px 0; width: 10%; text-align: center; color: #000;">SL</th>
        <th style="padding: 8px 0; width: 30%; text-align: right; color: #000;">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${ticket.items.map(it => `
        <tr style="border-bottom: 1px dashed #ccc;">
          <td style="padding: 10px 0;">
            <div style="font-weight: bold; font-size: 13px; color: #000;">${it.description}</div>
            ${it.product?.warranty ? `<div style="font-size: 10px; color: #666; margin-top: 2px;">BH: ${it.product.warranty}T</div>` : ''}
          </td>
          <td style="padding: 10px 0; text-align: center; font-size: 13px;">${it.quantity}</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 13px;">${formatVND(it.subtotal)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
  `.trim();

  const templateContent = template?.content || INTAKE_LAYOUT;

  const renderedContent = sanitizeTemplateHtml(
    renderTemplate(templateContent, templateData, itemsTableHtml),
  );

  return (
    <Suspense fallback={null}>
      <PrintReceiptShell
        backHref={`/service/${id}`}
        backLabel="Quay lại phiếu"
        printLabel="In phiếu nhận"
        size={size}
        settings={settings}
      >
        <div className={size === "80mm" ? "p-4 sm:p-5" : "p-6 sm:p-10"}>
          <div 
            className="prose prose-sm max-w-none text-black"
            dangerouslySetInnerHTML={{ __html: renderedContent }} 
          />
        </div>
      </PrintReceiptShell>
    </Suspense>
  );
}
