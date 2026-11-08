import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PortalHeader } from "./portal-header";
import { PortalBottomNav } from "./portal-bottom-nav";
import { TooltipProvider } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const settings = await getSettings();

  const portalUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isSuperAdmin: user.isSuperAdmin,
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-foreground antialiased selection:bg-blue-500 selection:text-white relative">
        <PortalHeader
          user={portalUser}
          shopName={settings.shopName || "TechShop"}
        />

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 pb-24 md:pb-10">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <PortalBottomNav user={portalUser} />
      </div>
    </TooltipProvider>
  );
}
