import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  // Global Maintenance check
  const systemSettings = await prisma.systemSetting.findUnique({ where: { id: "global" } });
  if (systemSettings?.maintenanceMode && !user.isSuperAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Hệ thống đang bảo trì</h1>
          <p className="text-slate-500">Vui lòng quay lại sau.</p>
        </div>
      </div>
    );
  }

  const settings = await getSettings();

  const tickets = await prisma.serviceTicket.findMany({
    where: {
      status: { notIn: ["delivered", "cancelled"] },
    },
    orderBy: { createdAt: "desc" },
    include: { customer: true },
    take: 30,
  });

  const pendingTickets = tickets.map((t) => ({
    id: t.id,
    code: t.code,
    customerName: t.customer.name,
    customerPhone: t.customer.phone,
    deviceLabel: [t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") ||
      t.deviceType,
    status: t.status,
  }));

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col">
        <AppHeader
          user={user}
          pendingTickets={pendingTickets}
          shopName={settings.shopName}
          shopTagline={settings.shopTagline}
          logoUrl={settings.logoUrl}
          themeColor={settings.themeColor}
        />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-2.5 sm:p-4 md:p-5 max-w-[1600px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
