import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getSettings } from "@/lib/settings";
import { AttendanceManageClient } from "./attendance-manage-client";

export default async function AttendanceManagePage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/attendance");
  }

  const settings = await getSettings();

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [rawRecords, users, branches] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: { gte: firstDayOfMonth },
      },
      include: {
        user: true,
        branch: true,
      },
      orderBy: [
        { date: "desc" },
        { checkInTime: "desc" },
      ],
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, branchId: true },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      select: { id: true, name: true },
      orderBy: { isMain: "desc" },
    }),
  ]);

  const records = rawRecords.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    branchName: r.branch?.name || "Trụ sở chính",
    dateStr: format(new Date(r.date), "yyyy-MM-dd"),
    checkInTime: format(new Date(r.checkInTime), "HH:mm"),
    checkInRaw: r.checkInTime.toISOString(),
    checkInDistance: r.checkInDistance,
    checkOutTime: r.checkOutTime ? format(new Date(r.checkOutTime), "HH:mm") : null,
    checkOutRaw: r.checkOutTime ? r.checkOutTime.toISOString() : null,
    checkOutDistance: r.checkOutDistance,
    earlyReason: r.earlyReason,
    workMinutes: r.workMinutes,
    lateMinutes: r.lateMinutes,
    status: r.status,
    note: r.note,
    adjustedBy: r.adjustedBy,
    adjustmentNote: r.adjustmentNote,
  }));

  return (
    <AttendanceManageClient
      records={records}
      users={users}
      branches={branches}
      settings={{
        workStartTime: settings.workStartTime || "08:00",
        workEndTime: settings.workEndTime || "17:30",
        allowedLateMinutesPerMonth: settings.allowedLateMinutesPerMonth ?? 60,
        standardWorkingDaysPerMonth: settings.standardWorkingDaysPerMonth ?? 26,
        defaultGpsRadius: settings.defaultGpsRadius ?? 150,
      }}
    />
  );
}
