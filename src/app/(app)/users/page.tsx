import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, UserCog, Wrench, Mail, Calendar, UserPlus, Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/format";
import { NewUserDialog } from "./new-user-dialog";
import { UserRowActions } from "./user-actions";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  staff: "Nhân viên",
  technician: "Kỹ thuật viên",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="size-3.5" />,
  staff: <UserCog className="size-3.5" />,
  technician: <Wrench className="size-3.5" />,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-50 text-purple-600 border-purple-100",
  staff: "bg-primary/10 text-primary border-primary/20",
  technician: "bg-amber-50 text-amber-600 border-amber-100",
};

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const users = await prisma.user.findMany({ 
    include: { branch: true },
    orderBy: { createdAt: "desc" } 
  });
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });

  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    staff: users.filter((u) => u.role === "staff").length,
    technician: users.filter((u) => u.role === "technician").length,
    active: users.filter((u) => u.active).length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section matched with Customers style */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/5 via-blue-500/5 to-transparent p-6 rounded-2xl border border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCog className="size-6 text-primary" />
            Quản trị nhân sự
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phân quyền truy cập, quản lý tài khoản nhân viên và theo dõi hoạt động hệ thống.
          </p>
        </div>
        <NewUserDialog branches={branches} />
      </div>

      {/* KPI Stats matched with Customers style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={<Fingerprint className="size-5" />}
          label="Tổng tài khoản"
          value={String(users.length)}
          subValue="Thành viên hệ thống"
          gradient="from-slate-500 to-slate-700"
        />
        <Kpi
          icon={<ShieldCheck className="size-5" />}
          label="Quản trị viên"
          value={String(counts.admin)}
          subValue="Toàn quyền hệ thống"
          gradient="from-purple-500 to-indigo-600"
        />
        <Kpi
          icon={<UserCog className="size-5" />}
          label="Nhân viên POS"
          value={String(counts.staff)}
          subValue="Bán hàng & Kho"
          gradient="from-primary to-primary/80"
        />
        <Kpi
          icon={<Wrench className="size-5" />}
          label="Kỹ thuật viên"
          value={String(counts.technician)}
          subValue="Dịch vụ sửa chữa"
          gradient="from-amber-400 to-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map((u) => {
          const initials = u.name
            .split(" ")
            .filter(Boolean)
            .slice(-2)
            .map((p) => p[0])
            .join("")
            .toUpperCase();
          const roleStyle = ROLE_COLORS[u.role] || "bg-slate-50 text-slate-600 border-slate-100";
          
          return (
            <Card 
              key={u.id}
              className="border border-border/80 shadow-lg rounded-2xl overflow-hidden bg-card/65 backdrop-blur-sm group hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <CardContent className="p-0">
                {/* Header Decoration */}
                <div className={cn(
                  "h-1.5 w-full",
                  u.role === "admin" ? "bg-purple-500" :
                  u.role === "staff" ? "bg-primary" : "bg-amber-500"
                )} />
                
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "size-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm border border-border/40",
                      roleStyle
                    )}>
                      {initials || <UserCog className="size-6" />}
                    </div>
                    <UserRowActions
                      user={{
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        active: u.active,
                      }}
                    />
                  </div>

                  <div className="mt-4 space-y-1">
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{u.name}</h3>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                      <Mail className="size-3.5" />
                      {u.email}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn("font-bold gap-1 px-2.5 py-1 rounded-xl shadow-none", roleStyle)}>
                      {ROLE_ICONS[u.role]}
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                    
                    {u.branch && (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 font-bold gap-1 px-2.5 py-1 rounded-xl shadow-none">
                        <Settings className="size-3" />
                        {u.branch.name}
                      </Badge>
                    )}

                    {u.active ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 font-bold gap-1 px-2.5 py-1 rounded-xl shadow-none">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-100 font-bold gap-1 px-2.5 py-1 rounded-xl shadow-none">
                        <Lock className="size-3" />
                        Tạm khóa
                      </Badge>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                     <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        <Calendar className="size-3" />
                        Tham gia {formatDate(u.createdAt)}
                     </div>
                     {u.role === "admin" && <Shield className="size-4 text-purple-200" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Quick Add Placeholder */}
        <div className="border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer min-h-[280px]">
           <div className="size-16 rounded-full bg-card text-muted-foreground/40 flex items-center justify-center border border-border/60">
              <UserPlus className="size-8" />
           </div>
           <div>
              <p className="font-bold text-foreground">Thêm thành viên</p>
              <p className="text-xs text-muted-foreground font-medium px-4">Tạo thêm tài khoản để vận hành hệ thống</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  subValue,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  gradient: string;
}) {
  return (
    <Card className="border border-border/80 shadow-md rounded-2xl overflow-hidden bg-card/65 backdrop-blur-sm group hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={`size-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr ${gradient} shadow-lg shadow-primary/5 group-hover:scale-105 transition-transform duration-300`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
            {label}
          </div>
          <div className="text-lg font-black text-foreground mt-0.5 truncate">{value}</div>
          <div className="text-[10px] text-muted-foreground font-medium">{subValue}</div>
        </div>
      </CardContent>
    </Card>
  );
}
