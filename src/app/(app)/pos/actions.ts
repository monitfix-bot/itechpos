"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nextSaleCode, nextCustomerCode } from "@/lib/code-sequence";
import { formatSplitNote } from "@/lib/payment-utils";

type Item = {
  productId: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  imei?: string;
};

export async function createSale(input: {
  items: Item[];
  customerId?: string;
  newCustomer?: { name: string; phone: string };
  paymentMethod: string;
  discount: number;
  note: string;
  splitCash?: number;
  splitTransfer?: number;
}) {
  try {
    const session = await requireSession();
    if (input.items.length === 0) {
      return { ok: false as const, error: "Giỏ hàng trống" };
    }

    let resolvedCustomerId: string | null = input.customerId || null;
    if (!resolvedCustomerId && (!input.newCustomer || !input.newCustomer.phone?.trim() || !input.newCustomer.name?.trim())) {
      return {
        ok: false as const,
        error: "Vui lòng chọn hoặc thêm khách hàng (SĐT + tên)",
      };
    }
    if (!resolvedCustomerId && input.newCustomer && input.newCustomer.name.trim()) {
      const phone = input.newCustomer.phone.trim();
      const name = input.newCustomer.name.trim();
      if (!phone) {
        return { ok: false as const, error: "SĐT khách hàng không hợp lệ" };
      }
      const existing = await prisma.customer.findFirst({ where: { phone } });
      if (existing) {
        resolvedCustomerId = existing.id;
      } else {
        const code = await nextCustomerCode(prisma);
        const created = await prisma.customer.create({
          data: {
            code,
            name,
            phone,
          },
        });
        resolvedCustomerId = created.id;
      }
    }

    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });
    for (const item of input.items) {
      const p = products.find((x) => x.id === item.productId);
      if (!p) return { ok: false as const, error: "Sản phẩm không tồn tại" };
      if (p.category.type !== "service" && p.stock < item.quantity) {
        return {
          ok: false as const,
          error: `"${p.name}" không đủ tồn kho (còn ${p.stock})`,
        };
      }
    }

    const subtotal = input.items.reduce(
      (s, i) => s + i.unitPrice * i.quantity - (i.discount || 0),
      0,
    );
    const total = Math.max(0, subtotal - (input.discount || 0));

    const finalNote = input.paymentMethod === "split"
      ? formatSplitNote(input.note, input.splitCash ?? 0, input.splitTransfer ?? 0)
      : (input.note || null);

    const sale = await prisma.$transaction(async (tx) => {
      const code = await nextSaleCode(tx);
      const created = await tx.sale.create({
        data: {
          code,
          subtotal,
          discount: input.discount || 0,
          total,
          paid: total,
          paymentMethod: input.paymentMethod,
          status: "paid",
          note: finalNote,
          customerId: resolvedCustomerId,
          userId: session.id,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount || 0,
              subtotal: i.unitPrice * i.quantity - (i.discount || 0),
              imei: i.imei || null,
            })),
          },
        },
      });

      for (const item of input.items) {
        const cached = products.find((x) => x.id === item.productId);
        if (cached && cached.category.type !== "service") {
          const before = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });
          const updated = await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              type: "out",
              quantity: -item.quantity,
              before: before?.stock ?? updated.stock + item.quantity,
              after: updated.stock,
              unitCost: 0,
              reason: "Bán hàng",
              reference: code,
              productId: item.productId,
              userId: session.id,
            },
          });
        }
      }

      return created;
    });

    revalidatePath("/");
    revalidatePath("/sales");
    revalidatePath("/products");
    return { ok: true as const, id: sale.id, code: sale.code };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra khi tạo hoá đơn" };
  }
}
