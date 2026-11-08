"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "admin") return null;
  return s;
}

export async function updateSettings(data: {
  shopName: string;
  siteTitle: string;
  shopTagline: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  printSize: string;
  timezone?: string;
  themeColor?: string;
  bankId: string;
  bankAccount: string;
  bankAccountName: string;
  workStartTime?: string;
  workEndTime?: string;
  allowedLateMinutesPerMonth?: number | string;
  standardWorkingDaysPerMonth?: number | string;
  defaultGpsRadius?: number | string;
}) {
  try {
    if (!(await requireAdmin())) {
      return { ok: false as const, error: "Không có quyền" };
    }
    const payload = {
      shopName: data.shopName,
      siteTitle: data.siteTitle,
      shopTagline: data.shopTagline,
      shopAddress: data.shopAddress || null,
      shopPhone: data.shopPhone || null,
      shopEmail: data.shopEmail || null,
      printSize: data.printSize,
      timezone: data.timezone || "Asia/Ho_Chi_Minh",
      themeColor: data.themeColor || "blue",
      bankId: data.bankId || null,
      bankAccount: data.bankAccount || null,
      bankAccountName: data.bankAccountName || null,
      workStartTime: data.workStartTime || "08:00",
      workEndTime: data.workEndTime || "17:30",
      allowedLateMinutesPerMonth: Number(data.allowedLateMinutesPerMonth) || 60,
      standardWorkingDaysPerMonth: Number(data.standardWorkingDaysPerMonth) || 26,
      defaultGpsRadius: Number(data.defaultGpsRadius) || 150,
    };

    await prisma.appSetting.upsert({
      where: { id: "default" },
      update: payload,
      create: { ...payload, id: "default" },
    });

    updateTag("app-settings");
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}

export async function uploadAsset(formData: FormData) {
  try {
    if (!(await requireAdmin())) {
      return { ok: false as const, error: "Không có quyền" };
    }
    const file = formData.get("file") as File | null;
    const kind = formData.get("kind") as string | null; // logo | favicon
    if (!file || !kind) {
      return { ok: false as const, error: "Thiếu file" };
    }
    if (kind !== "logo" && kind !== "favicon") {
      return { ok: false as const, error: "Loại file không hợp lệ" };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false as const, error: "File tối đa 2MB" };
    }
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const safeExt = ["png", "jpg", "jpeg", "webp", "svg", "ico"].includes(ext)
      ? ext
      : "png";
    const fileName = `${kind}-${Date.now()}.${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buf);
    const url = `/uploads/${fileName}`;

    const field = kind === "favicon" ? "faviconUrl" : "logoUrl";
    await prisma.appSetting.upsert({
      where: { id: "default" },
      update: { [field]: url },
      create: { id: "default", [field]: url },
    });

    updateTag("app-settings");
    revalidatePath("/", "layout");
    return { ok: true as const, url };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Lỗi upload file" };
  }
}

export async function clearAsset(kind: "logo" | "favicon") {
  try {
    if (!(await requireAdmin())) {
      return { ok: false as const, error: "Không có quyền" };
    }
    if (kind !== "logo" && kind !== "favicon") {
      return { ok: false as const, error: "Loại file không hợp lệ" };
    }
    const field = kind === "favicon" ? "faviconUrl" : "logoUrl";
    await prisma.appSetting.update({
      where: { id: "default" },
      data: { [field]: null },
    });
    updateTag("app-settings");
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra" };
  }
}
