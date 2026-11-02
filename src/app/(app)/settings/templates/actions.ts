"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const SALE_LAYOUT = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #000; max-width: 100%; margin: 0 auto; padding: 0; line-height: 1.4;">
  <!-- Branding Header -->
  <div style="text-align: center; margin-bottom: 25px;">
    <div style="font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">{ten_cua_hang}</div>
    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #333;">{shop_tagline}</div>
    <div style="margin: 10px auto; width: 40px; border-bottom: 3px solid #000;"></div>
    [if:dia_chi_cua_hang]
    <div style="font-size: 10px; margin-top: 8px;">{dia_chi_cua_hang}</div>
    [/if]
    [if:sdt_cua_hang]
    <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">Hotline: {sdt_cua_hang}</div>
    [/if]
  </div>

  <!-- Receipt Title & Info -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 12px 0; margin-bottom: 20px;">
    <div style="flex: 1.2;">
      <div style="font-size: 18px; font-weight: 800; text-transform: uppercase;">Hoá đơn bán hàng</div>
      <div style="font-size: 10px; margin-top: 2px; font-weight: 600;">KH: {ten_khach}</div>
    </div>
    <div style="text-align: right; flex: 0.8;">
      <div style="font-size: 11px; font-weight: bold;">#{ma_phieu}</div>
      <div style="font-size: 10px; color: #333;">{ngay_gio_tao}</div>
    </div>
  </div>

  [if:sdt_khach]
  <div style="font-size: 11px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #ccc;">
    <div style="display: flex; justify-content: space-between;">
      <span>Điện thoại:</span>
      <span style="font-weight: bold;">{sdt_khach}</span>
    </div>
  </div>
  [/if]

  <div style="margin-bottom: 25px;">
    {sanpham}
  </div>

  <div style="padding-top: 10px; font-size: 13px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span style="text-transform: uppercase; font-size: 11px; font-weight: 600;">Tạm tính:</span>
      <span style="font-weight: bold;">{tam_tinh}</span>
    </div>
    [if:chiet_khau]
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span style="text-transform: uppercase; font-size: 11px; font-weight: 600;">Chiết khấu:</span>
      <span style="font-weight: bold;">-{chiet_khau}</span>
    </div>
    [/if]
    
    <div style="margin: 15px 0; border-top: 2px solid #000; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 18px; font-weight: 900; text-transform: uppercase;">Thành tiền</div>
      <div style="font-size: 24px; font-weight: 900;">{tong_cong}</div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: #444;">
      <span>Phương thức thanh toán:</span>
      <span style="font-weight: bold; text-transform: uppercase;">{payment_method}</span>
    </div>
    
    [if:con_no]
    <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #000; font-weight: 900; font-size: 14px;">
      <span>CÒN NỢ:</span>
      <span>{con_no}</span>
    </div>
    [/if]
  </div>

  <div style="margin-top: 40px; text-align: center;">
    {qr}
    <div style="margin: 20px auto; width: 60px; border-bottom: 1px solid #000;"></div>
    <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Cảm ơn quý khách!</div>
    <div style="font-size: 10px; margin-top: 5px; font-style: italic;">Hóa đơn có giá trị bảo hành theo từng linh kiện.</div>
    <div style="margin-top: 15px; font-size: 9px; font-weight: bold;">{ten_cua_hang} - CHẤT LƯỢNG LÀM NÊN THƯƠNG HIỆU</div>
  </div>
</div>
`.trim();

const INTAKE_LAYOUT = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #000; max-width: 100%; margin: 0 auto; padding: 0; line-height: 1.4;">
  <!-- Branding Header -->
  <div style="text-align: center; margin-bottom: 25px;">
    <div style="font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">{ten_cua_hang}</div>
    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #333;">{shop_tagline}</div>
    <div style="margin: 10px auto; width: 40px; border-bottom: 2px solid #000;"></div>
    [if:dia_chi_cua_hang]
    <div style="font-size: 10px; margin-top: 5px;">Đ/C: {dia_chi_cua_hang}</div>
    [/if]
    [if:sdt_cua_hang]
    <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">Hotline: {sdt_cua_hang}</div>
    [/if]
  </div>

  <!-- Document Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 12px 0; margin-bottom: 20px;">
    <div style="flex: 1.2;">
      <div style="font-size: 18px; font-weight: 800; text-transform: uppercase;">Phiếu tiếp nhận máy</div>
      <div style="font-size: 10px; margin-top: 2px; font-weight: 600;">KH: {ten_khach}</div>
    </div>
    <div style="text-align: right; flex: 0.8;">
      <div style="font-size: 11px; font-weight: bold;">#{ma_phieu}</div>
      <div style="font-size: 10px; color: #333;">{ngay_gio_tao}</div>
    </div>
  </div>

  <!-- Customer & Device Details Grid -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 11px;">
    <div style="border-right: 1px dashed #ccc; padding-right: 15px;">
      <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 2px;">Khách hàng</div>
      <div style="margin-bottom: 4px;">SĐT: <b>{sdt_khach}</b></div>
      [if:dia_chi_khach]
      <div>Đ/C: {dia_chi_khach}</div>
      [/if]
    </div>
    <div>
      <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 2px;">Thiết bị tiếp nhận</div>
      <div style="margin-bottom: 4px;">Model: <b>{loai_may}</b></div>
      [if:imei_serial]
      <div style="margin-bottom: 4px;">IMEI/SN: <span style="font-family: monospace;">{imei_serial}</span></div>
      [/if]
      [if:phu_kien]
      <div>Phụ kiện: {phu_kien}</div>
      [/if]
    </div>
  </div>

  <!-- Inspection Status -->
  <div style="margin-bottom: 20px; font-size: 11px; border: 1px solid #000; padding: 10px;">
    [if:tinh_trang_may]
    <div style="margin-bottom: 6px;">
      <b>Ngoại quan:</b> {tinh_trang_may}
    </div>
    [/if]
    <div>
      <b>Hiện tượng lỗi:</b> {yeu_cau_khach}
    </div>
  </div>

  <!-- Cost & Timeline Breakdown -->
  <div style="margin-bottom: 30px; font-size: 12px; border-top: 1px solid #000; padding-top: 10px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Dự toán chi phí:</span>
      <span style="font-weight: bold;">{du_kien_chi_phi}</span>
    </div>
    [if:tien_dat_coc]
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Tiền đã cọc:</span>
      <span style="font-weight: bold;">{tien_dat_coc}</span>
    </div>
    [/if]
    [if:ngay_hen_tra]
    <div style="display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 6px;">
      <span>Hẹn trả dự kiến:</span>
      <span style="font-weight: 800;">{ngay_hen_tra}</span>
    </div>
    [/if]
  </div>

  <!-- Signatures -->
  <div style="display: flex; justify-content: space-between; text-align: center; margin-top: 30px; font-size: 11px;">
    <div style="width: 45%;">
      <div style="font-weight: bold; text-transform: uppercase;">Khách hàng</div>
      <div style="font-size: 9px; font-style: italic;">(Ký & ghi rõ họ tên)</div>
      <div style="height: 50px;"></div>
      <div style="border-bottom: 1px dotted #ccc; width: 80%; margin: 0 auto;"></div>
    </div>
    <div style="width: 45%;">
      <div style="font-weight: bold; text-transform: uppercase;">Nhân viên tiếp nhận</div>
      <div style="font-size: 9px; font-style: italic;">(Ký & ghi rõ họ tên)</div>
      <div style="height: 50px;"></div>
      <div style="font-weight: bold;">{ktv_phu_trach}</div>
    </div>
  </div>
</div>
`.trim();

const RETURN_LAYOUT = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #000; max-width: 100%; margin: 0 auto; padding: 0; line-height: 1.4;">
  <!-- Branding Header -->
  <div style="text-align: center; margin-bottom: 25px;">
    <div style="font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">{ten_cua_hang}</div>
    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #333;">{shop_tagline}</div>
    <div style="margin: 10px auto; width: 40px; border-bottom: 2px solid #000;"></div>
    [if:dia_chi_cua_hang]
    <div style="font-size: 10px; margin-top: 5px;">Đ/C: {dia_chi_cua_hang}</div>
    [/if]
    [if:sdt_cua_hang]
    <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">Hotline: {sdt_cua_hang}</div>
    [/if]
  </div>

  <!-- Document Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 12px 0; margin-bottom: 20px;">
    <div style="flex: 1.2;">
      <div style="font-size: 18px; font-weight: 800; text-transform: uppercase;">Phiếu bàn giao & Bảo hành</div>
      <div style="font-size: 10px; margin-top: 2px; font-weight: 600;">KH: {ten_khach}</div>
    </div>
    <div style="text-align: right; flex: 0.8;">
      <div style="font-size: 11px; font-weight: bold;">#{ma_phieu}</div>
      <div style="font-size: 10px; color: #333;">{ngay_gio_tao}</div>
    </div>
  </div>

  <!-- Device Info -->
  <div style="margin-bottom: 20px; font-size: 11px; border: 1px solid #000; padding: 10px;">
    <div style="margin-bottom: 4px;"><b>Thiết bị:</b> {loai_may}</div>
    [if:imei_serial]
    <div style="margin-bottom: 4px;"><b>IMEI/SN:</b> {imei_serial}</div>
    [/if]
    [if:giai_phap_sua]
    <div style="margin-bottom: 4px;"><b>Giải pháp sửa chữa:</b> {giai_phap_sua}</div>
    [/if]
    [if:thoi_gian_bao_hanh]
    <div style="color: #059669; font-weight: bold;">Thời hạn bảo hành: {thoi_gian_bao_hanh}</div>
    [/if]
  </div>

  <!-- Replacement parts list -->
  <div style="margin-bottom: 20px;">
    {sanpham}
  </div>

  <!-- Total & Payment -->
  <div style="font-size: 13px; border-top: 1px solid #000; padding-top: 10px; margin-bottom: 30px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Tổng chi phí:</span>
      <span style="font-weight: bold;">{tong_chi_phi}</span>
    </div>
    [if:tien_dat_coc]
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Đã trừ cọc:</span>
      <span style="font-weight: bold;">-{tien_dat_coc}</span>
    </div>
    [/if]
    <div style="display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 10px; font-size: 18px; font-weight: 900;">
      <span>THANH TOÁN:</span>
      <span>{thuc_thu}</span>
    </div>
  </div>

  <div style="margin-top: 30px; text-align: center;">
    {qr}
    <div style="font-size: 12px; font-weight: bold; margin-top: 15px;">Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ!</div>
  </div>
</div>
`.trim();

const WARRANTY_LAYOUT = `
<div style="text-align: center; border: 2px solid #000; padding: 15px; width: 300px; margin: 0 auto; font-family: Arial;">
  <h3 style="margin: 0 0 10px 0; text-transform: uppercase;">Phiếu Bảo Hành</h3>
  <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">{ten_cua_hang}</div>
  <div style="font-size: 12px; margin-bottom: 10px;">Hotline: {sdt_cua_hang}</div>
  
  <div style="text-align: left; font-size: 12px; line-height: 1.6;">
    <strong>Mã phiếu:</strong> {ma_phieu}<br/>
    <strong>Sản phẩm:</strong> {ten_may}<br/>
    <strong>IMEI:</strong> {imei}<br/>
    <strong>Ngày mua:</strong> {ngay_tao}<br/>
    <strong>Thời hạn BH:</strong> {bao_hanh} tháng<br/>
    <strong>Ngày hết hạn:</strong> {hen_tra}
  </div>
  
  <div style="margin-top: 15px; font-size: 10px; font-style: italic;">
    Vui lòng giữ phiếu này để được hỗ trợ bảo hành.
  </div>
</div>
`.trim();

const DEFAULT_TEMPLATES = [
  {
    slug: "sale-receipt",
    name: "Hóa đơn bán hàng",
    content: SALE_LAYOUT,
  },
  {
    slug: "service-intake",
    name: "Phiếu nhận máy",
    content: INTAKE_LAYOUT,
  },
  {
    slug: "service-return",
    name: "Phiếu trả máy",
    content: RETURN_LAYOUT,
  },
  {
    slug: "warranty-receipt",
    name: "Tem/Phiếu bảo hành",
    content: WARRANTY_LAYOUT,
  },
];

export async function restoreDefaultTemplates() {
  try {
    await requireSession();

    for (const t of DEFAULT_TEMPLATES) {
      await prisma.printTemplate.upsert({
        where: { slug: t.slug },
        create: t,
        update: {
          name: t.name,
          content: t.content,
        },
      });
    }

    revalidatePath("/settings/templates");
    return { ok: true };
  } catch (e: any) {
    console.error(e);
    return { ok: false, error: e.message };
  }
}

export async function updateTemplate(id: string, data: any) {
  try {
    await prisma.printTemplate.update({
      where: { id },
      data: data as any,
    });
    revalidatePath("/settings/templates");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function getTemplates() {
  return await prisma.printTemplate.findMany({
    orderBy: { slug: "asc" },
  });
}
