"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Calendar,
  AlertCircle,
  HelpCircle,
  Compass,
  Building2,
  Send,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { checkInAction, checkOutAction, submitExplanationAction } from "./actions";
import { calculateDistanceMeters, formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";

type AttendanceRecord = {
  id: string;
  date: Date | string;
  checkInTime: Date | string;
  checkInDistance?: number | null;
  checkOutTime?: Date | string | null;
  checkOutDistance?: number | null;
  earlyReason?: string | null;
  workMinutes: number;
  lateMinutes: number;
  status: string;
  note?: string | null;
  adjustedBy?: string | null;
  adjustmentNote?: string | null;
};

type BranchInfo = {
  id: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters: number;
} | null;

export function AttendanceClient({
  user,
  branch,
  todayRecord: initialTodayRecord,
  history,
  settings,
}: {
  user: { id: string; name: string; email: string; role: string };
  branch: BranchInfo;
  todayRecord: AttendanceRecord | null;
  history: AttendanceRecord[];
  settings: {
    workStartTime: string;
    workEndTime: string;
    allowedLateMinutesPerMonth: number;
    standardWorkingDaysPerMonth: number;
    defaultGpsRadius: number;
  };
}) {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(initialTodayRecord);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [pending, startTransition] = useTransition();

  // Dialog for early check-out reason
  const [openEarlyDialog, setOpenEarlyDialog] = useState(false);
  const [earlyReason, setEarlyReason] = useState("");

  // Dialog for explanation note
  const [openExplainDialog, setOpenExplainDialog] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [explainNote, setExplainNote] = useState("");

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get GPS function
  function getGpsLocation() {
    if (!navigator.geolocation) {
      setGpsError("Trình duyệt không hỗ trợ Geolocation");
      return;
    }
    setLoadingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCoords({ lat: userLat, lng: userLng });
        setLoadingGps(false);

        if (branch?.latitude && branch?.longitude) {
          const dist = calculateDistanceMeters(
            userLat,
            userLng,
            branch.latitude,
            branch.longitude
          );
          setCurrentDistance(dist);
        }
      },
      (err) => {
        setLoadingGps(false);
        console.warn("GPS error:", err);
        setGpsError(
          err.code === 1
            ? "Vui lòng cho phép quyền truy cập vị trí trên trình duyệt"
            : "Không thể lấy tín hiệu GPS, vui lòng thử lại"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    getGpsLocation();
  }, [branch]);

  const allowedRadius = branch?.radiusMeters || settings.defaultGpsRadius || 150;
  const isWithinRadius =
    currentDistance === null || !branch?.latitude || !branch?.longitude
      ? true
      : currentDistance <= allowedRadius;

  // Monthly stats calculations
  const totalWorkedDays = history.filter((r) => r.workMinutes > 0 || r.checkInTime).length;
  const totalLateMinutes = history.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
  const lateMinutesLeft = Math.max(0, settings.allowedLateMinutesPerMonth - totalLateMinutes);

  // Time calculations
  function handleCheckIn() {
    if (!coords) {
      toast.error("Đang định vị GPS, vui lòng thử lại sau vài giây...");
      getGpsLocation();
      return;
    }

    if (!isWithinRadius && branch?.latitude && branch?.longitude) {
      toast.error(
        `Bạn đang ở ngoài phạm vi (${formatDistance(currentDistance || 0)}). Bán kính cho phép là ${allowedRadius}m.`
      );
      return;
    }

    startTransition(async () => {
      const res = await checkInAction({
        lat: coords.lat,
        lng: coords.lng,
      });

      if (res.ok) {
        setTodayRecord(res.record as any);
        if (res.lateMinutes > 0) {
          toast.warning(`Check-in thành công (Đi muộn ${res.lateMinutes} phút)`);
        } else {
          toast.success("Check-in vào ca thành công! Chúc bạn làm việc tốt.");
        }
      } else {
        toast.error(res.error || "Không thể check-in");
      }
    });
  }

  function handleCheckOutClick() {
    if (!coords) {
      toast.error("Đang định vị GPS, vui lòng thử lại sau vài giây...");
      getGpsLocation();
      return;
    }

    // Check if early
    const [eh, em] = (settings.workEndTime || "17:30").split(":").map(Number);
    const endMins = (eh || 17) * 60 + (em || 30);
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();

    if (nowMins < endMins) {
      setOpenEarlyDialog(true);
      return;
    }

    confirmCheckOut();
  }

  function confirmCheckOut(reason?: string) {
    if (!coords) return;

    startTransition(async () => {
      const res = await checkOutAction({
        lat: coords.lat,
        lng: coords.lng,
        earlyReason: reason,
      });

      if (res.ok) {
        setTodayRecord(res.record as any);
        setOpenEarlyDialog(false);
        setEarlyReason("");
        toast.success("Check-out kết ca thành công!");
      } else {
        if (res.requireReason) {
          setOpenEarlyDialog(true);
        }
        toast.error(res.error || "Không thể check-out");
      }
    });
  }

  function submitExplanation() {
    if (!selectedRecordId || !explainNote.trim()) return;

    startTransition(async () => {
      const res = await submitExplanationAction(selectedRecordId, explainNote);
      if (res.ok) {
        toast.success("Đã gửi giải trình cho quản lý");
        setOpenExplainDialog(false);
        setExplainNote("");
      } else {
        toast.error(res.error || "Lỗi gửi giải trình");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Banner & Live Clock */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs font-semibold px-2.5 py-0.5">
                Chấm Công Điện Tử GPS
              </Badge>
              {branch && (
                <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                  <Building2 className="size-3.5 text-blue-400" />
                  {branch.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Xin chào, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Ca làm việc quy định: <strong className="text-white">{settings.workStartTime}</strong> –{" "}
              <strong className="text-white">{settings.workEndTime}</strong>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center bg-slate-800/80 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-700/80 shrink-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="size-3.5 text-blue-400 animate-spin-slow" />
              Thời gian thực
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
              {format(currentTime, "HH:mm:ss")}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {format(currentTime, "EEEE, 'ngày' dd/MM/yyyy", { locale: vi })}
            </div>
          </div>
        </div>
      </div>

      {/* GPS Status & Live Radar */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                  isWithinRadius
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                )}
              >
                <Compass className={cn("size-5", loadingGps && "animate-spin")} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Trạng thái định vị GPS:</span>
                  {loadingGps ? (
                    <Badge variant="outline" className="text-[10px] animate-pulse">
                      Đang lấy tọa độ...
                    </Badge>
                  ) : gpsError ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Lỗi GPS
                    </Badge>
                  ) : isWithinRadius ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold border-none">
                      Hợp lệ (Trong cửa hàng)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      Ngoài phạm vi ({formatDistance(currentDistance || 0)})
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {branch?.latitude && branch?.longitude ? (
                    currentDistance !== null ? (
                      <>
                        Khoảng cách hiện tại:{" "}
                        <strong className={isWithinRadius ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}>
                          {formatDistance(currentDistance)}
                        </strong>{" "}
                        (Tối đa cho phép: {allowedRadius}m)
                      </>
                    ) : (
                      "Chưa xác định khoảng cách"
                    )
                  ) : (
                    "Chi nhánh chưa gán tọa độ GPS (Được phép chấm công mọi vị trí)"
                  )}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={getGpsLocation}
              disabled={loadingGps}
              className="rounded-xl text-xs font-semibold h-8"
            >
              <Compass className="size-3.5 mr-1" />
              Làm mới GPS
            </Button>
          </div>

          {gpsError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Check-In / Check-Out Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Action Buttons */}
        <div className="md:col-span-7 space-y-4">
          <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-6 text-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Điểm Danh Hôm Nay ({format(currentTime, "dd/MM/yyyy")})
            </h2>

            {!todayRecord ? (
              /* Case 1: Not checked in yet */
              <div className="space-y-4 py-4">
                <div className="size-20 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/60 border-2 border-dashed border-blue-400 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <MapPin className="size-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Bạn chưa vào ca</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bấm nút bên dưới để ghi nhận giờ vào ca làm việc bằng định vị GPS
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleCheckIn}
                  disabled={pending || loadingGps}
                  className="w-full max-w-sm h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-lg shadow-blue-500/25 active:scale-98 transition-all"
                >
                  {pending ? (
                    <Loader2 className="size-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="size-5 mr-2" />
                  )}
                  BẮT ĐẦU VÀO CA (CHECK-IN)
                </Button>
              </div>
            ) : !todayRecord.checkOutTime ? (
              /* Case 2: Checked in, working */
              <div className="space-y-5 py-4">
                <div className="size-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-pulse">
                  <Clock className="size-8" />
                </div>

                <div>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 text-xs px-3 py-1 font-bold">
                    ĐANG TRONG CA LÀM VIỆC
                  </Badge>
                  <div className="text-sm font-medium text-muted-foreground mt-2">
                    Giờ vào:{" "}
                    <strong className="text-foreground font-mono font-bold">
                      {format(new Date(todayRecord.checkInTime), "HH:mm")}
                    </strong>
                    {todayRecord.lateMinutes > 0 ? (
                      <span className="text-rose-600 font-bold ml-2">
                        (Đi muộn {todayRecord.lateMinutes} phút)
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold ml-2">(Đúng giờ)</span>
                    )}
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleCheckOutClick}
                  disabled={pending || loadingGps}
                  className="w-full max-w-sm h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base shadow-lg shadow-rose-500/25 active:scale-98 transition-all"
                >
                  {pending ? (
                    <Loader2 className="size-5 animate-spin mr-2" />
                  ) : (
                    <LogOut className="size-5 mr-2" />
                  )}
                  KẾT THÚC CA (CHECK-OUT)
                </Button>
              </div>
            ) : (
              /* Case 3: Checked out, finished */
              <div className="space-y-4 py-4">
                <div className="size-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Ca làm việc đã kết thúc</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bạn đã hoàn thành ca làm việc ngày hôm nay.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Vào ca</span>
                    <span className="font-mono font-bold text-foreground">
                      {format(new Date(todayRecord.checkInTime), "HH:mm")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Tan ca</span>
                    <span className="font-mono font-bold text-foreground">
                      {format(new Date(todayRecord.checkOutTime), "HH:mm")}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t font-semibold text-blue-600 dark:text-blue-400">
                    Tổng giờ làm: {Math.floor(todayRecord.workMinutes / 60)}h{" "}
                    {todayRecord.workMinutes % 60}m
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Monthly KPI & Attendance Rules */}
        <div className="md:col-span-5 space-y-4">
          <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Calendar className="size-4 text-blue-500" />
                Thống Kê Tháng Này
              </h3>
              <Badge variant="outline" className="text-[11px] font-mono">
                {format(currentTime, "MM/yyyy")}
              </Badge>
            </div>

            <div className="space-y-3">
              {/* Working days metric */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Số ngày công thực tế</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {totalWorkedDays} / {settings.standardWorkingDaysPerMonth} công
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (totalWorkedDays / (settings.standardWorkingDaysPerMonth || 26)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Late minutes metric */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Số phút đi muộn tích lũy</span>
                  <span
                    className={cn(
                      "font-bold font-mono",
                      totalLateMinutes > settings.allowedLateMinutesPerMonth
                        ? "text-rose-600"
                        : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {totalLateMinutes} / {settings.allowedLateMinutesPerMonth} phút
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      totalLateMinutes > settings.allowedLateMinutesPerMonth ? "bg-rose-600" : "bg-amber-500"
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        (totalLateMinutes / (settings.allowedLateMinutesPerMonth || 60)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
                  <span>Hạn mức tối đa: {settings.allowedLateMinutesPerMonth} phút</span>
                  <span>Còn lại: {lateMinutesLeft} phút</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>Bán kính chấm công chuẩn: <strong>{allowedRadius}m</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-amber-500" />
                <span>Về sớm hơn {settings.workEndTime} cần ghi rõ lý do.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Attendance History */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-foreground">
            Lịch Sử Chấm Công Tháng Này ({history.length} lượt)
          </CardTitle>
          <CardDescription className="text-xs">
            Theo dõi chi tiết giờ vào, giờ ra và trạng thái ca làm việc
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Chưa có dữ liệu chấm công trong tháng này.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((record) => {
                const dateObj = new Date(record.date);
                const isIncomplete = !record.checkOutTime;

                return (
                  <div
                    key={record.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-center min-w-[50px]">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">
                          {format(dateObj, "EEE", { locale: vi })}
                        </div>
                        <div className="text-base font-black font-mono">
                          {format(dateObj, "dd")}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {format(dateObj, "dd/MM/yyyy")}
                          </span>
                          {record.status === "present" && (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] border-emerald-200">
                              Đúng giờ
                            </Badge>
                          )}
                          {record.status === "late" && (
                            <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] border-amber-200">
                              Muộn {record.lateMinutes}p
                            </Badge>
                          )}
                          {record.status === "early_leave" && (
                            <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 text-[10px] border-orange-200">
                              Về sớm
                            </Badge>
                          )}
                          {isIncomplete && (
                            <Badge variant="destructive" className="text-[10px]">
                              Chưa kết ca
                            </Badge>
                          )}
                          {record.adjustedBy && (
                            <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700 dark:text-purple-300">
                              Admin duyệt
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                          <span>
                            Vào: <strong className="text-foreground font-mono">{format(new Date(record.checkInTime), "HH:mm")}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Ra:{" "}
                            <strong className="text-foreground font-mono">
                              {record.checkOutTime ? format(new Date(record.checkOutTime), "HH:mm") : "—"}
                            </strong>
                          </span>
                          {record.workMinutes > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                Tổng giờ: <strong className="text-blue-600 dark:text-blue-400 font-bold">{Math.floor(record.workMinutes / 60)}h {record.workMinutes % 60}m</strong>
                              </span>
                            </>
                          )}
                        </div>

                        {record.earlyReason && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                            Lý do về sớm: {record.earlyReason}
                          </div>
                        )}

                        {record.note && (
                          <div className="text-[11px] text-slate-500 italic">
                            Ghi chú: {record.note}
                          </div>
                        )}
                      </div>
                    </div>

                    {isIncomplete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecordId(record.id);
                          setExplainNote(record.note || "");
                          setOpenExplainDialog(true);
                        }}
                        className="rounded-xl text-xs font-semibold self-start sm:self-center shrink-0 border-amber-300 text-amber-700 dark:text-amber-300"
                      >
                        <HelpCircle className="size-3.5 mr-1" />
                        Báo quên check-out
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Early Check-Out Dialog */}
      <Dialog open={openEarlyDialog} onOpenChange={setOpenEarlyDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5" />
              Xác Nhận Về Sớm
            </DialogTitle>
            <DialogDescription className="text-xs">
              Giờ tan ca quy định là <strong>{settings.workEndTime}</strong>. Bạn đang check-out sớm hơn, vui lòng nhập lý do để quản lý phê duyệt.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-xs font-bold text-foreground">
              Lý do về sớm <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={earlyReason}
              onChange={(e) => setEarlyReason(e.target.value)}
              placeholder="Ví dụ: Có việc gia đình đột xuất, đi gặp khách hàng..."
              rows={3}
              className="rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenEarlyDialog(false)}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              onClick={() => confirmCheckOut(earlyReason)}
              disabled={!earlyReason.trim() || pending}
              className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {pending ? <Loader2 className="size-4 animate-spin mr-1" /> : <Send className="size-4 mr-1" />}
              Gửi Lý Do & Check-out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Explanation Dialog */}
      <Dialog open={openExplainDialog} onOpenChange={setOpenExplainDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="size-5 text-blue-500" />
              Giải Trình Quên Check-out
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gửi ghi chú giải trình lý do quên check-out để Quản lý duyệt bù giờ công cho bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-xs font-bold text-foreground">
              Nội dung giải trình <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={explainNote}
              onChange={(e) => setExplainNote(e.target.value)}
              placeholder="Ví dụ: Em làm đến 18:00 máy hết pin quên bấm, nhờ anh/chị duyệt giúp..."
              rows={3}
              className="rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenExplainDialog(false)}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              onClick={submitExplanation}
              disabled={!explainNote.trim() || pending}
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {pending ? <Loader2 className="size-4 animate-spin mr-1" /> : <Send className="size-4 mr-1" />}
              Gửi Giải Trình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
