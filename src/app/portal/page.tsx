import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ClipboardList,
  Settings,
  Sparkles,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const settings = await getSettings();

  // Find user and their branch
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { branch: true },
  });

  if (!user) redirect("/login");

  let branch = user.branch;
  if (!branch) {
    branch =
      (await prisma.branch.findFirst({ where: { isMain: true } })) ||
      (await prisma.branch.findFirst());
  }

  // Today normalized date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // First day of current month
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthFirstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [todayRecord, monthRecords] = await Promise.all([
    prisma.attendance.findFirst({
      where: {
        userId: session.id,
        date: today,
      },
    }),
    prisma.attendance.findMany({
      where: {
        userId: session.id,
        date: {
          gte: firstDayOfMonth,
          lt: nextMonthFirstDay,
        },
      },
    }),
  ]);

  const totalWorkedDays = monthRecords.filter(
    (r) => r.workMinutes > 0 || r.checkInTime
  ).length;
  const totalLateMinutes = monthRecords.reduce(
    (sum, r) => sum + (r.lateMinutes || 0),
    0
  );
  const allowedLate = settings.allowedLateMinutesPerMonth ?? 60;
  const standardDays = settings.standardWorkingDaysPerMonth ?? 26;
  const lateLeft = Math.max(0, allowedLate - totalLateMinutes);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs font-semibold px-2.5 py-0.5">
                Cổng Nhân Sự & Kỹ Thuật (app)
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
              Ca làm việc:{" "}
              <strong className="text-white">{settings.workStartTime || "08:00"}</strong> –{" "}
              <strong className="text-white">{settings.workEndTime || "17:30"}</strong>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center bg-slate-800/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/80 shrink-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="size-3.5 text-blue-400" />
              Hôm nay
            </div>
            <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {format(now, "EEEE, dd/MM/yyyy", { locale: vi })}
            </div>
          </div>
        </div>
      </div>

      {/* Today Status Widget */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  todayRecord?.checkOutTime
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    : todayRecord
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 animate-pulse"
                    : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                }`}
              >
                {todayRecord?.checkOutTime ? (
                  <CheckCircle2 className="size-7" />
                ) : todayRecord ? (
                  <Clock className="size-7" />
                ) : (
                  <MapPin className="size-7" />
                )}
              </div>

              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Trạng thái làm việc hôm nay
                </div>
                <div className="text-lg font-black text-foreground mt-0.5">
                  {todayRecord?.checkOutTime ? (
                    "Đã hoàn thành ca làm việc"
                  ) : todayRecord ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      Đang trong ca làm việc (Vào ca:{" "}
                      {format(new Date(todayRecord.checkInTime), "HH:mm")})
                    </span>
                  ) : (
                    "Chưa vào ca làm việc"
                  )}
                </div>
                {todayRecord?.lateMinutes ? (
                  <p className="text-xs text-rose-600 font-bold mt-0.5">
                    Ghi nhận đi muộn {todayRecord.lateMinutes} phút
                  </p>
                ) : null}
              </div>
            </div>

            <Link href="/attendance">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-2xl h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20"
              >
                {todayRecord?.checkOutTime
                  ? "Xem Chi Tiết Chấm Công"
                  : todayRecord
                  ? "Check-out Kết Ca"
                  : "Chấm Công GPS (Check-in)"}
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Monthly KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Ngày công tháng {now.getMonth() + 1}
            </span>
            <Calendar className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-foreground">{totalWorkedDays}</span>
            <span className="text-xs text-muted-foreground font-semibold">
              / {standardDays} công chuẩn
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (totalWorkedDays / standardDays) * 100)}%`,
              }}
            />
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Tổng phút đi muộn
            </span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-rose-600">{totalLateMinutes}</span>
            <span className="text-xs text-muted-foreground font-semibold">phút</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {totalLateMinutes === 0
              ? "Tuyệt vời! Không bị muộn phút nào"
              : `Đã tích lũy trong tháng ${now.getMonth() + 1}`}
          </p>
        </Card>

        <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Hạn mức muộn còn lại
            </span>
            <AlertTriangle className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-600">{lateLeft}</span>
            <span className="text-xs text-muted-foreground font-semibold">
              / {allowedLate} phút cho phép
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {lateLeft > 0 ? "Vẫn trong định mức quy định" : "Đã vượt quá hạn mức cho phép!"}
          </p>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Chức năng phân hệ Nhân sự & Kỹ thuật
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Chấm công */}
          <Link href="/attendance" className="group">
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all p-5 h-full flex flex-col justify-between">
              <div>
                <div className="size-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <MapPin className="size-6" />
                </div>
                <h3 className="font-extrabold text-base text-foreground group-hover:text-blue-600 transition-colors">
                  Chấm Công Điện Tử GPS
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Định vị khoảng cách tới cửa hàng, check-in vào ca, check-out kết ca, và xem toàn bộ lịch sử ngày công.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-blue-600 gap-1">
                <span>Vào chấm công</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          {/* Card 2: Bảng công nhân sự (Admin) */}
          {user.role === "admin" && (
            <Link href="/manage" className="group">
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-md transition-all p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <ClipboardList className="size-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-indigo-600 transition-colors">
                    Bảng Chấm Công Nhân Sự
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Dành cho Quản lý: Xem tổng hợp công toàn bộ nhân viên, duyệt giải trình quên checkout và điều chỉnh giờ làm.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 gap-1">
                  <span>Quản lý bảng công</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          )}

          {/* Card 3: Cài đặt Ca & GPS (Admin) */}
          {user.role === "admin" && (
            <Link href="/settings" className="group">
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-slate-400/50 hover:shadow-md transition-all p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="size-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Settings className="size-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-blue-600 transition-colors">
                    Cài Đặt Ca Làm & GPS
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Thiết lập giờ vào ca, tan ca, hạn mức đi muộn, bán kính GPS cửa hàng và lấy tọa độ GPS tự động 1-click.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 gap-1">
                  <span>Mở cài đặt</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          )}

          {/* Card 4: Nhận máy di động (Giai đoạn 2 Preview) */}
          <div className="relative group opacity-85">
            <Card className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone className="size-6" />
                  </div>
                  <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-300/30 text-[10px] font-bold">
                    Giai đoạn 2
                  </Badge>
                </div>
                <h3 className="font-extrabold text-base text-foreground">
                  Tiếp Nhận Máy Tại Nhà / Di Động
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Quét mã vạch IMEI camera, chụp ảnh tình trạng ngoại quan lưu vào phiếu, và khách hàng ký tên trực tiếp trên màn hình.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-muted-foreground">
                Sẵn sàng phát triển tiếp theo
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
