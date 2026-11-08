import { prisma } from "./prisma";

export type ThemeColorPreset =
  // Standard / Business
  | "blue"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "cyan"
  | "espresso"
  | "slate"
  // Seasonal / Holiday
  | "halloween"
  | "tet-doan-ngo"
  | "tet-trung-thu"
  | "quoc-khanh"
  | "tet-nguyen-dan"
  | "christmas";

export type ThemeCategory = "business" | "seasonal";

export type ThemePresetItem = {
  id: ThemeColorPreset;
  category: ThemeCategory;
  name: string;
  tag?: string;
  badge?: string;
  color: string;
  accentColor: string;
  hover: string;
  ring: string;
  description: string;
};

export const THEME_COLOR_PRESETS: ThemePresetItem[] = [
  // --- DOANH NGHIỆP & THƯỜNG NGÀY ---
  {
    id: "blue",
    category: "business",
    name: "Cobalt Blue",
    badge: "Chuẩn mực",
    color: "#2563eb",
    accentColor: "#60a5fa",
    hover: "#1d4ed8",
    ring: "#2563eb",
    description: "Hiện đại, tin cậy, sắc nét chuẩn công nghệ cao (Mặc định)",
  },
  {
    id: "emerald",
    category: "business",
    name: "Emerald Green",
    badge: "Thân thiện",
    color: "#059669",
    accentColor: "#34d399",
    hover: "#047857",
    ring: "#059669",
    description: "Tươi mới, hài hòa, mang lại cảm giác thân thiện và ổn định",
  },
  {
    id: "violet",
    category: "business",
    name: "Indigo Violet",
    badge: "Sáng tạo",
    color: "#6366f1",
    accentColor: "#a5b4fc",
    hover: "#4f46e5",
    ring: "#6366f1",
    description: "Sáng tạo, đẳng cấp, độc đáo và phong cách thời thượng",
  },
  {
    id: "amber",
    category: "business",
    name: "Warm Amber",
    badge: "Năng động",
    color: "#d97706",
    accentColor: "#fbbf24",
    hover: "#b45309",
    ring: "#d97706",
    description: "Năng động, ấm cúng, nổi bật và kích thích doanh số",
  },
  {
    id: "rose",
    category: "business",
    name: "Modern Rose",
    badge: "Trẻ trung",
    color: "#e11d48",
    accentColor: "#fb7185",
    hover: "#be123c",
    ring: "#e11d48",
    description: "Trẻ trung, táo bạo, cao cấp và tràn đầy năng lượng",
  },
  {
    id: "cyan",
    category: "business",
    name: "Ocean Cyan",
    badge: "Công nghệ",
    color: "#0891b2",
    accentColor: "#22d3ee",
    hover: "#0e7490",
    ring: "#0891b2",
    description: "Mát mẻ, thanh thoát, tinh thần tự do và công nghệ số",
  },
  {
    id: "espresso",
    category: "business",
    name: "Espresso Bronze",
    badge: "Thượng lưu",
    color: "#854d0e",
    accentColor: "#fde047",
    hover: "#713f12",
    ring: "#854d0e",
    description: "Tông gỗ ấm & cà phê thượng lưu, cổ điển và vững chãi",
  },
  {
    id: "slate",
    category: "business",
    name: "Minimal Slate",
    badge: "Tối giản",
    color: "#0f172a",
    accentColor: "#94a3b8",
    hover: "#1e293b",
    ring: "#0f172a",
    description: "Tối giản đơn sắc, sang trọng chuẩn phong cách Apple & Linear",
  },

  // --- LỄ HỘI & THEO MÙA (FESTIVE & SEASONAL) ---
  {
    id: "halloween",
    category: "seasonal",
    name: "Halloween Party",
    tag: "🎃 Lễ hội Ma quái",
    badge: "31/10",
    color: "#ea580c",
    accentColor: "#9333ea",
    hover: "#c2410c",
    ring: "#ea580c",
    description: "Sắc cam bí ngô rực lửa hòa quyện tím dạ quang huyền bí lễ hội Halloween",
  },
  {
    id: "tet-trung-thu",
    category: "seasonal",
    name: "Tết Trung Thu",
    tag: "🏮 Rằm Đoàn Viên",
    badge: "Rằm Tháng 8",
    color: "#d97706",
    accentColor: "#dc2626",
    hover: "#b45309",
    ring: "#d97706",
    description: "Ánh trăng rằm vàng ấm áp, đèn lồng rước cộ lung linh sum vầy đoàn viên",
  },
  {
    id: "quoc-khanh",
    category: "seasonal",
    name: "Kỷ Niệm Quốc Khánh 2/9",
    tag: "🇻🇳 Tết Độc Lập 2/9",
    badge: "2 Tháng 9",
    color: "#dc2626",
    accentColor: "#eab308",
    hover: "#b91c1c",
    ring: "#dc2626",
    description: "Sắc đỏ son tự hào cờ Tổ Quốc kiêu hãnh & sao vàng lấp lánh non sông",
  },
  {
    id: "tet-doan-ngo",
    category: "seasonal",
    name: "Tết Đoan Ngọ",
    tag: "🎋 Mùng 5 Tháng 5",
    badge: "5/5 Âm Lịch",
    color: "#15803d",
    accentColor: "#84cc16",
    hover: "#166534",
    ring: "#15803d",
    description: "Sắc xanh thảo mộc, nếp thơm và lá bánh ú thanh lọc đón tiết hè an lành",
  },
  {
    id: "tet-nguyen-dan",
    category: "seasonal",
    name: "Tết Nguyên Đán",
    tag: "🌸 Xuân Khởi Sắc",
    badge: "Mừng Năm Mới",
    color: "#be123c",
    accentColor: "#eab308",
    hover: "#9f1239",
    ring: "#be123c",
    description: "Sắc đỏ may mắn cành đào thắm & hoa mai vàng, khai xuân phát tài phát lộc",
  },
  {
    id: "christmas",
    category: "seasonal",
    name: "Giáng Sinh & Năm Mới",
    tag: "🎄 Merry Christmas",
    badge: "Noel 25/12",
    color: "#047857",
    accentColor: "#e11d48",
    hover: "#065f46",
    ring: "#047857",
    description: "Cây thông tuyết xanh ngát, chuông ngân và không khí ấm áp mùa lễ hội",
  },
];

export const TIMEZONE_OPTIONS: Array<{
  value: string;
  label: string;
  offset: string;
}> = [
  { value: "Asia/Ho_Chi_Minh", label: "Việt Nam (Hà Nội, TP.HCM) - GMT+7", offset: "UTC+7" },
  { value: "Asia/Bangkok", label: "Thái Lan (Bangkok) - GMT+7", offset: "UTC+7" },
  { value: "Asia/Singapore", label: "Singapore - GMT+8", offset: "UTC+8" },
  { value: "Asia/Tokyo", label: "Nhật Bản (Tokyo) - GMT+9", offset: "UTC+9" },
  { value: "UTC", label: "Giờ quốc tế (UTC) - GMT+0", offset: "UTC+0" },
];

export type AppSettings = {
  shopName: string;
  siteTitle: string;
  shopTagline: string;
  shopAddress: string | null;
  shopPhone: string | null;
  shopEmail: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  printSize: string; // "A4" | "80mm"
  timezone: string; // "Asia/Ho_Chi_Minh"
  themeColor: string; // "blue", "emerald", etc.
  bankId: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  workStartTime: string;
  workEndTime: string;
  allowedLateMinutesPerMonth: number;
  standardWorkingDaysPerMonth: number;
  defaultGpsRadius: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: "TechShop POS",
  siteTitle: "TechShop POS - Quản lý Cửa Hàng & Sửa Chữa Laptop / Điện Thoại",
  shopTagline: "Chuyên Sửa Chữa & Bán Lẻ Laptop, Điện Thoại",
  shopAddress: null,
  shopPhone: null,
  shopEmail: null,
  logoUrl: null,
  faviconUrl: null,
  printSize: "A4",
  timezone: "Asia/Ho_Chi_Minh",
  themeColor: "blue",
  bankId: null,
  bankAccount: null,
  bankAccountName: null,
  workStartTime: "08:00",
  workEndTime: "17:30",
  allowedLateMinutesPerMonth: 60,
  standardWorkingDaysPerMonth: 26,
  defaultGpsRadius: 150,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const s = await prisma.appSetting.findFirst({
      where: { id: "default" },
    });
    
    if (!s) return DEFAULT_SETTINGS;
    
    return {
      shopName: s.shopName,
      siteTitle: s.siteTitle,
      shopTagline: s.shopTagline,
      shopAddress: s.shopAddress,
      shopPhone: s.shopPhone,
      shopEmail: s.shopEmail,
      logoUrl: s.logoUrl,
      faviconUrl: s.faviconUrl,
      printSize: s.printSize,
      timezone: (s as any).timezone || "Asia/Ho_Chi_Minh",
      themeColor: (s as any).themeColor || "blue",
      bankId: s.bankId ?? null,
      bankAccount: s.bankAccount ?? null,
      bankAccountName: s.bankAccountName ?? null,
      workStartTime: (s as any).workStartTime || "08:00",
      workEndTime: (s as any).workEndTime || "17:30",
      allowedLateMinutesPerMonth: (s as any).allowedLateMinutesPerMonth ?? 60,
      standardWorkingDaysPerMonth: (s as any).standardWorkingDaysPerMonth ?? 26,
      defaultGpsRadius: (s as any).defaultGpsRadius ?? 150,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
