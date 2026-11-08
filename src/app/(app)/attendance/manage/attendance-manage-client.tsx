"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  Plus,
  Edit2,
  Building2,
  MapPin,
  HelpCircle,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
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

  const filtered = records.filter((r) => {
    if (filterUser !== "all" && r.userId !== filterUser) return false;
    if (filterBranch !== "all" && r.branchName !== filterBranch) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
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

  // Today metrics
  const totalRecords = records.length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const incompleteCount = records.filter((r) => !r.checkOutTime).length;
  const earlyLeaveCount = records.filter((r) => r.status === "early_leave").length;

  function handleOpenCreate() {
    setEditingRecord(null);
    setFormUserId(users[0]?.id || "");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
    setFormCheckIn(settings.workStartTime || "08:00");
    setFormCheckOut(settings.workEndTime || "17:30");
    setFormStatus("present");
    setFormNote("Admin tạo bổ sung");
    setOpenAdjustDialog(true);
  }

  function handleOpenEdit(r: ManageAttendanceRow) {
    setEditingRecord(r);
    setFormUserId(r.userId);
    setFormDate(r.dateStr);
    setFormCheckIn(r.checkInTime);
    setFormCheckOut(r.checkOutTime || settings.workEndTime || "17:30");
    setFormStatus(r.status === "incomplete" ? "present" : r.status);
    setFormNote(r.adjustmentNote || "Admin duyệt bổ sung");
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
        toast.success(editingRecord ? "Đã cập nhật giờ công thành công" : "Đã tạo chấm công bù thành công");
        setOpenAdjustDialog(false);
        // Refresh local view
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold px-2.5 py-0.5">
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
              Theo dõi giờ vào ra, định vị GPS, phê duyệt các ca quên check-out và quản lý kỷ luật đi muộn / về sớm.
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

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-4">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Tổng Lượt Chấm Công
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalRecords} <span className="text-xs font-normal text-muted-foreground">lượt</span>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-4">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            Lượt Đi Muộn
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {lateCount} <span className="text-xs font-normal text-muted-foreground">lượt</span>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-4">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Chưa Check-out
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {incompleteCount} <span className="text-xs font-normal text-muted-foreground">ca</span>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-4">
          <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            Lượt Về Sớm
          </div>
          <div className="text-2xl font-black text-orange-600 mt-1">
            {earlyLeaveCount} <span className="text-xs font-normal text-muted-foreground">lượt</span>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-4">
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

            <SelectField
              value={filterStatus}
              onValueChange={setFilterStatus}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "present", label: "Đúng giờ" },
                { value: "late", label: "Đi muộn" },
                { value: "early_leave", label: "Về sớm" },
                { value: "incomplete", label: "Chưa kết ca" },
              ]}
              className="w-40 h-9 text-xs"
            />
          </div>

          <div className="text-xs font-semibold text-muted-foreground">
            Hiển thị <strong>{filtered.length}</strong> kết quả
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Nhân viên</th>
                <th className="py-3.5 px-4">Ngày</th>
                <th className="py-3.5 px-4">Vào ca (Check-in)</th>
                <th className="py-3.5 px-4">Tan ca (Check-out)</th>
                <th className="py-3.5 px-4 text-center">Tổng giờ</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ghi chú / Giải trình</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy bản ghi chấm công nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <div>{r.userName}</div>
                      <div className="text-[10px] text-muted-foreground">{r.branchName}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium">
                      {r.dateStr}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold">{r.checkInTime}</div>
                      {r.checkInDistance !== null && r.checkInDistance !== undefined && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-2.5 text-blue-500" />
                          Cách {r.checkInDistance}m
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {r.checkOutTime ? (
                        <>
                          <div className="font-mono font-bold">{r.checkOutTime}</div>
                          {r.checkOutDistance !== null && r.checkOutDistance !== undefined && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-2.5 text-blue-500" />
                              Cách {r.checkOutDistance}m
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-rose-500 font-bold italic">Chưa check-out</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {r.workMinutes > 0 ? `${Math.floor(r.workMinutes / 60)}h ${r.workMinutes % 60}m` : "—"}
                    </td>

                    <td className="py-3 px-4">
                      {r.status === "present" && (
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px]">
                          Đúng giờ
                        </Badge>
                      )}
                      {r.status === "late" && (
                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 text-[10px]">
                          Muộn {r.lateMinutes}p
                        </Badge>
                      )}
                      {r.status === "early_leave" && (
                        <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 text-[10px]">
                          Về sớm
                        </Badge>
                      )}
                      {r.status === "incomplete" && (
                        <Badge variant="destructive" className="text-[10px]">
                          Chưa kết ca
                        </Badge>
                      )}
                      {r.adjustedBy && (
                        <Badge variant="outline" className="text-[10px] ml-1 border-purple-300 text-purple-700 dark:text-purple-300">
                          Đã sửa
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate">
                      {r.earlyReason && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                          Về sớm: {r.earlyReason}
                        </div>
                      )}
                      {r.note && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          Giải trình: {r.note}
                        </div>
                      )}
                      {r.adjustmentNote && (
                        <div className="text-[10px] text-purple-600 dark:text-purple-400 truncate">
                          Admin duyệt: {r.adjustmentNote} ({r.adjustedBy})
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(r)}
                        className="rounded-xl h-7 px-2.5 text-xs font-semibold"
                      >
                        <Edit2 className="size-3 mr-1" />
                        Duyệt / Sửa
                      </Button>
                    </td>
                  </tr>
                ))
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
              {editingRecord ? "Duyệt & Điều Chỉnh Giờ Công" : "Tạo Chấm Công Bổ Sung"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Điều chỉnh giờ vào/ra, trạng thái và ghi nhận lý do vào hồ sơ nhân viên.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground">Nhân viên</label>
              <SelectField
                value={formUserId}
                onValueChange={setFormUserId}
                options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))}
                disabled={!!editingRecord}
                className="w-full h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Ngày chấm công</label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={!!editingRecord}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Giờ vào (Check-in)</label>
                <Input
                  type="time"
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                  className="rounded-xl h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Giờ ra (Check-out)</label>
                <Input
                  type="time"
                  value={formCheckOut}
                  onChange={(e) => setFormCheckOut(e.target.value)}
                  className="rounded-xl h-9 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Trạng thái ghi nhận</label>
              <SelectField
                value={formStatus}
                onValueChange={setFormStatus}
                options={[
                  { value: "present", label: "Đúng giờ (present)" },
                  { value: "late", label: "Đi muộn (late)" },
                  { value: "early_leave", label: "Về sớm (early_leave)" },
                  { value: "adjusted", label: "Đã duyệt điều chỉnh (adjusted)" },
                ]}
                className="w-full h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Ghi chú duyệt của Admin</label>
              <Textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Ví dụ: Nhân viên báo quên checkout, đã xác minh có mặt đến 18:00..."
                rows={2}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenAdjustDialog(false)}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveAdjustment}
              disabled={pending}
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {pending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Lưu Thay Đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
