"use client";

import { useState, useTransition } from "react";
import {
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Building2,
  Save,
  Loader2,
  ExternalLink,
  Compass,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updatePortalShiftSettings, updateBranchGpsAction } from "./actions";

type BranchItem = {
  id: string;
  name: string;
  address?: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  isMain: boolean;
};

export function PortalSettingsClient({
  initialSettings,
  branches: initialBranches,
}: {
  initialSettings: {
    workStartTime: string;
    workEndTime: string;
    allowedLateMinutesPerMonth: number;
    standardWorkingDaysPerMonth: number;
    defaultGpsRadius: number;
  };
  branches: BranchItem[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [branches, setBranches] = useState<BranchItem[]>(initialBranches);
  const [pending, startTransition] = useTransition();
  const [locatingBranchId, setLocatingBranchId] = useState<string | null>(null);

  function handleSaveShiftSettings(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updatePortalShiftSettings(settings);
      if (res.ok) {
        toast.success("Đã lưu quy định ca làm & hạn mức đi muộn thành công");
      } else {
        toast.error(res.error || "Lỗi lưu cấu hình ca làm");
      }
    });
  }

  function handleBranchChange(id: string, field: keyof BranchItem, value: any) {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  }

  function handleGetBrowserGps(branchId: string) {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ Geolocation");
      return;
    }

    setLocatingBranchId(branchId);
    toast.info("Đang lấy tọa độ GPS từ thiết bị của bạn...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setBranches((prev) =>
          prev.map((b) => (b.id === branchId ? { ...b, latitude: lat, longitude: lng } : b))
        );
        setLocatingBranchId(null);
        toast.success(`Đã lấy tọa độ GPS: ${lat}, ${lng}`);
      },
      (err) => {
        setLocatingBranchId(null);
        toast.error(
          err.code === 1
            ? "Vui lòng cho phép quyền truy cập vị trí trên trình duyệt"
            : "Không thể lấy tín hiệu GPS, vui lòng kiểm tra kết nối"
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleSaveBranch(branch: BranchItem) {
    startTransition(async () => {
      const res = await updateBranchGpsAction(branch.id, {
        latitude: branch.latitude ? Number(branch.latitude) : null,
        longitude: branch.longitude ? Number(branch.longitude) : null,
        radiusMeters: Number(branch.radiusMeters) || 150,
      });

      if (res.ok) {
        toast.success(`Đã cập nhật tọa độ GPS cho chi nhánh "${branch.name}"`);
      } else {
        toast.error(res.error || "Lỗi cập nhật chi nhánh");
      }
    });
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white text-xs px-2.5 py-0.5">
            Admin Subdomain
          </Badge>
          <span className="text-xs text-muted-foreground font-semibold">
            Cấu hình riêng cho Hệ thống Nhân viên & Kỹ thuật
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Cài Đặt Ca Làm Việc & Định Vị GPS
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Thiết lập giờ vào/tan ca, hạn mức đi muộn hàng tháng, bán kính chấm công và tọa độ vị trí các chi nhánh.
        </p>
      </div>

      {/* Section 1: Shift & Attendance Rules */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                Quy Định Giờ Làm & Hạn Mức Đi Muộn
              </CardTitle>
              <CardDescription className="text-xs">
                Áp dụng tự động để tính số phút đi muộn và yêu cầu lý do khi về sớm
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveShiftSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-blue-500" />
                  Giờ bắt đầu ca làm (Check-in)
                </label>
                <Input
                  type="time"
                  value={settings.workStartTime}
                  onChange={(e) =>
                    setSettings({ ...settings, workStartTime: e.target.value })
                  }
                  required
                  className="rounded-xl h-11 font-mono text-sm font-bold"
                />
                <p className="text-[11px] text-muted-foreground">
                  Check-in sau giờ này sẽ tự động tính là đi muộn. Mặc định: 08:00
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-rose-500" />
                  Giờ kết thúc ca làm (Check-out)
                </label>
                <Input
                  type="time"
                  value={settings.workEndTime}
                  onChange={(e) =>
                    setSettings({ ...settings, workEndTime: e.target.value })
                  }
                  required
                  className="rounded-xl h-11 font-mono text-sm font-bold"
                />
                <p className="text-[11px] text-muted-foreground">
                  Check-out trước giờ này bắt buộc phải nhập lý do về sớm. Mặc định: 17:30
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  Số phút cho phép đi muộn / tháng
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="600"
                    value={settings.allowedLateMinutesPerMonth}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        allowedLateMinutesPerMonth: Number(e.target.value),
                      })
                    }
                    className="rounded-xl h-11 font-mono text-sm font-bold pr-16"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    phút
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Hạn mức tối đa nhân viên được phép trễ trước khi trừ chuyên cần. Mặc định: 60 phút
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-emerald-500" />
                  Số ngày công tiêu chuẩn / tháng
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.standardWorkingDaysPerMonth}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        standardWorkingDaysPerMonth: Number(e.target.value),
                      })
                    }
                    className="rounded-xl h-11 font-mono text-sm font-bold pr-16"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    ngày
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Dùng để hiển thị tỷ lệ hoàn thành công và tính lương (Giai đoạn 3). Mặc định: 26 ngày
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={pending}
                className="rounded-2xl h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Save className="size-4 mr-2" />
                )}
                LƯU QUY ĐỊNH CA LÀM
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 2: Branch GPS Configuration */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                Cấu Hình Tọa Độ GPS Chi Nhánh
              </CardTitle>
              <CardDescription className="text-xs">
                Xác định vị trí chính xác của cửa hàng trên bản đồ. Bán kính mặc định: 150m
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {branches.map((branch) => {
            const hasGps = branch.latitude !== null && branch.longitude !== null;
            const mapsUrl = hasGps
              ? `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
              : null;

            return (
              <div
                key={branch.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-blue-500" />
                    <span className="font-extrabold text-sm text-foreground">
                      {branch.name}
                    </span>
                    {branch.isMain && (
                      <Badge className="bg-blue-600 text-white text-[10px] py-0">
                        Trụ sở chính
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      >
                        <ExternalLink className="size-3" />
                        Xem trên Google Maps
                      </a>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetBrowserGps(branch.id)}
                      disabled={locatingBranchId === branch.id}
                      className="rounded-xl text-xs font-semibold h-8 bg-white dark:bg-slate-900"
                    >
                      {locatingBranchId === branch.id ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <Compass className="size-3 mr-1 text-blue-600" />
                      )}
                      Lấy tọa độ vị trí hiện tại của tôi (GPS)
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      Vĩ độ (Latitude)
                    </label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="VD: 10.867648"
                      value={branch.latitude ?? ""}
                      onChange={(e) =>
                        handleBranchChange(
                          branch.id,
                          "latitude",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      className="rounded-xl h-10 font-mono text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      Kinh độ (Longitude)
                    </label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="VD: 106.741392"
                      value={branch.longitude ?? ""}
                      onChange={(e) =>
                        handleBranchChange(
                          branch.id,
                          "longitude",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      className="rounded-xl h-10 font-mono text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      Bán kính cho phép (Mét)
                    </label>
                    <Input
                      type="number"
                      min="20"
                      max="1000"
                      placeholder="150"
                      value={branch.radiusMeters || 150}
                      onChange={(e) =>
                        handleBranchChange(
                          branch.id,
                          "radiusMeters",
                          Number(e.target.value) || 150
                        )
                      }
                      className="rounded-xl h-10 font-mono text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-muted-foreground">
                    {hasGps ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        Đã kích hoạt định vị bán kính {branch.radiusMeters || 150}m
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">
                        Chưa gán GPS (nhân viên có thể chấm công mọi vị trí)
                      </span>
                    )}
                  </p>

                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleSaveBranch(branch)}
                    className="rounded-xl h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    {pending ? (
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Save className="size-3.5 mr-1.5" />
                    )}
                    LƯU TỌA ĐỘ
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
