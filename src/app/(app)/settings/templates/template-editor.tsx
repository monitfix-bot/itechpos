"use client";

import { useState, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Save, FileText, Info, Copy, Search, Check, Sparkles, Printer, Layers
} from "lucide-react";
import { toast } from "sonner";
import { updateTemplate } from "./actions";
import { renderTemplate } from "@/lib/template-engine";
import { sanitizeTemplateHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

// Import Jodit dynamically
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <div className="h-[550px] bg-muted/40 animate-pulse rounded-2xl flex items-center justify-center text-xs text-muted-foreground">Đang tải trình soạn thảo mẫu in...</div>,
});

type Template = {
  id: string;
  name: string;
  slug: string;
  content: string | null;
};

const MOCK_DATA = {
  ten_cua_hang: "TechShop POS Workstation",
  shop_tagline: "Chuyên sửa chữa & Bán lẻ Laptop, Điện thoại",
  dia_chi_cua_hang: "123 Đường Láng, Đống Đa, Hà Nội",
  sdt_cua_hang: "0988 123 456",
  ma_phieu: "SC00088",
  ngay_tao: new Date(),
  ten_khach: "Lê Hoàng Nam",
  sdt_khach: "0909888999",
  dia_chi_khach: "Cầu Giấy, Hà Nội",
  tam_tinh: 8650000,
  du_kien_chi_phi: 8650000,
  chiet_khau: 0,
  tong_cong: 8650000,
  tong_chi_phi: 8650000,
  da_thanh_toan: 1000000,
  thuc_thu: 7650000,
  thanh_toan_lan_nay: 7650000,
  da_dat_coc: 1000000,
  tien_dat_coc: 1000000,
  con_no: 7650000,
  ten_nhan_vien: "KTV Nguyễn Văn Nam",
  ktv_phu_trach: "KTV Nguyễn Văn Nam",
  loai_may: "Điện thoại",
  ten_may: "Apple iPhone 14 Pro Max",
  hang: "Apple",
  model: "iPhone 14 Pro Max",
  imei: "353267100123456",
  imei_serial: "353267100123456",
  phu_kien: "Cáp sạc, ốp lưng",
  tinh_trang: "Vỡ kính màn hình, cảm ứng bình thường",
  tinh_trang_may: "Vỡ kính màn hình, cảm ứng bình thường",
  loi_yeu_cau: "Thay cụm màn hình OLED zin Apple",
  yeu_cau_khach: "Thay cụm màn hình OLED zin Apple",
  giai_phap: "Thay cụm màn hình OLED chính hãng",
  giai_phap_sua: "Thay cụm màn hình OLED chính hãng",
  hen_tra: "18:00 05/11/2026",
  ngay_hen_tra: "18:00 05/11/2026",
  ngay_tra: "17:30 04/11/2026",
  bao_hanh: "6 tháng",
  thoi_gian_bao_hanh: "6 tháng",
  ghi_chu: "Khách VIP, hỗ trợ vệ sinh máy & dán cường lực miễn phí",
  bank_id: "vietcombank",
  bank_account: "001100223344",
  payment_method: "transfer",
  items: [
    { ten: "Màn hình OLED iPhone 14 Pro Max Zin", sl: 1, gia: 8500000, thanh_tien: 8500000, bh: "6T" },
    { ten: "Dán cường lực KingKong", sl: 1, gia: 150000, thanh_tien: 150000, bh: "1T" },
  ],
};

const CATEGORIES = [
  { id: "all", label: "Tất cả biến" },
  { id: "shop_customer", label: "Cửa hàng & Khách" },
  { id: "device_service", label: "Thiết bị & Sửa chữa" },
  { id: "finance", label: "Tài chính & Thanh toán" },
  { id: "items_qr", label: "Sản phẩm & QR" },
];

const VARIABLES = [
  // Cửa hàng
  { key: "{ten_cua_hang}", label: "Tên cửa hàng", cat: "shop_customer" },
  { key: "{shop_tagline}", label: "Slogan / Mô tả cửa hàng", cat: "shop_customer" },
  { key: "{dia_chi_cua_hang}", label: "Địa chỉ cửa hàng", cat: "shop_customer" },
  { key: "{sdt_cua_hang}", label: "SĐT hotline cửa hàng", cat: "shop_customer" },
  { key: "{ma_phieu}", label: "Mã phiếu / Mã hóa đơn", cat: "shop_customer" },
  // Thời gian
  { key: "{ngay_tao}", label: "Ngày tạo phiếu (DD/MM/YYYY)", cat: "shop_customer" },
  { key: "{gio_tao}", label: "Giờ tạo phiếu (HH:mm)", cat: "shop_customer" },
  { key: "{ngay_gio_tao}", label: "Ngày & giờ tạo phiếu", cat: "shop_customer" },
  { key: "{ngay_in}", label: "Ngày in thực tế (DD/MM/YYYY)", cat: "shop_customer" },
  { key: "{gio_in}", label: "Giờ in thực tế (HH:mm)", cat: "shop_customer" },
  { key: "{ngay_gio_in}", label: "Ngày & giờ in thực tế", cat: "shop_customer" },
  // Khách hàng
  { key: "{ten_khach}", label: "Tên khách hàng", cat: "shop_customer" },
  { key: "{sdt_khach}", label: "SĐT khách hàng", cat: "shop_customer" },
  { key: "{dia_chi_khach}", label: "Địa chỉ khách hàng", cat: "shop_customer" },
  // Thiết bị & Dịch vụ sửa chữa
  { key: "{loai_may}", label: "Loại thiết bị", cat: "device_service" },
  { key: "{ten_may}", label: "Tên máy đầy đủ", cat: "device_service" },
  { key: "{hang}", label: "Hãng sản xuất", cat: "device_service" },
  { key: "{model}", label: "Model thiết bị", cat: "device_service" },
  { key: "{imei_serial}", label: "IMEI / Số Serial", cat: "device_service" },
  { key: "{phu_kien}", label: "Phụ kiện kèm theo", cat: "device_service" },
  { key: "{tinh_trang_may}", label: "Tình trạng ngoại quan máy", cat: "device_service" },
  { key: "{yeu_cau_khach}", label: "Lỗi báo / Yêu cầu xử lý", cat: "device_service" },
  { key: "{giai_phap_sua}", label: "Giải pháp sửa chữa", cat: "device_service" },
  { key: "{thoi_gian_bao_hanh}", label: "Thời hạn bảo hành", cat: "device_service" },
  { key: "{ngay_hen_tra}", label: "Ngày hẹn trả máy", cat: "device_service" },
  { key: "{ngay_tra}", label: "Ngày trả máy thực tế", cat: "device_service" },
  { key: "{ktv_phu_trach}", label: "KTV / Nhân viên tiếp nhận", cat: "device_service" },
  // Tài chính & Thanh toán
  { key: "{du_kien_chi_phi}", label: "Dự toán chi phí / Tạm tính", cat: "finance" },
  { key: "{tien_dat_coc}", label: "Tiền đã đặt cọc", cat: "finance" },
  { key: "{tong_chi_phi}", label: "Tổng chi phí sửa chữa", cat: "finance" },
  { key: "{tong_cong}", label: "Tổng cộng thành tiền", cat: "finance" },
  { key: "{chiet_khau}", label: "Chiết khấu giảm giá", cat: "finance" },
  { key: "{thuc_thu}", label: "Số tiền thanh toán lần này", cat: "finance" },
  { key: "{da_thanh_toan}", label: "Tổng số tiền đã thanh toán", cat: "finance" },
  { key: "{con_no}", label: "Số tiền còn nợ lại", cat: "finance" },
  { key: "{payment_method}", label: "Phương thức thanh toán", cat: "finance" },
  // QR & Bảng sản phẩm
  { key: "{qr}", label: "Mã VietQR thanh toán tự động", cat: "items_qr" },
  { key: "{sanpham}", label: "Bảng danh sách linh kiện / hàng hóa", cat: "items_qr" },
  { key: "{ghi_chu}", label: "Ghi chú phiếu", cat: "items_qr" },
  { key: "{stt}", label: "STT (Dòng sản phẩm)", cat: "items_qr" },
  { key: "{ten}", label: "Tên SP (Dòng sản phẩm)", cat: "items_qr" },
  { key: "{sl}", label: "SL (Dòng sản phẩm)", cat: "items_qr" },
  { key: "{gia}", label: "Đơn giá (Dòng sản phẩm)", cat: "items_qr" },
  { key: "{thanh_tien}", label: "Thành tiền (Dòng sản phẩm)", cat: "items_qr" },
  { key: "{bh}", label: "Bảo hành linh kiện", cat: "items_qr" },
  { key: "{imei}", label: "IMEI linh kiện", cat: "items_qr" },
];

export function TemplateEditor({ templates }: { templates: Template[] }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id);
  const [selectedCat, setSelectedCat] = useState("all");
  const [varSearch, setVarSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = templates.find((t) => t.id === selectedId);
  const [content, setContent] = useState(current?.content || "");

  useMemo(() => {
    if (current) {
      setContent(current.content || "");
    }
  }, [selectedId, current]);

  function submit() {
    if (!selectedId) return;
    startTransition(async () => {
      const res = await updateTemplate(selectedId, { content });
      if (res.ok) {
        toast.success("Đã lưu mẫu in thành công");
      } else {
        toast.error(res.error || "Lỗi khi lưu mẫu in");
      }
    });
  }

  const mockItemsHtml = `
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
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 10px 0;">
          <div style="font-weight: bold; font-size: 13px; color: #000;">Màn hình OLED iPhone 14 Pro Max Zin</div>
          <div style="font-size: 10px; color: #666; margin-top: 2px;">BH: 6T</div>
        </td>
        <td style="padding: 10px 0; text-align: center; font-size: 13px;">1</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 13px;">8.500.000đ</td>
      </tr>
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 10px 0;">
          <div style="font-weight: bold; font-size: 13px; color: #000;">Dán cường lực KingKong</div>
          <div style="font-size: 10px; color: #666; margin-top: 2px;">BH: 1T</div>
        </td>
        <td style="padding: 10px 0; text-align: center; font-size: 13px;">1</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 13px;">150.000đ</td>
      </tr>
    </tbody>
  </table>
</div>`.trim();

  const renderedContent = sanitizeTemplateHtml(renderTemplate(content, MOCK_DATA, mockItemsHtml));

  const filteredVars = useMemo(() => {
    return VARIABLES.filter((v) => {
      const matchCat = selectedCat === "all" || v.cat === selectedCat;
      const matchSearch =
        !varSearch ||
        v.key.toLowerCase().includes(varSearch.toLowerCase()) ||
        v.label.toLowerCase().includes(varSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, varSearch]);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "Soạn thảo mẫu in...",
      minHeight: 520,
      height: "auto",
      toolbarSticky: false,
      buttons: [
        "source",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "font",
        "fontsize",
        "brush",
        "|",
        "ul",
        "ol",
        "|",
        "align",
        "outdent",
        "indent",
        "|",
        "table",
        "link",
        "hr",
        "|",
        "undo",
        "redo",
        "|",
        "eraser",
        "fullsize",
      ],
      style: {
        fontFamily: "Inter, sans-serif",
      },
    }),
    []
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-20">
      {/* Editor Side: 7 Cols on desktop */}
      <div className="xl:col-span-7 space-y-4 flex flex-col">
        {/* Template Selector Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-x-auto">
          {templates.map((t) => {
            const isSelected = selectedId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0",
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <FileText className="size-3.5" />
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Editor Box */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm overflow-hidden flex flex-col">
          <div className="jodit-editor-container border-b border-slate-200 dark:border-slate-800">
            <JoditEditor
              value={content}
              config={config}
              onBlur={(newContent) => setContent(newContent)}
            />
          </div>

          {/* Variables Palette with Search & Categorization */}
          <div className="p-5 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3.5 text-blue-500" />
                Danh mục biến dữ liệu động (Click để sao chép)
              </div>

              {/* Variable Search Box */}
              <div className="relative w-full sm:w-56">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={varSearch}
                  onChange={(e) => setVarSearch(e.target.value)}
                  placeholder="Tìm biến: imei, qr..."
                  className="h-8 pl-8 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCat(c.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                    selectedCat === c.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Variable Tags Grid */}
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1 pr-1">
              {filteredVars.map((v) => {
                const isCopied = copiedKey === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(v.key);
                      setCopiedKey(v.key);
                      toast.success(`Đã copy ${v.key}`);
                      setTimeout(() => setCopiedKey(null), 1500);
                    }}
                    title={v.label}
                    className={cn(
                      "group text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 text-left",
                      isCopied
                        ? "bg-emerald-500 text-white border-emerald-600 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-foreground"
                    )}
                  >
                    <span>{v.key}</span>
                    <span className="text-[10px] opacity-60 font-sans truncate max-w-[120px]">
                      • {v.label}
                    </span>
                    {isCopied ? (
                      <Check className="size-3 shrink-0" />
                    ) : (
                      <Copy className="size-2.5 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              Mẹo: Các biến dữ liệu sẽ tự động điền khi xuất bill thực tế.
            </span>
            <Button
              onClick={submit}
              disabled={pending}
              size="lg"
              className="w-full sm:w-auto px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Lưu mẫu in
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Side: 5 Cols on desktop */}
      <div className="xl:col-span-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm flex flex-col sticky top-6">
        <div className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="size-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Bản xem trước hoá đơn
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Preview
          </span>
        </div>

        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/60 overflow-y-auto max-h-[800px]">
          {/* Thermal Paper Simulation Card */}
          <div className="max-w-[340px] mx-auto shadow-2xl rounded-2xl border border-slate-200 bg-white text-black p-6 sm:p-8 min-h-[500px] print-paper">
            <div
              className="print-preview-content font-sans text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .jodit-editor-container {
          min-height: 520px;
        }
        .jodit-editor-container .jodit-container {
          border: none !important;
          min-height: 520px !important;
          display: flex;
          flex-direction: column;
        }
        .jodit-editor-container .jodit-workplace {
          flex: 1;
          min-height: 440px !important;
        }
        .jodit-wysiwyg table:not([border]),
        .jodit-wysiwyg table[border="0"] {
          border: 1px dashed #ccc !important;
        }
        .jodit-wysiwyg table:not([border]) td,
        .jodit-wysiwyg table[border="0"] td {
          border: 1px dashed #eee !important;
        }
        .print-preview-content {
          font-family: Arial, sans-serif;
          font-size: 13px;
          line-height: 1.5;
        }
        .print-preview-content table {
          width: 100%;
          border-collapse: collapse;
        }
        .print-preview-content table[border="1"],
        .print-preview-content table[border="1"] td,
        .print-preview-content table[border="1"] th {
          border: 1px solid #000;
        }
        .print-preview-content table[border="0"],
        .print-preview-content table:not([border]),
        .print-preview-content table[border="0"] td,
        .print-preview-content table:not([border]) td {
          border: none;
        }
        .print-preview-content td {
          padding: 4px;
        }
      `}</style>
    </div>
  );
}
