"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { calculateDistanceMeters, formatDistance } from "@/lib/geo";
import { revalidatePath } from "next/cache";

function getNormalizedToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getMyTodayAttendance() {
  const session = await getSession();
  if (!session) return null;

  const today = getNormalizedToday();
  const attendance = await prisma.attendance.findFirst({
    where: {
      userId: session.id,
      date: today,
    },
    include: {
      branch: true,
    },
  });

  return attendance;
}

export async function checkInAction(input: {
  lat: number;
  lng: number;
  note?: string;
}) {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false as const, error: "Vui lòng đăng nhập" };
    }

    const today = getNormalizedToday();
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: session.id,
        date: today,
      },
    });

    if (existing && existing.checkInTime) {
      return { ok: false as const, error: "Bạn đã check-in vào ca hôm nay rồi" };
    }

    const settings = await getSettings();

    // Determine target branch
    let branch = null;
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { branch: true },
    });

    if (user?.branch) {
      branch = user.branch;
    } else {
      branch = await prisma.branch.findFirst({
        where: { isMain: true },
      }) || await prisma.branch.findFirst();
    }

    let distance: number | null = null;
    const allowedRadius = branch?.radiusMeters || settings.defaultGpsRadius || 150;

    if (!branch?.latitude || !branch?.longitude) {
      return {
        ok: false as const,
        error: "Cửa hàng chưa được cấu hình tọa độ GPS. Vui lòng vào mục Cài đặt để cập nhật vị trí cửa hàng trước khi chấm công.",
      };
    }

    if (typeof input.lat !== "number" || typeof input.lng !== "number") {
      return {
        ok: false as const,
        error: "Không nhận được tọa độ GPS. Vui lòng cho phép trình duyệt truy cập vị trí.",
      };
    }

    distance = calculateDistanceMeters(
      input.lat,
      input.lng,
      branch.latitude,
      branch.longitude
    );

    if (distance > allowedRadius) {
      return {
        ok: false as const,
        error: `Bạn đang ở cách ${branch.name} ${formatDistance(distance)}. Bán kính cho phép chấm công là ${allowedRadius}m.`,
        distance,
        allowedRadius,
      };
    }

    const now = new Date();
    // Calculate late minutes based on workStartTime (e.g. "08:00")
    const [sh, sm] = (settings.workStartTime || "08:00").split(":").map(Number);
    const startMins = (sh || 8) * 60 + (sm || 0);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const lateMinutes = Math.max(0, nowMins - startMins);
    const status = lateMinutes > 0 ? "late" : "present";

    const record = await prisma.attendance.create({
      data: {
        userId: session.id,
        branchId: branch?.id || null,
        date: today,
        checkInTime: now,
        checkInLat: input.lat,
        checkInLng: input.lng,
        checkInDistance: distance,
        lateMinutes,
        status,
        note: input.note || null,
      },
    });

    revalidatePath("/attendance");
    revalidatePath("/attendance/manage");
    return { ok: true as const, record, lateMinutes, distance };
  } catch (error) {
    console.error("Check-in error:", error);
    return { ok: false as const, error: "Có lỗi xảy ra khi chấm công" };
  }
}

export async function checkOutAction(input: {
  lat: number;
  lng: number;
  earlyReason?: string;
  note?: string;
}) {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false as const, error: "Vui lòng đăng nhập" };
    }

    const today = getNormalizedToday();
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: session.id,
        date: today,
      },
      include: {
        branch: true,
      },
    });

    if (!existing || !existing.checkInTime) {
      return { ok: false as const, error: "Bạn chưa check-in vào ca hôm nay!" };
    }

    if (existing.checkOutTime) {
      return { ok: false as const, error: "Bạn đã check-out kết ca hôm nay rồi" };
    }

    const settings = await getSettings();
    const branch = existing.branch;
    let distance: number | null = null;
    const allowedRadius = branch?.radiusMeters || settings.defaultGpsRadius || 150;

    if (branch?.latitude && branch?.longitude) {
      if (typeof input.lat === "number" && typeof input.lng === "number") {
        distance = calculateDistanceMeters(
          input.lat,
          input.lng,
          branch.latitude,
          branch.longitude
        );

        if (distance > allowedRadius) {
          return {
            ok: false as const,
            error: `Bạn đang ở cách ${branch.name} ${formatDistance(distance)}. Bán kính cho phép là ${allowedRadius}m.`,
            distance,
            allowedRadius,
          };
        }
      }
    }

    const now = new Date();
    // Check if check-out earlier than workEndTime (e.g. "17:30")
    const [eh, em] = (settings.workEndTime || "17:30").split(":").map(Number);
    const endMins = (eh || 17) * 60 + (em || 30);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const isEarly = nowMins < endMins;

    if (isEarly && (!input.earlyReason || !input.earlyReason.trim())) {
      return {
        ok: false as const,
        requireReason: true,
        error: `Bạn đang kết thúc ca sớm hơn quy định (${settings.workEndTime}). Vui lòng nhập lý do về sớm!`,
      };
    }

    const workMinutes = Math.max(
      0,
      Math.round((now.getTime() - existing.checkInTime.getTime()) / 60000)
    );

    let finalStatus = existing.status;
    if (isEarly) {
      finalStatus = "early_leave";
    }

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutTime: now,
        checkOutLat: input.lat,
        checkOutLng: input.lng,
        checkOutDistance: distance,
        earlyReason: input.earlyReason?.trim() || null,
        workMinutes,
        status: finalStatus,
        note: input.note ? [existing.note, input.note].filter(Boolean).join(" | ") : existing.note,
      },
    });

    revalidatePath("/attendance");
    revalidatePath("/attendance/manage");
    return { ok: true as const, record: updated, workMinutes, distance };
  } catch (error) {
    console.error("Check-out error:", error);
    return { ok: false as const, error: "Có lỗi xảy ra khi check-out" };
  }
}

export async function submitExplanationAction(attendanceId: string, note: string) {
  try {
    const session = await getSession();
    if (!session) return { ok: false as const, error: "Chưa đăng nhập" };

    const att = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!att || att.userId !== session.id) {
      return { ok: false as const, error: "Không tìm thấy lượt chấm công" };
    }

    await prisma.attendance.update({
      where: { id: attendanceId },
      data: { note: note.trim() },
    });

    revalidatePath("/attendance");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Lỗi gửi giải trình" };
  }
}

export async function adminAdjustAttendanceAction(data: {
  attendanceId?: string;
  userId: string;
  branchId?: string;
  dateStr: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm
  checkOutTime?: string; // HH:mm
  status: string;
  adjustmentNote: string;
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { ok: false as const, error: "Chỉ Admin mới có quyền duyệt / sửa chấm công" };
    }

    const [year, month, day] = data.dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const [ciH, ciM] = data.checkInTime.split(":").map(Number);
    const checkIn = new Date(year, month - 1, day, ciH, ciM, 0);

    let checkOut: Date | null = null;
    let workMinutes = 0;
    if (data.checkOutTime) {
      const [coH, coM] = data.checkOutTime.split(":").map(Number);
      checkOut = new Date(year, month - 1, day, coH, coM, 0);
      workMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
    }

    if (data.attendanceId) {
      await prisma.attendance.update({
        where: { id: data.attendanceId },
        data: {
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workMinutes,
          status: data.status,
          adjustedBy: session.name || "Admin",
          adjustedAt: new Date(),
          adjustmentNote: data.adjustmentNote.trim() || "Admin duyệt bổ sung",
        },
      });
    } else {
      await prisma.attendance.create({
        data: {
          userId: data.userId,
          branchId: data.branchId || null,
          date,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workMinutes,
          status: data.status,
          adjustedBy: session.name || "Admin",
          adjustedAt: new Date(),
          adjustmentNote: data.adjustmentNote.trim() || "Admin tạo bổ sung",
        },
      });
    }

    revalidatePath("/attendance");
    revalidatePath("/attendance/manage");
    return { ok: true as const };
  } catch (error) {
    console.error("Admin adjust error:", error);
    return { ok: false as const, error: "Có lỗi xảy ra khi lưu điều chỉnh" };
  }
}
