import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { PortalSettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function PortalSettingsPage() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && !session.isSuperAdmin)) {
    redirect("/attendance");
  }

  const settings = await getSettings();

  const branches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      isMain: true,
    },
    orderBy: { isMain: "desc" },
  });

  return (
    <PortalSettingsClient
      initialSettings={{
        workStartTime: settings.workStartTime || "08:00",
        workEndTime: settings.workEndTime || "17:30",
        allowedLateMinutesPerMonth: settings.allowedLateMinutesPerMonth ?? 60,
        standardWorkingDaysPerMonth: settings.standardWorkingDaysPerMonth ?? 26,
        defaultGpsRadius: settings.defaultGpsRadius ?? 150,
      }}
      branches={branches}
    />
  );
}
