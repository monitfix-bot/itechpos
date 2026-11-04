"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export type SearchHit = {
  kind: "ticket" | "sale" | "customer" | "product";
  id: string;
  code: string;
  title: string;
  subtitle?: string;
  badge?: string;
  link: string;
};

export async function globalSearch(query: string): Promise<{
  ok: true;
  hits: SearchHit[];
}> {
  await requireSession();
  const q = query.trim();
  if (q.length < 2) return { ok: true, hits: [] };

  const [tickets, sales, customers, products] = await Promise.all([
    prisma.serviceTicket.findMany({
      where: {
        OR: [
          { code: { contains: q } },
          { customer: { name: { contains: q } } },
          { customer: { phone: { contains: q } } },
          { deviceModel: { contains: q } },
          { deviceBrand: { contains: q } },
          { imei: { contains: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true, phone: true } } },
    }),
    prisma.sale.findMany({
      where: {
        OR: [
          { code: { contains: q } },
          { customer: { name: { contains: q } } },
          { customer: { phone: { contains: q } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true, phone: true } } },
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
          { code: { contains: q } },
          { email: { contains: q } },
        ],
      },
      orderBy: { name: "asc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
          { brand: { contains: q } },
        ],
      },
      orderBy: { name: "asc" },
      take: 5,
    }),
  ]);

  const hits: SearchHit[] = [];

  for (const t of tickets) {
    const device =
      [t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || t.deviceType;
    hits.push({
      kind: "ticket",
      id: t.id,
      code: t.code,
      title: `${t.code} · ${t.customer?.name ?? "Khách lẻ"}`,
      subtitle: `${device} · ${t.customer?.phone ?? ""}`,
      badge: STATUS_LABEL[t.status] ?? t.status,
      link:
        t.status === "delivered"
          ? `/service/${t.id}`
          : `/pos?ticket=${t.id}&code=${encodeURIComponent(t.code)}`,
    });
  }

  for (const s of sales) {
    hits.push({
      kind: "sale",
      id: s.id,
      code: s.code,
      title: `${s.code} · ${s.customer?.name ?? "Khách lẻ"}`,
      subtitle: `${formatVND(s.total)}${s.customer?.phone ? ` · ${s.customer.phone}` : ""}`,
      link: `/sales/${s.id}`,
    });
  }

  for (const c of customers) {
    hits.push({
      kind: "customer",
      id: c.id,
      code: c.code,
      title: c.name,
      subtitle: `${c.code} · ${c.phone}${c.email ? ` · ${c.email}` : ""}`,
      link: `/customers/${c.id}`,
    });
  }

  for (const p of products) {
    hits.push({
      kind: "product",
      id: p.id,
      code: p.sku,
      title: p.name,
      subtitle: `${p.sku}${p.brand ? ` · ${p.brand}` : ""} · ${formatVND(p.price)}`,
      badge: `Tồn ${p.stock}`,
      link: `/products?q=${encodeURIComponent(p.sku)}`,
    });
  }

  return { ok: true, hits };
}

const STATUS_LABEL: Record<string, string> = {
  received: "Đã nhận",
  diagnosing: "Chẩn đoán",
  waiting_parts: "Chờ LK",
  repairing: "Đang sửa",
  completed: "Đã xong",
  delivered: "Đã trả",
  cancelled: "Đã huỷ",
};

function formatVND(v: number) {
  return new Intl.NumberFormat("vi-VN").format(v) + " ₫";
}
