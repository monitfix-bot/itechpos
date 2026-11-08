"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "admin") return null;
  return s;
}

export async function updateBranchGps(
  branchId: string,
  data: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    address?: string;
  }
) {
  try {
    if (!(await requireAdmin())) {
      return { ok: false as const, error: "Không có quyền" };
    }

    await prisma.branch.update({
      where: { id: branchId },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: Math.max(20, Math.round(data.radiusMeters || 150)),
        address: data.address,
      },
    });

    revalidatePath("/settings/branches");
    revalidatePath("/attendance");
    return { ok: true as const };
  } catch (error) {
    console.error("Update branch GPS error:", error);
    return { ok: false as const, error: "Không thể lưu tọa độ chi nhánh" };
  }
}
