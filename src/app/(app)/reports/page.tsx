import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatNumber } from "@/lib/format";
import { parseSplitPayment } from "@/lib/payment-utils";
import {
  TrendingUp,
  ShoppingCart,
  Wrench,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  DollarSign,
  Package
} from "lucide-react";
import { RevenueChart } from "@/components/revenue-chart";
import { ReportTabs } from "./report-tabs";
import {
  Reconciliation,
  type ReconRow,
  type ReconStaff,
} from "./reconciliation";
import { cn } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  card: "Thẻ",
  transfer: "Chuyển khoản",
  wallet: "Ví ĐT",
  split: "Tiền mặt + Chuyển khoản",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "shifts" ? "shifts" : "overview";
  const dateStr = sp.date || new Date().toISOString().slice(0, 10);

  if (tab === "shifts") {
    return (
      <ReportsLayout active="shifts">
        <ShiftsTab date={dateStr} />
      </ReportsLayout>
    );
  }
  return (
    <ReportsLayout active="overview">
      <OverviewTab />
    </ReportsLayout>
  );
}

function ReportsLayout({
  active,
  children,
}: {
  active: "overview" | "shifts";
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 pb-12">
      {/* Header section matched with Customers style */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/5 via-blue-500/5 to-transparent p-6 rounded-2xl border border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="size-6 text-primary" />
            Báo cáo & Phân tích
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi hiệu quả kinh doanh, doanh thu và hiệu suất làm việc của nhân viên.
          </p>
        </div>
        <ReportTabs active={active} />
      </div>
      {children}
    </div>
  );
}

async function ShiftsTab({ date }: { date: string }) {
  // Build day range from local date (server-local = same as TZ used elsewhere)
  const start = new Date(date + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [sales, tickets, users] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: start, lt: end }, status: "paid" },
      include: { customer: true, user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.serviceTicket.findMany({
      where: {
        deliveredAt: { gte: start, lt: end },
        status: "delivered",
      },
      include: { customer: true, createdBy: true },
      orderBy: { deliveredAt: "asc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const grouped = new Map<string, ReconRow[]>();

  for (const s of sales) {
    const arr = grouped.get(s.userId) ?? [];
    arr.push({
      type: "sale",
      id: s.id,
      code: s.code,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customer?.name ?? null,
      paymentMethod: s.paymentMethod,
      total: s.total,
      note: s.note,
    });
    grouped.set(s.userId, arr);
  }
  for (const t of tickets) {
    const uid = t.createdById;
    const arr = grouped.get(uid) ?? [];
    arr.push({
      type: "service",
      id: t.id,
      code: t.code,
      createdAt: (t.deliveredAt ?? t.createdAt).toISOString(),
      customerName: t.customer?.name ?? null,
      paymentMethod: t.paymentMethod || "cash",
      total: t.finalCost,
      note: t.note,
    });
    grouped.set(uid, arr);
  }

  const staff: ReconStaff[] = Array.from(grouped.entries())
    .map(([uid, rows]) => {
      const u = userMap.get(uid);
      return {
        id: uid,
        name: u?.name ?? "—",
        email: u?.email ?? "",
        role: u?.role ?? "",
        rows: rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    })
    .sort((a, b) => b.rows.length - a.rows.length);

  const total = sales.reduce((s, x) => s + x.total, 0) +
    tickets.reduce((s, x) => s + x.finalCost, 0);
  let cashFromSplit = 0;
  let transferFromSplit = 0;
  for (const s of sales) {
    if (s.paymentMethod === "split") {
      const sp = parseSplitPayment(s.note, s.total);
      cashFromSplit += sp.cash;
      transferFromSplit += sp.transfer;
    }
  }
  for (const t of tickets) {
    if (t.paymentMethod === "split") {
      const sp = parseSplitPayment(t.note, t.finalCost);
      cashFromSplit += sp.cash;
      transferFromSplit += sp.transfer;
    }
  }

  const cashTotal =
    sales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((s, x) => s + x.total, 0) +
    tickets
      .filter((t) => (t.paymentMethod || "cash") === "cash")
      .reduce((s, x) => s + x.finalCost, 0) +
    cashFromSplit;

  const transferTotal =
    sales
      .filter((s) => s.paymentMethod === "transfer")
      .reduce((s, x) => s + x.total, 0) +
    tickets
      .filter((t) => t.paymentMethod === "transfer")
      .reduce((s, x) => s + x.finalCost, 0) +
    transferFromSplit;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Doanh thu ngày"
          value={formatVND(total)}
          subValue="Tổng thu trong ngày"
          icon={<TrendingUp className="size-5" />}
          gradient="from-emerald-400 to-teal-600"
        />
        <Kpi
          label="Tiền mặt"
          value={formatVND(cashTotal)}
          subValue="Thu quỹ tiền mặt"
          icon={<DollarSign className="size-5" />}
          gradient="from-blue-500 to-indigo-600"
        />
        <Kpi
          label="Chuyển khoản"
          value={formatVND(transferTotal)}
          subValue="Thu qua ngân hàng"
          icon={<BarChart3 className="size-5" />}
          gradient="from-violet-500 to-fuchsia-600"
        />
        <Kpi
          label="Nhân viên"
          value={String(staff.length)}
          subValue="Số NV phát sinh đơn"
          icon={<Users className="size-5" />}
          gradient="from-slate-500 to-slate-700"
        />
      </div>
      <Reconciliation date={date} staff={staff} />
    </div>
  );
}

async function OverviewTab() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    todayRevenue,
    monthRevenue,
    monthServiceRevenue,
    last30Sales,
    topProducts,
    paymentBreakdown,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today }, status: "paid" },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: "paid" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.serviceTicket.aggregate({
      where: {
        deliveredAt: { gte: startOfMonth },
        status: "delivered",
      },
      _sum: { finalCost: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: last30 }, status: "paid" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, total: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { createdAt: { gte: startOfMonth }, status: "paid" } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 10,
    }),
    prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { createdAt: { gte: startOfMonth }, status: "paid" },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const productIds = topProducts.map((p) => p.productId);
  const productDetails = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = Object.fromEntries(productDetails.map((p) => [p.id, p]));

  const revenueByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    revenueByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of last30Sales) {
    const key = s.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + s.total);
  }
  const chartData = Array.from(revenueByDay.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={<TrendingUp className="size-5" />}
          label="Doanh thu hôm nay"
          value={formatVND(todayRevenue._sum.total || 0)}
          subValue="Bán lẻ trong ngày"
          gradient="from-emerald-400 to-teal-600"
        />
        <Kpi
          icon={<ShoppingCart className="size-5" />}
          label="Bán lẻ tháng"
          value={formatVND(monthRevenue._sum.total || 0)}
          subValue="Doanh số POS"
          gradient="from-blue-500 to-indigo-600"
        />
        <Kpi
          icon={<Wrench className="size-5" />}
          label="Sửa chữa tháng"
          value={formatVND(monthServiceRevenue._sum.finalCost || 0)}
          subValue="Doanh số dịch vụ"
          gradient="from-amber-400 to-orange-600"
        />
        <Kpi
          icon={<ArrowUpRight className="size-5" />}
          label="Trung bình / Đơn"
          value={formatVND(
            monthRevenue._count
              ? (monthRevenue._sum.total || 0) / monthRevenue._count
              : 0,
          )}
          subValue="Giá trị đơn POS"
          gradient="from-slate-500 to-slate-700"
        />
      </div>

      <Card className="border border-border/80 shadow-lg rounded-2xl overflow-hidden bg-card/65 backdrop-blur-sm">
        <CardHeader className="border-b border-border/60 py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
               <Calendar className="size-4 text-primary" />
               Diễn biến doanh thu 30 ngày qua
            </CardTitle>
            <CardDescription className="text-xs">
              Tổng hợp dữ liệu bán hàng thực tế theo thời gian.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[350px]">
             <RevenueChart data={chartData} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border/80 shadow-lg rounded-2xl overflow-hidden bg-card/65 backdrop-blur-sm">
          <CardHeader className="border-b border-border/60 py-4 px-6">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="size-4 text-primary" />
              Sản phẩm dẫn đầu doanh thu
            </CardTitle>
            <CardDescription className="text-xs">Top 10 mặt hàng có hiệu suất tốt nhất tháng.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60">
                  <TableHead className="w-16 text-center font-bold text-[10px] uppercase tracking-widest">STT</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Sản phẩm</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">SL</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      Chưa có dữ liệu giao dịch trong tháng
                    </TableCell>
                  </TableRow>
                )}
                {topProducts.map((p, idx) => {
                  const prod = productMap[p.productId];
                  return (
                    <TableRow key={p.productId} className="hover:bg-muted/50 transition-colors group border-b border-border/40">
                      <TableCell className="text-center font-bold text-muted-foreground text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-foreground text-[13px] group-hover:text-primary transition-colors">
                          {prod?.name || "Sản phẩm không xác định"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {prod?.sku}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-muted-foreground text-xs">
                        {formatNumber(p._sum.quantity || 0)}
                      </TableCell>
                      <TableCell className="text-right font-black text-primary text-sm">
                        {formatVND(p._sum.subtotal || 0)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-lg rounded-2xl overflow-hidden bg-card/65 backdrop-blur-sm">
          <CardHeader className="border-b border-border/60 py-4 px-6">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChart className="size-4 text-primary" />
              Cơ cấu phương thức thanh toán
            </CardTitle>
            <CardDescription className="text-xs">Tỷ trọng các nguồn thu trong tháng này.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Phương thức</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Số đơn</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Tổng tiền</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Tỉ trọng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      Chưa phát sinh thanh toán
                    </TableCell>
                  </TableRow>
                )}
                {paymentBreakdown.map((p) => {
                  const total = monthRevenue._sum.total || 1;
                  const pct = ((p._sum.total || 0) / total) * 100;
                  return (
                    <TableRow key={p.paymentMethod} className="hover:bg-muted/50 transition-colors border-b border-border/40">
                      <TableCell>
                        <Badge variant="outline" className="font-bold border-border/60 text-foreground bg-muted/30 px-2 py-0.5 rounded-md text-[10px]">
                          {PAYMENT_LABELS[p.paymentMethod] || p.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-muted-foreground text-xs">{p._count}</TableCell>
                      <TableCell className="text-right font-black text-foreground text-sm">
                        {formatVND(p._sum.total || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-primary">{pct.toFixed(1)}%</span>
                            <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                         </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
