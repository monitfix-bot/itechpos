"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  Edit2,
  Building2,
  MapPin,
  HelpCircle,
  Loader2,
  AlertCircle,
  FileCheck2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import { toast } from "sonner";
import { adminAdjustAttendanceAction } from "../actions";
import { cn } from "@/lib/utils";

type ManageAttendanceRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  branchName: string;
  dateStr: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm
  checkInRaw: string;
  checkInDistance?: number | null;
  checkOutTime: string | null; // HH:mm
  checkOutRaw: string | null;
  checkOutDistance?: number | null;
  earlyReason?: string | null;
  workMinutes: number;
  lateMinutes: number;
  status: string;
  note?: string | null;
  adjustedBy?: string | null;
  adjustmentNote?: string | null;
};

type UserOption = {
  id: string;
  name: string;
  role: string;
  branchId?: string | null;
};

type BranchOption = {
  id: string;
  name: string;
};

export function AttendanceManageClient({
  records: initialRecords,
  users,
  branches,
  settings,
}: {
  records: ManageAttendanceRow[];
  users: UserOption[];
  branches: BranchOption[];
  settings: {
    workStartTime: string;
    workEndTime: string;
    allowedLateMinutesPerMonth: number;
    standardWorkingDaysPerMonth: number;
    defaultGpsRadius: number;
  };
}) {
  const [records, setRecords] = useState<ManageAttendanceRow[]>(initialRecords);
  const [activeTab, setActiveTab] = useState<"all" | "need_action" | "completed" | "abnormal">("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");

  const [pending, startTransition] = useTransition();

  // Dialog for editing / adjusting attendance
  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ManageAttendanceRow | null>(null);

  // Form states
  const [formUserId, setFormUserId] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formCheckIn, setFormCheckIn] = useState("08:00");
  const [formCheckOut, setFormCheckOut] = useState("17:30");
  const [formStatus, setFormStatus] = useState("present");
  const [formNote, setFormNote] = useState("");

  // Metrics
  const totalRecords = records.length;
  const needActionRecords = records.filter(
    (r) => !r.checkOutTime || r.status === "incomplete" || (r.note && !r.adjustedBy)
  );
  const completedRecords = records.filter((r) => r.checkOutTime && r.status !== "incomplete");
  const lateRecords = records.filter((r) => r.status === "late");
  const earlyRecords = records.filter((r) => r.status === "early_leave");

  const filtered = records.filter((r) => {
    // 1. Tab filter
    if (activeTab === "need_action") {
      const isNeed = !r.checkOutTime || r.status === "incomplete" || (r.note && !r.adjustedBy);
      if (!isNeed) return false;
    } else if (activeTab === "completed") {
      if (!r.checkOutTime || r.status === "incomplete") return false;
    } else if (activeTab === "abnormal") {
      if (r.status !== "late" && r.status !== "early_leave") return false;
    }

    // 2. Dropdown filters
    if (filterUser !== "all" && r.userId !== filterUser) return false;
    if (filterBranch !== "all" && r.branchName !== filterBranch) return false;

    // 3. Search query
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase().trim();
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.branchName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleOpenCreate() {
    setEditingRecord(null);
    setFormUserId(users[0]?.id || "");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
    setFormCheckIn(settings.workStartTime || "08:00");
    setFormCheckOut(settings.workEndTime || "17:30");
    setFormStatus("present");
    setFormNote("Admin tạo chấm công bù");
    setOpenAdjustDialog(true);
  }

  function handleOpenApprove(r: ManageAttendanceRow) {
    setEditingRecord(r);
    setFormUserId(r.userId);
    setFormDate(r.dateStr);
    setFormCheckIn(r.checkInTime);
    setFormCheckOut(r.checkOutTime || settings.workEndTime || "17:30");
    setFormStatus(r.status === "incomplete" ? "present" : r.status);
    setFormNote(r.note ? `Duyệt theo giải trình: ${r.note}` : "Admin duyệt bổ sung giờ ra");
    setOpenAdjustDialog(true);
  }

  function handleSaveAdjustment() {
    if (!formUserId || !formDate || !formCheckIn) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    startTransition(async () => {
      const res = await adminAdjustAttendanceAction({
        attendanceId: editingRecord?.id,
        userId: formUserId,
        dateStr: formDate,
        checkInTime: formCheckIn,
        checkOutTime: formCheckOut,
        status: formStatus,
        adjustmentNote: formNote,
      });

      if (res.ok) {
        toast.success(editingRecord ? "Đã duyệt & cập nhật giờ công thành công" : "Đã tạo chấm công bù thành công");
        setOpenAdjustDialog(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs font-semibold px-2.5 py-0.5">
                Quản Trị Nhân Sự
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                Chuẩn ca: {settings.workStartTime} – {settings.workEndTime}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bảng Tổng Hợp Chấm Công
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl">
              Theo dõi giờ vào ra, định vị GPS. Các ca hoàn thành tự động tính công. Admin chỉ cần duyệt các ca nhân viên quên bấm check-out.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={handleOpenCreate}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/25 px-5 h-11"
            >
              <Plus className="size-4 mr-2" />
              Chấm Công Bổ Sung
            </Button>
          </div>
        </div>
      </div>

      {/* Explainer Card (Khi nào cần duyệt?) */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 p-4 sm:p-5 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-3.5 shadow-2xs">
        <div className="size-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <HelpCircle className="size-5" />
        </div>
        <div className="space-y-1">
          <div className="font-extrabold text-sm text-blue-950 dark:text-blue-200">
            Cơ chế hoạt động & Vai trò của Admin Duyệt Công:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-medium pt-0.5 leading-relaxed">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Ca hoàn thành (Tự động):</strong> Nhân viên tự bấm Check-in & tự bấm Check-out khi hết giờ. Hệ thống tự tính giờ công mà <em>không cần Admin duyệt</em>.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Ca quên Check-out (Cần Admin duyệt):</strong> Nếu nhân viên ra về mà quên bấm kết ca, ca bị treo. Nhân viên gửi giải trình và Admin vào bấm <em>"Duyệt ca này"</em> để bù giờ ra thực tế.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-3xl border p-4 cursor-pointer transition-all shadow-xs",
            activeTab === "all"
              ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-2 ring-blue-600/20"
              : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
          )}
        >
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Tổng Ca Làm</span>
            <Calendar className="size-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalRecords} <span className="text-xs font-normal text-muted-foreground">lượt</span>
          </div>
        </Card>

        <Card
          onClick={() => setActiveTab("need_action")}
          className={cn(
            "rounded-3xl border p-4 cursor-pointer transition-all shadow-xs",
            activeTab === "need_action"
              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500/20"
              : needActionRecords.length > 0
              ? "border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20 hover:border-amber-400"
              : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900"
          )}
        >
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="size-3.5 text-amber-600 animate-pulse" />
              Cần Duyệt / Quên Ra
            </span>
            <Badge className="bg-amber-500 text-white text-[10px] py-0 px-1.5 font-bold">
              {needActionRecords.length}
            </Badge>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {needActionRecords.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">ca chờ duyệt</span>
          </div>
        </Card>

        <Card
          onClick={() => setActiveTab("completed")}
          className={cn(
            "rounded-3xl border p-4 cursor-pointer transition-all shadow-xs",
            activeTab === "completed"
              ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20"
              : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
          )}
        >
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Đã Hoàn Thành
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {completedRecords.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">ca hợp lệ</span>
          </div>
        </Card>

        <Card
          onClick={() => setActiveTab("abnormal")}
          className={cn(
            "rounded-3xl border p-4 cursor-pointer transition-all shadow-xs",
            activeTab === "abnormal"
              ? "border-rose-600 bg-rose-50/40 dark:bg-rose-950/40 ring-2 ring-rose-600/20"
              : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
          )}
        >
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" />
              Đi Muộn / Về Sớm
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {lateRecords.length + earlyRecords.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">lượt</span>
          </div>
        </Card>
      </div>

      {/* Navigation Filter Tabs & Search Bar */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4">
        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Button
            size="sm"
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => setActiveTab("all")}
            className="rounded-xl text-xs font-bold h-8"
          >
            Tất cả ({totalRecords})
          </Button>

          <Button
            size="sm"
            variant={activeTab === "need_action" ? "default" : "outline"}
            onClick={() => setActiveTab("need_action")}
            className={cn(
              "rounded-xl text-xs font-bold h-8",
              activeTab === "need_action"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : needActionRecords.length > 0
                ? "border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                : ""
            )}
          >
            ⚠️ Cần duyệt & Quên ra ({needActionRecords.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === "completed" ? "default" : "outline"}
            onClick={() => setActiveTab("completed")}
            className="rounded-xl text-xs font-bold h-8"
          >
            ✅ Hoàn tất hợp lệ ({completedRecords.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === "abnormal" ? "default" : "outline"}
            onClick={() => setActiveTab("abnormal")}
            className="rounded-xl text-xs font-bold h-8"
          >
            ⏰ Đi muộn / Về sớm ({lateRecords.length + earlyRecords.length})
          </Button>
        </div>

        {/* Dropdown Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 sm:w-64 max-w-xs">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên nhân viên..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="pl-8 text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
              />
            </div>

            <SelectField
              value={filterUser}
              onValueChange={setFilterUser}
              options={[
                { value: "all", label: "Tất cả nhân viên" },
                ...users.map((u) => ({ value: u.id, label: u.name })),
              ]}
              className="w-44 h-9 text-xs"
            />

            {branches.length > 1 && (
              <SelectField
                value={filterBranch}
                onValueChange={setFilterBranch}
                options={[
                  { value: "all", label: "Tất cả chi nhánh" },
                  ...branches.map((b) => ({ value: b.name, label: b.name })),
                ]}
                className="w-40 h-9 text-xs"
              />
            )}
          </div>

          <div className="text-xs font-semibold text-muted-foreground">
            Hiển thị <strong>{filtered.length}</strong> kết quả
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Nhân viên</th>
                <th className="py-3.5 px-4">Ngày</th>
                <th className="py-3.5 px-4">Vào ca (Check-in)</th>
                <th className="py-3.5 px-4">Tan ca (Check-out)</th>
                <th className="py-3.5 px-4 text-center">Tổng giờ</th>
                <th className="py-3.5 px-4">Trạng thái ca</th>
                <th className="py-3.5 px-4">Giải trình & Ghi chú</th>
                <th className="py-3.5 px-4 text-right">Thao tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <FileCheck2 className="size-6" />
                    </div>
                    <div className="font-bold text-sm">Không tìm thấy ca làm việc nào</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Thử chuyển sang tab khác hoặc xóa bộ lọc tìm kiếm
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isPendingApproval =
                    !r.checkOutTime || r.status === "incomplete" || (r.note && !r.adjustedBy);

                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "transition-colors",
                        isPendingApproval
                          ? "bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/50"
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="font-bold text-sm">{r.userName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{r.branchName}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium">
                        {r.dateStr}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-sm">{r.checkInTime}</div>
                        {r.checkInDistance !== null && r.checkInDistance !== undefined && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-2.5 text-blue-500" />
                            Cách {r.checkInDistance}m
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {r.checkOutTime ? (
                          <>
                            <div className="font-mono font-bold text-sm">{r.checkOutTime}</div>
                            {r.checkOutDistance !== null && r.checkOutDistance !== undefined && (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="size-2.5 text-blue-500" />
                                Cách {r.checkOutDistance}m
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1">
                            <Clock className="size-3 shrink-0" />
                            Quên check-out
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        {r.workMinutes > 0 ? `${Math.floor(r.workMinutes / 60)}h ${r.workMinutes % 60}m` : "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        {r.status === "present" && (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px] font-bold">
                            Đúng giờ
                          </Badge>
                        )}
                        {r.status === "late" && (
                          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 text-[10px] font-bold">
                            Muộn {r.lateMinutes}p
                          </Badge>
                        )}
                        {r.status === "early_leave" && (
                          <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 text-[10px] font-bold">
                            Về sớm
                          </Badge>
                        )}
                        {r.status === "incomplete" && (
                          <Badge variant="destructive" className="text-[10px] font-bold">
                            Chưa kết ca
                          </Badge>
                        )}
                        {r.adjustedBy && (
                          <Badge variant="outline" className="text-[10px] ml-1 border-purple-300 text-purple-700 dark:text-purple-300">
                            Đã duyệt bù
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {r.note && (
                          <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                            Giải trình: "{r.note}"
                          </div>
                        )}
                        {r.earlyReason && (
                          <div className="text-[10px] text-orange-700 dark:text-orange-400 mt-0.5">
                            Lý do về sớm: {r.earlyReason}
                          </div>
                        )}
                        {r.adjustmentNote && (
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 mt-0.5">
                            Ghi chú Admin: {r.adjustmentNote} ({r.adjustedBy})
                          </div>
                        )}
                        {!r.note && !r.earlyReason && !r.adjustmentNote && (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPendingApproval ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenApprove(r)}
                            className="rounded-xl h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                          >
                            <CheckCircle2 className="size-3.5 mr-1" />
                            Duyệt ca này
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenApprove(r)}
                            className="rounded-xl h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="size-3 mr-1" />
                            Sửa
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust / Edit Dialog */}
      <Dialog open={openAdjustDialog} onOpenChange={setOpenAdjustDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-5 text-blue-600" />
              {editingRecord
                ? editingRecord.checkOutTime
                  ? "Điều Chỉnh Thông Tin Ca Làm"
                  : "Duyệt Giải Trình & Bổ Sung Giờ Ra"
                : "Tạo Chấm Công Bổ Sung"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingRecord && !editingRecord.checkOutTime
                ? "Nhân viên quên bấm check-out. Điền giờ tan ca thực tế để hoàn tất ngày công."
                : "Điều chỉnh giờ vào/ra, trạng thái và lưu ghi chú vào hồ sơ nhân viên."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {editingRecord?.note && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200">
                <span className="font-bold">Nhân viên giải trình:</span>
                <p className="mt-0.5 italic">"{editingRecord.note}"</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-foreground">Nhân viên</label>
              <SelectField
                value={formUserId}
                onValueChange={setFormUserId}
                options={users.map((u) => ({ value: u.id, label: u.name }))}
                className="w-full h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Ngày làm việc</label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="rounded-xl h-10 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Giờ vào (Check-in)</label>
                <Input
                  type="time"
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                  className="rounded-xl h-10 font-mono text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Giờ ra thực tế (Check-out)</label>
                <Input
                  type="time"
                  value={formCheckOut}
                  onChange={(e) => setFormCheckOut(e.target.value)}
                  className="rounded-xl h-10 font-mono text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Trạng thái công nhận</label>
              <SelectField
                value={formStatus}
                onValueChange={setFormStatus}
                options={[
                  { value: "present", label: "Đúng giờ (Công chuẩn)" },
                  { value: "late", label: "Tính đi muộn" },
                  { value: "early_leave", label: "Tính về sớm" },
                  { value: "incomplete", label: "Giữ chưa kết ca" },
                ]}
                className="w-full h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Ghi chú phê duyệt của Admin</label>
              <Textarea
                placeholder="Nhập ghi chú (VD: Đã xác minh có mặt đến 17:30, đồng ý duyệt công)..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                rows={2}
                className="rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenAdjustDialog(false)}
              className="rounded-xl h-10 text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={handleSaveAdjustment}
              className="rounded-xl h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              XÁC NHẬN DUYỆT CÔNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
