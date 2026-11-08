import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { AttendanceClient } from "./attendance-client";

export default async function AttendancePage() {
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
    branch = (await prisma.branch.findFirst({ where: { isMain: true } })) || (await prisma.branch.findFirst());
  }

  // Today normalized date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // First day of current month
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthFirstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [todayRecord, history] = await Promise.all([
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
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <AttendanceClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      branch={
        branch
          ? {
              id: branch.id,
              name: branch.name,
              address: branch.address,
              latitude: branch.latitude,
              longitude: branch.longitude,
              radiusMeters: branch.radiusMeters || settings.defaultGpsRadius || 150,
            }
          : null
      }
      todayRecord={todayRecord ? JSON.parse(JSON.stringify(todayRecord)) : null}
      history={JSON.parse(JSON.stringify(history))}
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
