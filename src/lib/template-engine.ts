import { formatVND, formatDate, formatTime, formatDateTime } from "./format";
import { formatPaymentMethodDisplay, stripSplitTag } from "./payment-utils";

export type TemplateData = {
  // General
  ten_cua_hang?: string;
  shop_tagline?: string;
  dia_chi_cua_hang?: string;
  sdt_cua_hang?: string;
  ma_phieu?: string;
  ngay_tao?: Date | string;
  gio_tao?: string;
  ngay_gio_tao?: string;
  ngay_in?: string;
  gio_in?: string;
  ngay_gio_in?: string;
  timezone?: string;
  
  // Customer
  ten_khach?: string;
  sdt_khach?: string;
  dia_chi_khach?: string | null;
  
  // Financials
  tam_tinh?: number;
  du_kien_chi_phi?: number;
  chiet_khau?: number;
  chietkhau?: number;
  tong_cong?: number;
  tong_chi_phi?: number;
  tong?: number;
  tongtien?: number;
  da_thanh_toan?: number;
  thuc_thu?: number;
  thanh_toan_lan_nay?: number;
  da_dat_coc?: number;
  tien_dat_coc?: number;
  con_no?: number;
  
  // Staff
  ten_nhan_vien?: string;
  ktv_phu_trach?: string;
  
  // Service
  loai_may?: string;
  ten_may?: string | null;
  hang?: string | null;
  model?: string | null;
  imei?: string | null;
  imei_serial?: string | null;
  phu_kien?: string | null;
  accessories?: string | null;
  tinh_trang?: string | null;
  tinh_trang_may?: string | null;
  loi_yeu_cau?: string;
  yeu_cau_khach?: string;
  giai_phap?: string | null;
  giai_phap_sua?: string | null;
  hen_tra?: Date | string | null;
  ngay_hen_tra?: Date | string | null;
  ngay_tra?: Date | string | null;
  bao_hanh?: number | string | null;
  thoi_gian_bao_hanh?: number | string | null;
  
  // Notes & Payment
  ghi_chu?: string;
  payment_method?: string;
  paymentMethod?: string;
  bank_id?: string | null;
  bank_account?: string | null;
  bank_account_name?: string | null;
  
  // For Custom Product Loop
  items?: Array<{
    ten: string;
    sl: number;
    gia: string | number;
    thanh_tien: string | number;
    bh?: string;
    imei?: string;
  }>;

  [key: string]: any;
};

export function renderTemplate(
  template: string | null | undefined, 
  data: TemplateData,
  itemsTableHtml: string = ""
): string {
  if (!template) return "";
  
  let result = template;
  const tz = data.timezone || "Asia/Ho_Chi_Minh";
  const now = new Date();
  const currentPrintDate = formatDate(now, tz);
  const currentPrintTime = formatTime(now, tz);
  const currentPrintDateTime = formatDateTime(now, tz);

  // Parse or format ngay_tao with timezone awareness
  let formattedNgayTao = "";
  let formattedGioTao = "";
  let formattedNgayGioTao = "";

  if (data.ngay_tao) {
    if (data.ngay_tao instanceof Date || (typeof data.ngay_tao === "string" && (data.ngay_tao.includes("T") || !isNaN(Date.parse(data.ngay_tao))))) {
      const d = new Date(data.ngay_tao);
      if (!isNaN(d.getTime())) {
        formattedNgayTao = formatDate(d, tz);
        formattedGioTao = formatTime(d, tz);
        formattedNgayGioTao = `${formattedGioTao} ${formattedNgayTao}`;
      } else {
        formattedNgayGioTao = String(data.ngay_tao);
      }
    } else if (typeof data.ngay_tao === "string") {
      formattedNgayGioTao = data.ngay_tao.trim();
      const parts = formattedNgayGioTao.split(/\s+/);
      if (parts.length >= 2) {
        if (parts[0].includes(":") && parts[1].includes("/")) {
          formattedGioTao = parts[0];
          formattedNgayTao = parts[1];
        } else if (parts[0].includes("/") && parts[1].includes(":")) {
          formattedNgayTao = parts[0];
          formattedGioTao = parts[1];
        }
      } else {
        formattedNgayTao = formattedNgayGioTao;
      }
    }
  } else {
    formattedNgayTao = currentPrintDate;
    formattedGioTao = currentPrintTime;
    formattedNgayGioTao = currentPrintDateTime;
  }

  // Parse or format ngay_hen_tra
  let formattedHenTra = "";
  const rawHenTra = data.ngay_hen_tra ?? data.hen_tra;
  if (rawHenTra) {
    if (rawHenTra instanceof Date || (typeof rawHenTra === "string" && (rawHenTra.includes("T") || !isNaN(Date.parse(rawHenTra))))) {
      const d = new Date(rawHenTra);
      if (!isNaN(d.getTime())) {
        formattedHenTra = formatDateTime(d, tz);
      } else {
        formattedHenTra = String(rawHenTra);
      }
    } else {
      formattedHenTra = String(rawHenTra);
    }
  }

  // Parse or format ngay_tra
  let formattedNgayTra = "";
  const rawNgayTra = data.ngay_tra;
  if (rawNgayTra) {
    if (rawNgayTra instanceof Date || (typeof rawNgayTra === "string" && (rawNgayTra.includes("T") || !isNaN(Date.parse(rawNgayTra))))) {
      const d = new Date(rawNgayTra);
      if (!isNaN(d.getTime())) {
        formattedNgayTra = formatDateTime(d, tz);
      } else {
        formattedNgayTra = String(rawNgayTra);
      }
    } else {
      formattedNgayTra = String(rawNgayTra);
    }
  }

  // Warranty formatting
  let formattedBaoHanh = "";
  const rawBh = data.thoi_gian_bao_hanh ?? data.bao_hanh;
  if (rawBh !== undefined && rawBh !== null && rawBh !== "") {
    if (typeof rawBh === "number") {
      formattedBaoHanh = rawBh > 0 ? `${rawBh} tháng` : "";
    } else {
      const num = Number(rawBh);
      if (!isNaN(num) && num > 0) {
        formattedBaoHanh = `${num} tháng`;
      } else {
        formattedBaoHanh = String(rawBh);
      }
    }
  }

  // Build unified merged dictionary with all aliases synced
  const merged: Record<string, any> = {
    ...data,
    // Store branding
    ten_cua_hang: data.ten_cua_hang || "",
    shop_tagline: data.shop_tagline || "",
    dia_chi_cua_hang: data.dia_chi_cua_hang || "",
    sdt_cua_hang: data.sdt_cua_hang || "",
    ma_phieu: data.ma_phieu || "",
    
    // Dates & Times
    ngay_tao: formattedNgayTao,
    gio_tao: formattedGioTao,
    ngay_gio_tao: formattedNgayGioTao,
    ngay_in: currentPrintDate,
    gio_in: currentPrintTime,
    ngay_gio_in: currentPrintDateTime,
    
    // Customer
    ten_khach: data.ten_khach || "Khách lẻ",
    sdt_khach: data.sdt_khach || "",
    dia_chi_khach: data.dia_chi_khach || "",
    
    // Device details (aliases synchronized)
    loai_may: data.loai_may || "",
    ten_may: data.ten_may || "",
    hang: data.hang || "",
    model: data.model || "",
    imei: data.imei ?? data.imei_serial ?? "",
    imei_serial: data.imei_serial ?? data.imei ?? "",
    phu_kien: data.phu_kien ?? data.accessories ?? "",
    accessories: data.accessories ?? data.phu_kien ?? "",
    tinh_trang: data.tinh_trang ?? data.tinh_trang_may ?? "",
    tinh_trang_may: data.tinh_trang_may ?? data.tinh_trang ?? "",
    loi_yeu_cau: data.loi_yeu_cau ?? data.yeu_cau_khach ?? "",
    yeu_cau_khach: data.yeu_cau_khach ?? data.loi_yeu_cau ?? "",
    giai_phap: data.giai_phap ?? data.giai_phap_sua ?? "",
    giai_phap_sua: data.giai_phap_sua ?? data.giai_phap ?? "",
    hen_tra: formattedHenTra,
    ngay_hen_tra: formattedHenTra,
    ngay_tra: formattedNgayTra,
    bao_hanh: formattedBaoHanh,
    thoi_gian_bao_hanh: formattedBaoHanh,
    
    // Staff / Technician
    ten_nhan_vien: data.ten_nhan_vien ?? data.ktv_phu_trach ?? "",
    ktv_phu_trach: data.ktv_phu_trach ?? data.ten_nhan_vien ?? "",
    
    // Financials
    tam_tinh: data.tam_tinh ?? data.du_kien_chi_phi ?? 0,
    du_kien_chi_phi: data.du_kien_chi_phi ?? data.tam_tinh ?? 0,
    chiet_khau: data.chiet_khau || 0,
    chietkhau: data.chiet_khau || 0,
    tong_cong: data.tong_cong ?? data.tong_chi_phi ?? data.tam_tinh ?? 0,
    tong_chi_phi: data.tong_chi_phi ?? data.tong_cong ?? data.tam_tinh ?? 0,
    tongtien: data.tong_cong ?? data.tong_chi_phi ?? data.tam_tinh ?? 0,
    tong: data.tong_cong ?? data.tong_chi_phi ?? data.tam_tinh ?? 0,
    da_thanh_toan: data.da_thanh_toan ?? data.thuc_thu ?? data.thanh_toan_lan_nay ?? 0,
    thuc_thu: data.thuc_thu ?? data.thanh_toan_lan_nay ?? data.da_thanh_toan ?? 0,
    thanh_toan_lan_nay: data.thanh_toan_lan_nay ?? data.thuc_thu ?? data.da_thanh_toan ?? 0,
    da_dat_coc: data.da_dat_coc ?? data.tien_dat_coc ?? 0,
    tien_dat_coc: data.tien_dat_coc ?? data.da_dat_coc ?? 0,
    con_no: data.con_no || 0,
    
    // Notes & Payment
    ghi_chu: stripSplitTag(data.ghi_chu || ""),
    payment_method: formatPaymentMethodDisplay(
      data.payment_method || data.paymentMethod || "",
      data.ghi_chu
    ),
  };

  // 1. KiotViet-style Product Loop: Auto-repeat any <tr> containing item variables
  const itemVariables = ["{stt}", "{ten}", "{sl}", "{gia}", "{thanh_tien}", "{bh}"];
  const trRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  
  result = result.replace(trRegex, (match) => {
    const hasItemVar = itemVariables.some(v => match.includes(v));
    
    if (hasItemVar) {
      if (!data.items || data.items.length === 0) return "";
      
      return (data.items as any[]).map((item: any, index) => {
        let row = match;
        row = row.split("{stt}").join(String(index + 1));
        row = row.split("{ten}").join(item.ten || "");
        row = row.split("{sl}").join(String(item.sl || 0));
        row = row.split("{gia}").join(typeof item.gia === 'number' ? formatVND(item.gia) : item.gia);
        row = row.split("{thanh_tien}").join(typeof item.thanh_tien === 'number' ? formatVND(item.thanh_tien) : item.thanh_tien);
        row = row.split("{bh}").join(item.bh || "");
        row = row.split("{imei}").join(item.imei || "");
        return row;
      }).join("");
    }
    
    return match;
  });

  // 2. Generate VietQR code if bank info is available
  let qrHtml = "";
  const payMethod = String(merged.payment_method || "").toLowerCase();
  const isCash = payMethod.includes("tiền mặt") || payMethod === "cash";
  const isTransfer = payMethod === "transfer" || payMethod.includes("chuyển khoản") || payMethod.includes("vietqr");

  // Khi thanh toán bằng tiền mặt (cash) thì tuyệt đối không hiển thị QR.
  // Chỉ hiển thị mã VietQR khi phương thức là chuyển khoản hoặc có công nợ cần thanh toán.
  const shouldShowQr = !isCash && (isTransfer || (merged.con_no > 0 && result.includes("{qr}")));

  if (shouldShowQr && data.bank_id && data.bank_account) {
    const amount = merged.con_no > 0 ? merged.con_no : (merged.thuc_thu > 0 ? merged.thuc_thu : merged.tong_cong);
    const code = merged.ma_phieu || "";
    const addInfo = encodeURIComponent(`THANH TOAN ${code}`);
    const qrUrl = `https://img.vietqr.io/image/${data.bank_id}-${data.bank_account}-qr_only.png?amount=${amount}&addInfo=${addInfo}`;
    qrHtml = `
<div style="text-align: center; margin: 15px 0;">
  <img src="${qrUrl}" alt="VietQR Payment" style="width: 140px; height: 140px; display: inline-block; border: 1px solid #eee; padding: 5px; background: white;" />
  <div style="font-size: 10px; color: #555; margin-top: 5px; font-family: sans-serif; font-weight: bold;">QUÉT MÃ QR THANH TOÁN CHUYỂN KHOẢN</div>
</div>
    `.trim();
    merged.qr = qrHtml;
    merged.is_transfer = true;
  } else {
    merged.qr = "";
    merged.is_transfer = false;
  }

  // 3. Handle Conditional Blocks [if:key]...[/if]
  // Supports all normalized keys (e.g. [if:imei_serial], [if:phu_kien], [if:tien_dat_coc], etc.)
  const condRegex = /\[if:(\w+)\]([\s\S]*?)\[\/if\]/gi;
  result = result.replace(condRegex, (match, key, content) => {
    const val = merged[key];
    if (val !== undefined && val !== null && val !== 0 && val !== "0" && val !== "" && val !== false) {
      return content;
    }
    return "";
  });

  // 4. Handle Regular Placeholders (Both original and aliases replaced)
  const placeholders: Record<string, string> = {
    // Branding
    "{ten_cua_hang}": merged.ten_cua_hang,
    "{shop_tagline}": merged.shop_tagline,
    "{dia_chi_cua_hang}": merged.dia_chi_cua_hang,
    "{sdt_cua_hang}": merged.sdt_cua_hang,
    "{ma_phieu}": merged.ma_phieu,
    
    // Dates
    "{ngay_tao}": merged.ngay_tao,
    "{gio_tao}": merged.gio_tao,
    "{ngay_gio_tao}": merged.ngay_gio_tao,
    "{ngay_in}": merged.ngay_in,
    "{gio_in}": merged.gio_in,
    "{ngay_gio_in}": merged.ngay_gio_in,
    
    // Customer
    "{ten_khach}": merged.ten_khach,
    "{sdt_khach}": merged.sdt_khach,
    "{dia_chi_khach}": merged.dia_chi_khach,
    
    // Financials
    "{tam_tinh}": formatVND(merged.tam_tinh),
    "{du_kien_chi_phi}": formatVND(merged.du_kien_chi_phi),
    "{chiet_khau}": formatVND(merged.chiet_khau),
    "{chietkhau}": formatVND(merged.chietkhau),
    "{tong_cong}": formatVND(merged.tong_cong),
    "{tong_chi_phi}": formatVND(merged.tong_chi_phi),
    "{tongtien}": formatVND(merged.tongtien),
    "{tong}": formatVND(merged.tong),
    "{da_thanh_toan}": formatVND(merged.da_thanh_toan),
    "{thuc_thu}": formatVND(merged.thuc_thu),
    "{thanh_toan_lan_nay}": formatVND(merged.thanh_toan_lan_nay),
    "{da_dat_coc}": formatVND(merged.da_dat_coc),
    "{tien_dat_coc}": formatVND(merged.tien_dat_coc),
    "{con_no}": formatVND(merged.con_no),
    
    // Staff & Technician
    "{ten_nhan_vien}": merged.ten_nhan_vien,
    "{ktv_phu_trach}": merged.ktv_phu_trach,
    
    // Device & Service
    "{loai_may}": merged.loai_may,
    "{ten_may}": merged.ten_may,
    "{hang}": merged.hang,
    "{model}": merged.model,
    "{imei}": merged.imei,
    "{imei_serial}": merged.imei_serial,
    "{phu_kien}": merged.phu_kien,
    "{accessories}": merged.accessories,
    "{tinh_trang}": merged.tinh_trang,
    "{tinh_trang_may}": merged.tinh_trang_may,
    "{loi_yeu_cau}": merged.loi_yeu_cau,
    "{yeu_cau_khach}": merged.yeu_cau_khach,
    "{giai_phap}": merged.giai_phap,
    "{giai_phap_sua}": merged.giai_phap_sua,
    "{hen_tra}": merged.hen_tra,
    "{ngay_hen_tra}": merged.ngay_hen_tra,
    "{ngay_tra}": merged.ngay_tra,
    "{bao_hanh}": merged.bao_hanh,
    "{thoi_gian_bao_hanh}": merged.thoi_gian_bao_hanh,
    
    // Others
    "{ghi_chu}": merged.ghi_chu,
    "{sanpham}": itemsTableHtml,
    "{payment_method}": merged.payment_method,
    "{phuong_thuc_thanh_toan}": merged.payment_method,
    "{hinh_thuc_thanh_toan}": merged.payment_method,
    "{qr}": qrHtml,
  };

  for (const [key, value] of Object.entries(placeholders)) {
    result = result.split(key).join(value);
  }
  
  return result;
}
