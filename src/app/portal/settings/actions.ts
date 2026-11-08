"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updatePortalShiftSettings(data: {
  workStartTime: string;
  workEndTime: string;
  allowedLateMinutesPerMonth: number;
  standardWorkingDaysPerMonth: number;
  defaultGpsRadius: number;
}) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && !session.isSuperAdmin)) {
      return { ok: false, error: "Bạn không có quyền quản trị viên" };
    }

    await prisma.appSetting.upsert({
      where: { id: "default" },
      update: {
        workStartTime: data.workStartTime,
        workEndTime: data.workEndTime,
        allowedLateMinutesPerMonth: Number(data.allowedLateMinutesPerMonth) || 60,
        standardWorkingDaysPerMonth: Number(data.standardWorkingDaysPerMonth) || 26,
        defaultGpsRadius: Number(data.defaultGpsRadius) || 150,
      },
      create: {
        id: "default",
        shopName: "TechShop",
        workStartTime: data.workStartTime,
        workEndTime: data.workEndTime,
        allowedLateMinutesPerMonth: Number(data.allowedLateMinutesPerMonth) || 60,
        standardWorkingDaysPerMonth: Number(data.standardWorkingDaysPerMonth) || 26,
        defaultGpsRadius: Number(data.defaultGpsRadius) || 150,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/portal/settings");
    revalidatePath("/attendance");
    revalidatePath("/portal/attendance");
    revalidatePath("/portal");

    return { ok: true };
  } catch (err: any) {
    console.error("Error updating shift settings:", err);
    return { ok: false, error: err.message || "Lỗi lưu cấu hình" };
  }
}

export async function updateBranchGpsAction(
  branchId: string,
  data: {
    latitude: number | null;
    longitude: number | null;
    radiusMeters?: number;
  }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && !session.isSuperAdmin)) {
      return { ok: false, error: "Bạn không có quyền quản trị viên" };
    }

    await prisma.branch.update({
      where: { id: branchId },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters || 150,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/portal/settings");
    revalidatePath("/attendance");
    revalidatePath("/portal/attendance");
    revalidatePath("/portal");

    return { ok: true };
  } catch (err: any) {
    console.error("Error updating branch GPS:", err);
    return { ok: false, error: err.message || "Lỗi lưu GPS chi nhánh" };
  }
}
