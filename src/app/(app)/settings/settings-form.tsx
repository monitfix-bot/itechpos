"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { 
  Loader2, Upload, Trash2, Store, Printer, 
  CreditCard, Image as ImageIcon, Check, ChevronRight,
  Palette, Clock, Sparkles, Sun, Moon, PartyPopper, Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { 
  type AppSettings, 
  THEME_COLOR_PRESETS, 
  TIMEZONE_OPTIONS,
  type ThemeColorPreset 
} from "@/lib/settings";
import { updateSettings, uploadAsset, clearAsset } from "./actions";
import { cn } from "@/lib/utils";
import { formatDate, formatTime, formatDateTime } from "@/lib/format";

type TabType = "general" | "attendance" | "appearance" | "print" | "payment" | "assets";

export function SettingsForm({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [pending, startTransition] = useTransition();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentMode, setCurrentMode] = useState<"light" | "dark">("light");
  const [themeFilter, setThemeFilter] = useState<"all" | "seasonal" | "business">("all");

  useEffect(() => {
    if (typeof document !== "undefined") {
      setCurrentMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    }
  }, []);

  const [form, setForm] = useState({
    shopName: initial.shopName,
    siteTitle: initial.siteTitle,
    shopTagline: initial.shopTagline,
    shopAddress: initial.shopAddress ?? "",
    shopPhone: initial.shopPhone ?? "",
    shopEmail: initial.shopEmail ?? "",
    printSize: initial.printSize,
    timezone: initial.timezone || "Asia/Ho_Chi_Minh",
    themeColor: initial.themeColor || "blue",
    bankId: initial.bankId ?? "",
    bankAccount: initial.bankAccount ?? "",
    bankAccountName: initial.bankAccountName ?? "",
    workStartTime: initial.workStartTime || "08:00",
    workEndTime: initial.workEndTime || "17:30",
    allowedLateMinutesPerMonth: String(initial.allowedLateMinutesPerMonth ?? 60),
    standardWorkingDaysPerMonth: String(initial.standardWorkingDaysPerMonth ?? 26),
    defaultGpsRadius: String(initial.defaultGpsRadius ?? 150),
  });

  // Ticker for live time preview
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    // If setting themeColor, apply live preview immediately
    if (k === "themeColor") {
      try {
        localStorage.setItem("theme_color", v);
      } catch {}
      document.documentElement.setAttribute("data-theme", v);
      if (v === "halloween") {
        document.documentElement.classList.add("dark");
        try { localStorage.setItem("pos_theme_mode", "dark"); } catch {}
        setCurrentMode("dark");
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pos_theme_changed", { detail: v }));
      }
    }
  }

  function submit() {
    if (!form.shopName || !form.siteTitle) {
      toast.error("Vui lòng nhập tên cửa hàng & tiêu đề trang");
      return;
    }
    startTransition(async () => {
      const res = await updateSettings(form);
      if (res.ok) {
        toast.success("Đã lưu cài đặt toàn hệ thống thành công");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi khi lưu cài đặt");
      }
    });
  }

  const tabs = [
    { id: "general", label: "Cửa hàng", icon: Store, desc: "Thông tin cơ bản & liên hệ" },
    { id: "attendance", label: "Chấm công & Ca làm", icon: Clock, desc: "Giờ làm, đi muộn, công tháng" },
    { id: "appearance", label: "Giao diện & Màu sắc", icon: Palette, desc: "Màu chủ đạo toàn hệ thống" },
    { id: "print", label: "In ấn & Thời gian", icon: Printer, desc: "Đồng bộ múi giờ & mẫu in" },
    { id: "payment", label: "Thanh toán", icon: CreditCard, desc: "Ngân hàng & VietQR" },
    { id: "assets", label: "Hình ảnh", icon: ImageIcon, desc: "Logo & Biểu tượng hệ thống" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 shrink-0 space-y-1.5 p-2 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-sm overflow-hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all duration-150 group relative active:scale-98",
              activeTab === tab.id 
                ? "bg-blue-600 text-white font-extrabold shadow-md shadow-blue-600/25" 
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-colors shrink-0",
              activeTab === tab.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700"
            )}>
              <tab.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm leading-tight truncate">{tab.label}</div>
              <div className={cn(
                "text-[10px] mt-0.5 truncate",
                activeTab === tab.id ? "text-blue-100" : "text-slate-400"
              )}>
                {tab.desc}
              </div>
            </div>
            {activeTab === tab.id && <ChevronRight className="w-4 h-4 shrink-0 opacity-80" />}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full space-y-6">
        <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-transparent dark:from-blue-950/40 dark:to-transparent border-b border-slate-100 dark:border-slate-800 pb-5 px-6 sm:px-8">
            <div className="flex items-center gap-3">
               <div className="p-3 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-xs">
                  {tabs.find(t => t.id === activeTab)?.icon && (() => {
                    const Icon = tabs.find(t => t.id === activeTab)!.icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
               </div>
               <div>
                  <CardTitle className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">
                    {tabs.find(t => t.id === activeTab)?.desc}
                  </CardDescription>
               </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Tên cửa hàng *" hint="Tên hiển thị trên các văn bản">
                    <Input
                      value={form.shopName}
                      onChange={(e) => set("shopName", e.target.value)}
                      className="rounded-xl border-border/80 focus-visible:ring-primary/20 h-11"
                    />
                  </Field>
                  <Field label="Slogan / Tagline" hint="Câu khẩu hiệu ngắn gọn">
                    <Input
                      value={form.shopTagline}
                      onChange={(e) => set("shopTagline", e.target.value)}
                      placeholder="Laptop & Điện thoại"
                      className="rounded-xl border-border/80 focus-visible:ring-primary/20 h-11"
                    />
                  </Field>
                </div>
                <Field label="Tiêu đề trang web *" hint="Hiển thị trên tab trình duyệt">
                  <Input
                    value={form.siteTitle}
                    onChange={(e) => set("siteTitle", e.target.value)}
                    className="rounded-xl border-border/80 focus-visible:ring-primary/20 h-11"
                  />
                </Field>
                <div className="pt-6 border-t border-border/50 space-y-6">
                   <Field label="Địa chỉ liên hệ" hint="Địa chỉ in trên hoá đơn">
                    <Input
                      value={form.shopAddress}
                      onChange={(e) => set("shopAddress", e.target.value)}
                      placeholder="123 Lê Lợi, Q.1, TP.HCM"
                      className="rounded-xl border-border/80 focus-visible:ring-primary/20 h-11"
                    />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Số điện thoại" hint="Hotline hỗ trợ">
                      <Input
                        value={form.shopPhone}
                        onChange={(e) => set("shopPhone", e.target.value)}
                        placeholder="1900 1234"
                        className="rounded-xl border-border/80 focus-visible:ring-primary/20 h-11"
                      />
                    </Field>
                    <Field label="Email liên hệ" hint="Hộp thư CSKH">
                      <Input
                        type="email"
                        value={form.shopEmail}
                        onChange={(e) => set("shopEmail", e.target.value)}
                        className="rounded-xl border-border/80 focus-visible:ring-primary/20 h-11"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE TAB (THEME COLOR SELECTOR) */}
            {activeTab === "appearance" && (
              <div className="space-y-8">
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Bảng màu sắc thương hiệu toàn hệ thống</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Lựa chọn tone màu sắc đại diện cho cửa hàng của bạn. Màu sắc này sẽ tự động đồng bộ lên thanh điều hướng, các nút bấm, biểu tượng trạng thái và giao diện bán hàng POS.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                      Chọn phong cách & màu sắc ({THEME_COLOR_PRESETS.length} giao diện)
                    </Label>

                    {/* Filter tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 w-fit">
                      <button
                        type="button"
                        onClick={() => setThemeFilter("all")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          themeFilter === "all"
                            ? "bg-background text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Tất cả ({THEME_COLOR_PRESETS.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeFilter("seasonal")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                          themeFilter === "seasonal"
                            ? "bg-background text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>🎉</span>
                        <span>Lễ hội & Theo mùa ({THEME_COLOR_PRESETS.filter(p => p.category === "seasonal").length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeFilter("business")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                          themeFilter === "business"
                            ? "bg-background text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>💼</span>
                        <span>Doanh nghiệp ({THEME_COLOR_PRESETS.filter(p => p.category === "business").length})</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {THEME_COLOR_PRESETS.filter(p => {
                      if (themeFilter === "seasonal") return p.category === "seasonal";
                      if (themeFilter === "business") return p.category === "business";
                      return true;
                    }).map((preset) => {
                      const isSelected = form.themeColor === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => set("themeColor", preset.id)}
                          className={cn(
                            "group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 overflow-hidden",
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-md scale-[1.02] ring-2 ring-primary/20" 
                              : "border-border/70 hover:border-border hover:bg-muted/40 hover:scale-[1.01]"
                          )}
                        >
                          {/* Festive or Standard Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {/* Dual swatch circle */}
                              <div className="relative flex items-center shrink-0">
                                <span 
                                  className="size-7 rounded-full shadow-md flex items-center justify-center ring-2 ring-white dark:ring-slate-900 z-10"
                                  style={{ backgroundColor: preset.color }}
                                >
                                  {isSelected && <Check className="size-4 text-white stroke-[3]" />}
                                </span>
                                <span 
                                  className="size-5 rounded-full shadow-inner ring-1 ring-white dark:ring-slate-900 -ml-2.5 opacity-90"
                                  style={{ backgroundColor: preset.accentColor }}
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-sm text-foreground flex items-center gap-1.5 truncate">
                                  <span>{preset.name}</span>
                                </div>
                                {preset.tag ? (
                                  <div className="text-[10px] font-semibold text-primary truncate">
                                    {preset.tag}
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-medium text-muted-foreground truncate">
                                    {preset.badge}
                                  </div>
                                )}
                              </div>
                            </div>

                            <span 
                              className={cn(
                                "text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0",
                                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {isSelected ? "Đang chọn" : preset.badge || preset.color}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {preset.description}
                          </p>

                          {/* Dual Swatch Preview Bar */}
                          <div className="space-y-1.5 pt-1">
                            <div className="h-2 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex shadow-inner">
                              <div className="h-full w-2/3 transition-all" style={{ backgroundColor: preset.color }} />
                              <div className="h-full w-1/3 transition-all" style={{ backgroundColor: preset.accentColor }} />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                              <span className="flex items-center gap-1">
                                <span className="size-1.5 rounded-full" style={{ backgroundColor: preset.color }} />
                                {preset.color}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="size-1.5 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                                {preset.accentColor}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dark / Light Mode Selection */}
                <div className="space-y-3 pt-6 border-t border-border/50">
                  <Label className="text-xs font-bold text-foreground/80 ml-1 uppercase tracking-wider">
                    Chế độ hiển thị Giao diện (Sáng / Tối)
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => {
                        document.documentElement.classList.remove("dark");
                        try { localStorage.setItem("pos_theme_mode", "light"); } catch {}
                        setCurrentMode("light");
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3",
                        currentMode === "light"
                          ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <Sun className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">Giao diện Sáng (Light Mode)</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Màn hình trắng sáng, phù hợp ban ngày</div>
                        </div>
                      </div>
                      {currentMode === "light" && <Check className="size-5 text-primary stroke-[3]" />}
                    </div>

                    <div
                      onClick={() => {
                        document.documentElement.classList.add("dark");
                        try { localStorage.setItem("pos_theme_mode", "dark"); } catch {}
                        setCurrentMode("dark");
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3",
                        currentMode === "dark"
                          ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-slate-800 text-slate-100 flex items-center justify-center">
                          <Moon className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">Giao diện Tối (Dark / OLED Mode)</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Dịu mắt ban đêm, phong cách hiện đại</div>
                        </div>
                      </div>
                      {currentMode === "dark" && <Check className="size-5 text-primary stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-6 rounded-2xl border border-border/80 bg-background/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sparkles className="size-3.5 text-primary" />
                      <span>Xem trước giao diện thực tế ({THEME_COLOR_PRESETS.find(p => p.id === form.themeColor)?.name || form.themeColor})</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Hiệu ứng tức thì (Live Preview)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {/* Primary Button */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-card flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Nút bấm chính</span>
                      <Button variant="default" className="rounded-xl font-bold w-full shadow-sm">
                        Thanh toán ngay
                      </Button>
                    </div>

                    {/* Secondary / Outline Button */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-card flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Nút thứ cấp</span>
                      <Button variant="outline" className="rounded-xl font-bold border-primary text-primary hover:bg-primary/10 w-full">
                        In lại hoá đơn
                      </Button>
                    </div>

                    {/* Badge & Stat */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-card flex flex-col justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Huy hiệu & Điểm nhấn</span>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {THEME_COLOR_PRESETS.find(p => p.id === form.themeColor)?.tag || "Đang hoạt động"}
                        </span>
                        <span className="text-sm font-mono font-bold text-primary">
                          29.000.000 đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRINT & TIME SETTINGS TAB */}
            {activeTab === "print" && (
              <div className="space-y-8">
                 {/* Live Time Synchronization Status */}
                 <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                        <Clock className="size-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-300">
                            Đồng bộ thời gian cho phiếu in & hoá đơn
                          </h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Sync
                          </span>
                        </div>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 leading-relaxed">
                          Thời gian in trên hoá đơn và phiếu nhận/trả máy sẽ được tính chính xác theo múi giờ được thiết lập bên dưới.
                        </p>
                      </div>
                    </div>

                    <div className="bg-background/80 border border-emerald-500/20 px-5 py-3 rounded-2xl shadow-sm text-right min-w-[200px]">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Thời gian thực tế ({form.timezone.split("/")[1] || form.timezone})
                      </div>
                      <div className="text-xl font-black font-mono text-emerald-600 mt-0.5">
                        {formatTime(currentTime, form.timezone)}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        {formatDate(currentTime, form.timezone)}
                      </div>
                    </div>
                 </div>

                 {/* Timezone Selector */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field 
                      label="Múi giờ hệ thống (Timezone)" 
                      hint="Định danh chuẩn IANA cho giờ xuất phiếu"
                    >
                      <SelectField
                        value={form.timezone}
                        onValueChange={(v) => set("timezone", v ?? "Asia/Ho_Chi_Minh")}
                        options={TIMEZONE_OPTIONS.map((tz) => ({
                          value: tz.value,
                          label: tz.label,
                        }))}
                        className="w-full rounded-xl border-border/80 h-11"
                      />
                    </Field>

                    <Field 
                      label="Khổ giấy in mặc định" 
                      hint="Áp dụng khi nhấn nút In nhanh"
                    >
                      <SelectField
                        value={form.printSize}
                        onValueChange={(v) => set("printSize", v ?? "A4")}
                        options={[
                          { value: "A4", label: "Khổ giấy A4 / A5 (Máy in laser văn phòng)" },
                          { value: "80mm", label: "Khổ giấy 80mm (Máy in nhiệt bill K80)" },
                        ]}
                        className="w-full rounded-xl border-border/80 h-11"
                      />
                    </Field>
                 </div>

                 {/* Print Samples & Variables Preview */}
                 <div className="p-5 rounded-2xl border border-border/70 bg-muted/20 space-y-3">
                   <div className="text-xs font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                     <Printer className="size-4 text-primary" />
                     Ví dụ kết quả render biến thời gian trên phiếu in
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                     <div className="p-3 rounded-xl bg-background border">
                       <span className="font-mono text-[10px] text-muted-foreground block font-bold">{"{gio_tao}"} / {"{gio_in}"}</span>
                       <span className="font-bold text-sm text-foreground">{formatTime(currentTime, form.timezone)}</span>
                     </div>
                     <div className="p-3 rounded-xl bg-background border">
                       <span className="font-mono text-[10px] text-muted-foreground block font-bold">{"{ngay_tao}"} / {"{ngay_in}"}</span>
                       <span className="font-bold text-sm text-foreground">{formatDate(currentTime, form.timezone)}</span>
                     </div>
                     <div className="p-3 rounded-xl bg-background border">
                       <span className="font-mono text-[10px] text-muted-foreground block font-bold">{"{ngay_gio_tao}"} / {"{ngay_gio_in}"}</span>
                       <span className="font-bold text-sm text-foreground">{formatDateTime(currentTime, form.timezone)}</span>
                     </div>
                   </div>
                 </div>

                 <div className="pt-6 border-t border-border/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Tuỳ biến mẫu in & biến dữ liệu</h4>
                        <p className="text-xs text-muted-foreground mt-1">Chỉnh sửa nội dung, bố cục HTML và thêm các biến IMEI, bảo hành, tiền cọc...</p>
                      </div>
                      <Button
                        variant="default"
                        className="rounded-xl font-bold shadow-lg shadow-primary/20"
                        onClick={() => router.push("/settings/templates")}
                      >
                        <Printer className="size-4 mr-2" />
                        Chỉnh sửa mẫu in
                      </Button>
                    </div>
                  </div>
              </div>
            )}

            {/* PAYMENT TAB */}
            {activeTab === "payment" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Ngân hàng thụ hưởng">
                    <SelectField
                      value={form.bankId}
                      onValueChange={(v) => set("bankId", v ?? "")}
                      options={[
                        { value: "", label: "-- Chọn ngân hàng --" },
                        { value: "vietcombank", label: "Vietcombank (VCB)" },
                        { value: "mbbank", label: "MBBank (MB)" },
                        { value: "bidv", label: "BIDV" },
                        { value: "vietinbank", label: "VietinBank" },
                        { value: "techcombank", label: "Techcombank (TCB)" },
                        { value: "acb", label: "ACB" },
                        { value: "tpb", label: "TPBank (TPB)" },
                        { value: "vpb", label: "VPBank (VPB)" },
                        { value: "sacombank", label: "Sacombank" },
                        { value: "agribank", label: "Agribank" },
                      ]}
                      className="w-full rounded-xl border-border/80 h-11"
                    />
                  </Field>
                  <Field label="Số tài khoản">
                    <Input
                      value={form.bankAccount}
                      onChange={(e) => set("bankAccount", e.target.value)}
                      placeholder="0123456789"
                      className="rounded-xl border-border/80 focus-visible:ring-primary/20 h-11"
                    />
                  </Field>
                  <Field label="Tên chủ tài khoản">
                    <Input
                      value={form.bankAccountName}
                      onChange={(e) => set("bankAccountName", e.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN A"
                      className="rounded-xl border-border/80 focus-visible:ring-primary/20 h-11"
                    />
                  </Field>
                </div>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <CreditCard className="size-4" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Tự động hoá thanh toán với VietQR</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hệ thống sẽ tự động tạo mã QR Code thanh toán chính xác số tiền và nội dung chuyển khoản cho từng đơn hàng. Điều này giúp bạn nhận tiền nhanh chóng và tránh sai sót khi khách hàng nhập liệu thủ công.
                  </p>
                </div>
              </div>
            )}

            {/* ASSETS TAB */}
            {activeTab === "assets" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AssetCard
                  kind="logo"
                  label="Logo cửa hàng"
                  hint="Hiển thị trên Header và Hoá đơn. PNG/JPG/SVG, tối đa 2MB."
                  currentUrl={initial.logoUrl}
                />
                <AssetCard
                  kind="favicon"
                  label="Favicon"
                  hint="Biểu tượng trên tab trình duyệt. Ảnh vuông 1:1, tối đa 1MB."
                  currentUrl={initial.faviconUrl}
                />
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-border/50 flex items-center justify-between gap-4">
               <div className="hidden sm:block">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                    <Check className="size-4 text-emerald-500" />
                    Hệ thống đã sẵn sàng với các thay đổi mới
                  </p>
               </div>
               <Button 
                onClick={submit} 
                disabled={pending} 
                size="lg"
                className="w-full sm:w-auto px-10 rounded-2xl font-black shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
               >
                {pending ? (
                  <Loader2 className="size-5 animate-spin mr-2" />
                ) : (
                  <Store className="size-5 mr-2" />
                )}
                Lưu cấu hình ngay
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-bold text-foreground/80 ml-1 uppercase tracking-wider">{label}</Label>
        {hint && <span className="text-[10px] text-muted-foreground font-medium">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function AssetCard({
  kind,
  label,
  hint,
  currentUrl,
}: {
  kind: "logo" | "favicon";
  label: string;
  hint: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dung lượng file tối đa là 2MB");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    startTransition(async () => {
      const res = await uploadAsset(fd);
      if (res.ok) {
        toast.success("Tải lên thành công");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi khi tải ảnh");
      }
    });
  }

  function onClear() {
    startTransition(async () => {
      const res = await clearAsset(kind);
      if (res.ok) {
        toast.success("Đã xóa ảnh hiện tại");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi khi xóa");
      }
    });
  }

  return (
    <Card className="border border-border/80 shadow-md rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm group hover:border-primary/20 transition-all">
      <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="aspect-video bg-muted/20 hover:bg-muted/30 rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden transition-all relative group/img shadow-inner cursor-pointer" onClick={() => inputRef.current?.click()}>
          {currentUrl ? (
            <div className="relative w-full h-full p-4 flex items-center justify-center">
              <Image
                src={currentUrl}
                alt={label}
                width={200}
                height={120}
                className="object-contain max-h-32 rounded-lg transition-transform duration-500 group-hover/img:scale-110"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                 <Upload className="size-8 text-white" />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground flex flex-col items-center gap-3">
              <div className="size-12 rounded-full bg-background flex items-center justify-center border shadow-sm">
                <Upload className="size-5 text-muted-foreground/60" />
              </div>
              <span className="font-bold">Chọn ảnh tải lên</span>
            </div>
          )}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground font-medium px-1">{hint}</p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="flex-1 rounded-xl border-border hover:bg-primary/5 hover:border-primary/40 transition-all font-bold"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin mr-2" />
            ) : (
              <Upload className="size-3.5 mr-2" />
            )}
            Tải lên
          </Button>
          {currentUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              disabled={pending}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
