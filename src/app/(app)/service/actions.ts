"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { nextTicketCode, nextCustomerCode } from "@/lib/code-sequence";

const STATUS_LABEL: Record<string, string> = {
  received: "Đã nhận",
  diagnosing: "Đang chẩn đoán",
  waiting_parts: "Chờ linh kiện",
  repairing: "Đang sửa",
  completed: "Đã xong, chờ trả",
  delivered: "Đã trả máy",
  cancelled: "Đã huỷ",
};

type CustomerInput =
  | { id: string }
  | { name: string; phone: string };

export async function createServiceTicket(input: {
  customer: CustomerInput;
  device: {
    type: string;
    brand: string | null;
    model: string | null;
    imei: string | null;
    accessories: string | null;
    appearance: string | null;
    problem: string;
  };
  items: { productId: string | null; description: string; quantity: number; unitPrice: number }[];
  estimatedCost: number;
  deposit: number;
  assignedToId: string | null;
  promisedAt: string | null;
  note: string | null;
}) {
  try {
    const session = await requireSession();

    let customerId: string;
    if ("id" in input.customer) {
      customerId = input.customer.id;
    } else {
      const phone = input.customer.phone.trim();
      const name = input.customer.name.trim();
      if (!phone || !name) {
        return {
          ok: false as const,
          error: "Vui lòng nhập đầy đủ SĐT và tên khách hàng",
        };
      }
      const existing = await prisma.customer.findFirst({ where: { phone } });
      if (existing) {
        customerId = existing.id;
      } else {
        const code = await nextCustomerCode(prisma);
        const created = await prisma.customer.create({
          data: {
            code,
            name,
            phone,
          },
        });
        customerId = created.id;
      }
    }

    const code = await nextTicketCode(prisma);

    const ticket = await prisma.serviceTicket.create({
      data: {
        code,
        customerId,
        createdById: session.id,
        assignedToId: input.assignedToId,
        deviceType: input.device.type,
        deviceBrand: input.device.brand,
        deviceModel: input.device.model,
        imei: input.device.imei,
        accessories: input.device.accessories,
        appearance: input.device.appearance,
        problem: input.device.problem,
        estimatedCost: input.estimatedCost,
        deposit: input.deposit,
        promisedAt: input.promisedAt ? new Date(input.promisedAt) : null,
        note: input.note,
        status: "received",
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.unitPrice * i.quantity,
          })),
        },
        history: {
          create: {
            status: "received",
            note: "Tiếp nhận thiết bị",
          },
        },
      },
    });

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true, phone: true },
    });
    const deviceLabel =
      [input.device.brand, input.device.model].filter(Boolean).join(" ") ||
      input.device.type;
    if (input.assignedToId && input.assignedToId !== session.id) {
      await createNotification({
        userId: input.assignedToId,
        type: "ticket_assigned",
        title: `Bạn được giao phiếu ${ticket.code}`,
        body: `${customer?.name ?? ""} · ${deviceLabel} — ${input.device.problem}`,
        link: `/pos?ticket=${ticket.id}&code=${ticket.code}`,
      });
    }
    await notifyAdmins({
      type: "ticket_created",
      title: `Phiếu mới ${ticket.code}`,
      body: `${customer?.name ?? ""} · ${deviceLabel}`,
      link: `/service/${ticket.id}`,
    });

    revalidatePath("/service");
    revalidatePath("/");
    return { ok: true as const, id: ticket.id, code: ticket.code };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Có lỗi xảy ra khi tạo phiếu" };
  }
}

export async function updateServiceStatus(
  ticketId: string,
  status: string,
  note: string,
) {
  try {
    const session = await requireSession();
    await prisma.$transaction(async (tx) => {
      const data: {
        status: string;
        completedAt?: Date;
        deliveredAt?: Date;
      } = { status };
      if (status === "completed") data.completedAt = new Date();
      if (status === "delivered") data.deliveredAt = new Date();
      await tx.serviceTicket.update({
        where: { id: ticketId },
        data,
      });
      await tx.serviceStatusHistory.create({
        data: { ticketId, status, note: note || null },
      });
    });

    const ticket = await prisma.serviceTicket.findUnique({
      where: { id: ticketId },
      include: { customer: true },
    });
    if (ticket) {
      const label = STATUS_LABEL[status] || status;
      const targets = new Set<string>();
      if (ticket.assignedToId && ticket.assignedToId !== session.id)
        targets.add(ticket.assignedToId);
      if (ticket.createdById && ticket.createdById !== session.id)
        targets.add(ticket.createdById);
      for (const userId of targets) {
        await createNotification({
          userId,
          type: "ticket_status",
          title: `${ticket.code} → ${label}`,
          body: `${ticket.customer.name} · ${[ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || ticket.deviceType}${note ? ` — ${note}` : ""}`,
          link: `/pos?ticket=${ticket.id}&code=${ticket.code}`,
        });
      }
    }

    revalidatePath(`/service/${ticketId}`);
    revalidatePath("/service");
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Cập nhật thất bại" };
  }
}

export async function updateServiceTicket(
  ticketId: string,
  data: {
    deviceType?: string;
    deviceBrand?: string | null;
    deviceModel?: string | null;
    imei?: string | null;
    accessories?: string | null;
    appearance?: string | null;
    problem?: string;
    diagnosis?: string;
    solution?: string;
    estimatedCost?: number;
    finalCost?: number;
    paid?: number;
    deposit?: number;
    warranty?: number;
    assignedToId?: string | null;
    promisedAt?: string | null;
    note?: string;
    customerName?: string;
    customerPhone?: string;
  },
) {
  try {
    const session = await requireSession();
    const { customerName, customerPhone, promisedAt, assignedToId, ...rest } =
      data;
    const before = await prisma.serviceTicket.findUnique({
      where: { id: ticketId },
      select: { assignedToId: true, code: true, customer: { select: { name: true } }, deviceBrand: true, deviceModel: true, deviceType: true },
    });
    await prisma.serviceTicket.update({
      where: { id: ticketId },
      data: {
        ...rest,
        promisedAt:
          promisedAt === undefined
            ? undefined
            : promisedAt
              ? new Date(promisedAt)
              : null,
        assignedToId:
          assignedToId === undefined
            ? undefined
            : assignedToId
              ? assignedToId
              : null,
      },
    });
    if (
      assignedToId !== undefined &&
      assignedToId &&
      assignedToId !== before?.assignedToId &&
      assignedToId !== session.id &&
      before
    ) {
      const deviceLabel =
        [before.deviceBrand, before.deviceModel].filter(Boolean).join(" ") ||
        before.deviceType;
      await createNotification({
        userId: assignedToId,
        type: "ticket_assigned",
        title: `Bạn được giao phiếu ${before.code}`,
        body: `${before.customer.name} · ${deviceLabel}`,
        link: `/pos?ticket=${ticketId}&code=${before.code}`,
      });
    }
    if (customerName !== undefined || customerPhone !== undefined) {
      const ticket = await prisma.serviceTicket.findUnique({
        where: { id: ticketId },
        select: { customerId: true },
      });
      if (ticket) {
        await prisma.customer.update({
          where: { id: ticket.customerId },
          data: {
            ...(customerName !== undefined ? { name: customerName } : {}),
            ...(customerPhone !== undefined ? { phone: customerPhone } : {}),
          },
        });
      }
    }
    revalidatePath(`/service/${ticketId}`);
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Cập nhật thất bại" };
  }
}

type ReturnItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string | null;
};

export async function addServiceItems(
  ticketId: string,
  items: ReturnItemInput[],
) {
  try {
    await requireSession();
    const ticket = await prisma.serviceTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });
    if (!ticket) return { ok: false as const, error: "Phiếu không tồn tại" };
    if (ticket.status === "delivered") {
      return { ok: false as const, error: "Phiếu đã trả máy" };
    }
    await prisma.$transaction(async (tx) => {
      for (const it of items) {
        if (!it.description || it.quantity <= 0) continue;
        await tx.serviceItem.create({
          data: {
            ticketId,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.unitPrice * it.quantity,
            productId: it.productId || null,
          },
        });
      }
      const all = await tx.serviceItem.findMany({ where: { ticketId } });
      const total = all.reduce((s, i) => s + i.subtotal, 0);
      await tx.serviceTicket.update({
        where: { id: ticketId },
        data: { estimatedCost: total },
      });
    });
    revalidatePath(`/service/${ticketId}`);
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Thêm dịch vụ thất bại" };
  }
}

export async function removeServiceItem(itemId: string) {
  try {
    await requireSession();
    const item = await prisma.serviceItem.findUnique({
      where: { id: itemId },
      include: { ticket: { select: { id: true, status: true } } },
    });
    if (!item) return { ok: false as const, error: "Mục không tồn tại" };
    if (item.ticket.status === "delivered") {
      return { ok: false as const, error: "Phiếu đã trả máy" };
    }
    await prisma.$transaction(async (tx) => {
      await tx.serviceItem.delete({ where: { id: itemId } });
      const all = await tx.serviceItem.findMany({
        where: { ticketId: item.ticketId },
      });
      const total = all.reduce((s, i) => s + i.subtotal, 0);
      await tx.serviceTicket.update({
        where: { id: item.ticketId },
        data: { estimatedCost: total },
      });
    });
    revalidatePath(`/service/${item.ticketId}`);
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Xoá mục thất bại" };
  }
}

export async function deliverService(input: {
  ticketId: string;
  extraItems: ReturnItemInput[];
  paymentMethod: string;
  paid: number;
  warranty: number;
  solution: string;
  note: string;
}) {
  try {
    const session = await requireSession();
    const ticket = await prisma.serviceTicket.findUnique({
      where: { id: input.ticketId },
      include: { items: true },
    });
    if (!ticket) {
      return { ok: false as const, error: "Phiếu không tồn tại" };
    }
    if (ticket.status === "delivered") {
      return { ok: false as const, error: "Phiếu đã trả máy" };
    }

    await prisma.$transaction(async (tx) => {
      for (const it of input.extraItems) {
        await tx.serviceItem.create({
          data: {
            ticketId: ticket.id,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.unitPrice * it.quantity,
            productId: it.productId || null,
          },
        });
        if (it.productId) {
          const p = await tx.product.findUnique({ where: { id: it.productId } });
          if (p) {
            const updated = await tx.product.update({
              where: { id: it.productId },
              data: { stock: { decrement: it.quantity } },
            });
            await tx.stockMovement.create({
              data: {
                type: "out",
                quantity: -it.quantity,
                before: p.stock,
                after: updated.stock,
                unitCost: 0,
                reason: "Xuất sửa chữa",
                reference: ticket.code,
                productId: it.productId,
                userId: session.id,
              },
            });
          }
        }
      }

      const allItems = await tx.serviceItem.findMany({
        where: { ticketId: ticket.id },
      });
      const finalCost = allItems.reduce((s, i) => s + i.subtotal, 0);

      await tx.serviceTicket.update({
        where: { id: ticket.id },
        data: {
          status: "delivered",
          finalCost,
          paid: input.paid,
          paymentMethod: input.paymentMethod,
          warranty: input.warranty,
          solution: input.solution || ticket.solution,
          note: input.note || ticket.note,
          completedAt: ticket.completedAt || new Date(),
          deliveredAt: new Date(),
        },
      });

      await tx.serviceStatusHistory.create({
        data: {
          ticketId: ticket.id,
          status: "delivered",
          note: "Trả máy & thanh toán",
        },
      });
    });

    revalidatePath(`/service/${input.ticketId}`);
    revalidatePath("/service");
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Trả máy thất bại" };
  }
}

export async function getTicketForTab(id: string) {
  try {
    await requireSession();
    const ticket = await prisma.serviceTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: true,
        assignedTo: true,
        items: { include: { product: true } },
      },
    });
    if (!ticket) return { ok: false as const, error: "Phiếu không tồn tại" };
    return {
      ok: true as const,
      ticket: {
        id: ticket.id,
        code: ticket.code,
        status: ticket.status,
        customer: {
          id: ticket.customer?.id ?? "",
          name: ticket.customer?.name ?? "Khách lẻ",
          phone: ticket.customer?.phone ?? "",
          code: ticket.customer?.code ?? "",
        },
        deviceType: ticket.deviceType,
        deviceBrand: ticket.deviceBrand,
        deviceModel: ticket.deviceModel,
        imei: ticket.imei,
        accessories: ticket.accessories,
        appearance: ticket.appearance,
        problem: ticket.problem,
        diagnosis: ticket.diagnosis,
        solution: ticket.solution,
        estimatedCost: ticket.estimatedCost,
        finalCost: ticket.finalCost,
        paid: ticket.paid,
        deposit: ticket.deposit,
        warranty: ticket.warranty,
        assignedToId: ticket.assignedToId,
        promisedAt: ticket.promisedAt
          ? ticket.promisedAt.toISOString().slice(0, 16)
          : null,
        note: ticket.note,
        receivedAt: ticket.receivedAt.toISOString(),
        items: ticket.items.map((it) => ({
          id: it.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
          productId: it.productId,
        })),
      },
    };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "Lỗi tải phiếu" };
  }
}
