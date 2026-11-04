"use client";

import Link from "next/link";

import { useEffect, useState, useTransition, useRef } from "react";
import {
  Loader2,
  Printer,
  User,
  Wrench,
  Plus,
  Trash2,
  Save,
  PackageCheck,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SelectField } from "@/components/ui/select-field";
import {
  ProductPickerInput,
  type PickerProduct,
} from "@/components/product-picker-input";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import { ServiceStatusActions } from "../service/[id]/service-status-actions";
import { ReturnDialog } from "../service/[id]/return-dialog";
import {
  getTicketForTab,
  addServiceItems,
  removeServiceItem,
  updateServiceTicket,
} from "../service/actions";
import { formatVND, formatDateTime } from "@/lib/format";
import { printInBackground } from "@/lib/print";

type Technician = { id: string; name: string };
type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  price: number;
  stock: number;
  categoryType: string;
  categoryId: string;
};

const DEVICE_TYPES = [
  { value: "phone", label: "Điện thoại" },
  { value: "laptop", label: "Laptop" },
  { value: "tablet", label: "Máy tính bảng" },
  { value: "other", label: "Khác" },
];

type TicketData = NonNullable<
  Awaited<ReturnType<typeof getTicketForTab>> extends infer R
    ? R extends { ok: true; ticket: infer T }
      ? T
      : never
    : never
>;

export function TicketTab({
  ticketId,
  technicians,
  products,
  onClosed,
  isActive,
  setDirty,
}: {
  ticketId: string;
  technicians: Technician[];
  products: Product[];
  onClosed: () => void;
  isActive?: boolean;
  setDirty?: (dirty: boolean) => void;
}) {
  const closeRef = onClosed;
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!isActive && hasLoadedRef.current) return;
    let alive = true;
    setLoading(true);
    getTicketForTab(ticketId).then((res) => {
      if (!alive) return;
      if (res.ok) {
        setData(res.ticket);
        setError(null);
        hasLoadedRef.current = true;
      } else {
        setError(res.error || "Không tải được phiếu");
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [ticketId, version, isActive]);

  // Allow delivered tickets to be viewed without auto-closing the tab

  if (loading || !data) {
    if (!isActive) return null;
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Đang tải phiếu...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {error || "Không tải được phiếu"}
      </div>
    );
  }

  return (
    <TicketTabInner
      key={`${data.id}-${version}`}
      ticket={data}
      technicians={technicians}
      products={products}
      onReload={() => setVersion((v) => v + 1)}
      onClosed={closeRef}
      setDirty={setDirty}
    />
  );
}

function TicketTabInner({
  ticket,
  technicians,
  products,
  onReload,
  onClosed,
  setDirty,
}: {
  ticket: TicketData;
  technicians: Technician[];
  products: Product[];
  onReload: () => void;
  onClosed: () => void;
  setDirty?: (dirty: boolean) => void;
}) {
  const isDelivered = ticket.status === "delivered";
  const [pending, startTransition] = useTransition();
  const [returnOpen, setReturnOpen] = useState(false);

  const [form, setForm] = useState({
    customerName: ticket.customer?.name || "Khách lẻ",
    customerPhone: ticket.customer?.phone || "",
    deviceType: ticket.deviceType,
    deviceBrand: ticket.deviceBrand || "",
    deviceModel: ticket.deviceModel || "",
    imei: ticket.imei || "",
    accessories: ticket.accessories || "",
    appearance: ticket.appearance || "",
    problem: ticket.problem,
    deposit: String(ticket.deposit || 0),
    warranty: String(ticket.warranty || 0),
    promisedAt: ticket.promisedAt || "",
    assignedToId: ticket.assignedToId || "",
    note: ticket.note || "",
  });

  const hasChanges =
    form.customerName !== (ticket.customer?.name || "Khách lẻ") ||
    form.customerPhone !== (ticket.customer?.phone || "") ||
    form.deviceType !== ticket.deviceType ||
    form.deviceBrand !== (ticket.deviceBrand || "") ||
    form.deviceModel !== (ticket.deviceModel || "") ||
    form.imei !== (ticket.imei || "") ||
    form.accessories !== (ticket.accessories || "") ||
    form.appearance !== (ticket.appearance || "") ||
    form.problem !== ticket.problem ||
    Number(form.deposit) !== (ticket.deposit || 0) ||
    Number(form.warranty) !== (ticket.warranty || 0) ||
    form.promisedAt !== (ticket.promisedAt || "") ||
    form.assignedToId !== (ticket.assignedToId || "") ||
    form.note !== (ticket.note || "");

  const setDirtyRef = useRef(setDirty);
  useEffect(() => {
    setDirtyRef.current = setDirty;
  }, [setDirty]);

  useEffect(() => {
    setDirtyRef.current?.(hasChanges);
    return () => {
      setDirtyRef.current?.(false);
    };
  }, [hasChanges]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const itemsTotal = ticket.items.reduce((s, i) => s + i.subtotal, 0);

  function buildPayload() {
    return {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      deviceType: form.deviceType,
      deviceBrand: form.deviceBrand.trim() || null,
      deviceModel: form.deviceModel.trim() || null,
      imei: form.imei.trim() || null,
      accessories: form.accessories.trim() || null,
      appearance: form.appearance.trim() || null,
      problem: form.problem.trim(),
      deposit: Number(form.deposit) || 0,
      warranty: Number(form.warranty) || 0,
      promisedAt: form.promisedAt || null,
      assignedToId: form.assignedToId || null,
      note: form.note.trim(),
    };
  }

  function validate() {
    if (!form.customerName.trim()) {
      toast.error("Tên khách hàng không được trống");
      return false;
    }
    if (!form.customerPhone.trim()) {
      toast.error("SĐT khách hàng không được trống");
      return false;
    }
    if (!form.deviceBrand.trim()) {
      toast.error("Hãng máy không được trống");
      return false;
    }
    if (!form.deviceModel.trim()) {
      toast.error("Model máy không được trống");
      return false;
    }
    if (!form.problem.trim()) {
      toast.error("Tình trạng / yêu cầu không được trống");
      return false;
    }
    return true;
  }

  function handleSave(thenReturn: boolean) {
    if (!validate()) return;
    startTransition(async () => {
      const r = await updateServiceTicket(ticket.id, buildPayload());
      if (r.ok) {
        toast.success("Đã lưu thông tin");
        if (thenReturn) {
          setReturnOpen(true);
        } else {
          onReload();
        }
      } else {
        toast.error(r.error || "Lỗi");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  <CardTitle className="text-base">
                    Phiếu {ticket.code}
                  </CardTitle>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tiếp nhận {formatDateTime(new Date(ticket.receivedAt))}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ServiceStatusBadge status={ticket.status} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    printInBackground(`/service/${ticket.id}/intake`)
                  }
                >
                  <Printer className="size-3.5" />
                  In phiếu nhận
                </Button>
                {isDelivered && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
                    onClick={() =>
                      printInBackground(`/service/${ticket.id}/return`)
                    }
                  >
                    <Printer className="size-3.5" />
                    In phiếu trả
                  </Button>
                )}
                <Link
                  href={`/service/${ticket.id}`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold ml-1"
                >
                  Chi tiết hồ sơ
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="size-3.5 text-muted-foreground" />
                <div className="text-[11px] uppercase text-muted-foreground tracking-wide">
                  Khách hàng · Mã {ticket.customer?.code || ""}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FieldInput
                  label="Tên khách hàng *"
                  value={form.customerName}
                  onChange={(v) => set("customerName", v)}
                  disabled={isDelivered}
                />
                <FieldInput
                  label="SĐT *"
                  value={form.customerPhone}
                  onChange={(v) => set("customerPhone", v)}
                  disabled={isDelivered}
                />
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide mb-2">
                Thiết bị
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <FieldWrap label="Loại máy *">
                  <SelectField
                    value={form.deviceType}
                    onValueChange={(v) => set("deviceType", v)}
                    options={DEVICE_TYPES}
                    className="w-full"
                    disabled={isDelivered}
                  />
                </FieldWrap>
                <FieldInput
                  label="Hãng *"
                  value={form.deviceBrand}
                  onChange={(v) => set("deviceBrand", v)}
                  disabled={isDelivered}
                />
                <FieldInput
                  label="Model *"
                  value={form.deviceModel}
                  onChange={(v) => set("deviceModel", v)}
                  disabled={isDelivered}
                />
                <FieldInput
                  label="IMEI / Serial"
                  value={form.imei}
                  onChange={(v) => set("imei", v)}
                  disabled={isDelivered}
                />
                <FieldInput
                  label="Phụ kiện"
                  value={form.accessories}
                  onChange={(v) => set("accessories", v)}
                  disabled={isDelivered}
                />
                <FieldInput
                  label="Tình trạng máy"
                  value={form.appearance}
                  onChange={(v) => set("appearance", v)}
                  disabled={isDelivered}
                />
              </div>
              <div className="mt-2">
                <FieldWrap label="Tình trạng / Yêu cầu *">
                  <Textarea
                    rows={2}
                    value={form.problem}
                    onChange={(e) => set("problem", e.target.value)}
                    disabled={isDelivered}
                  />
                </FieldWrap>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] uppercase text-muted-foreground tracking-wide">
                  Báo giá ({ticket.items.length} mục) ·{" "}
                  {formatVND(itemsTotal)}
                </div>
              </div>
              {ticket.items.length > 0 ? (
                <div className="rounded-md border divide-y text-xs">
                  {ticket.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 px-2.5 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {it.description}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {it.quantity} × {formatVND(it.unitPrice)}
                        </div>
                      </div>
                      <div className="font-semibold shrink-0">
                        {formatVND(it.subtotal)}
                      </div>
                      {!isDelivered && (
                        <button
                          type="button"
                          onClick={async () => {
                            const r = await removeServiceItem(it.id);
                            if (r.ok) {
                              toast.success("Đã xoá");
                              onReload();
                            } else {
                              toast.error(r.error || "Lỗi");
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Xoá"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  Chưa có dịch vụ nào.
                </div>
              )}
              {!isDelivered && (
                <AddItemRow
                  ticketId={ticket.id}
                  products={products}
                  onAdded={onReload}
                />
              )}
            </div>

            <Separator />

            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide mb-2">
                Ghi chú nội bộ
              </div>
              <Textarea
                rows={2}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                disabled={isDelivered}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Card className="overflow-visible">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tất toán</CardTitle>
            <CardDescription className="text-xs">
              Cập nhật thông tin & trả máy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-primary/5 p-2.5 text-sm">
              <span className="font-medium">Tổng báo giá</span>
              <span className="text-base font-bold text-primary">
                {formatVND(itemsTotal)}
              </span>
            </div>

            <FieldWrap label="Đặt cọc (VND)">
              <Input
                type="number"
                min={0}
                step={1000}
                value={form.deposit}
                onChange={(e) => set("deposit", e.target.value)}
                disabled={isDelivered}
              />
            </FieldWrap>

            <FieldWrap label="Hẹn trả">
              <Input
                type="datetime-local"
                value={form.promisedAt}
                onChange={(e) => set("promisedAt", e.target.value)}
                disabled={isDelivered}
              />
            </FieldWrap>

            <FieldWrap label="KTV phụ trách">
              <SelectField
                value={form.assignedToId}
                onValueChange={(v) => set("assignedToId", v)}
                placeholder="Chưa phân công"
                options={technicians.map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
                className="w-full"
                disabled={isDelivered}
              />
            </FieldWrap>

            <FieldWrap label="Bảo hành (tháng)">
              <Input
                type="number"
                min={0}
                value={form.warranty}
                onChange={(e) => set("warranty", e.target.value)}
                disabled={isDelivered}
              />
            </FieldWrap>

            {!isDelivered && (
              <>
                <Separator className="my-1" />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={pending}
                    className="flex-1"
                  >
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Lưu
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={pending}
                    className="flex-1"
                  >
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <PackageCheck className="size-4" />
                    )}
                    Lưu & Trả máy
                  </Button>
                </div>
                <ReturnDialog
                  ticketId={ticket.id}
                  ticketCode={ticket.code}
                  existingItems={ticket.items.map((i) => ({
                    id: i.id,
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    subtotal: i.subtotal,
                  }))}
                  deposit={Number(form.deposit) || 0}
                  initialFinalCost={ticket.finalCost || itemsTotal}
                  initialPaid={ticket.paid}
                  products={products}
                  open={returnOpen}
                  onOpenChange={setReturnOpen}
                  hideTrigger
                  onDelivered={onClosed}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Trạng thái phiếu</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceStatusActions
              ticketId={ticket.id}
              currentStatus={ticket.status}
            />
          </CardContent>
        </Card>

        {!isDelivered && (
          <button
            type="button"
            onClick={onReload}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
          >
            Tải lại phiếu
          </button>
        )}
      </div>
    </div>
  );
}

function FieldWrap({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <FieldWrap label={label}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </FieldWrap>
  );
}

function AddItemRow({
  ticketId,
  products,
  onAdded,
}: {
  ticketId: string;
  products: PickerProduct[];
  onAdded: () => void;
}) {
  const [productId, setProductId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [pending, startTransition] = useTransition();

  function reset() {
    setProductId(null);
    setDescription("");
    setQuantity(1);
    setUnitPrice(0);
  }

  function handleAdd() {
    if (!description.trim()) {
      toast.error("Chọn dịch vụ hoặc nhập tên");
      return;
    }
    startTransition(async () => {
      const r = await addServiceItems(ticketId, [
        { productId, description: description.trim(), quantity, unitPrice },
      ]);
      if (r.ok) {
        toast.success("Đã thêm");
        reset();
        onAdded();
      } else {
        toast.error(r.error || "Lỗi");
      }
    });
  }

  return (
    <div className="mt-2 grid grid-cols-12 gap-1.5 items-start">
      <div className="col-span-12 sm:col-span-6">
        <ProductPickerInput
          products={products}
          value={description}
          onTextChange={(t) => {
            setDescription(t);
            setProductId(null);
          }}
          onSelect={(p) => {
            setProductId(p.id);
            setDescription(p.name);
            setUnitPrice(p.price);
          }}
          placeholder="Tìm dịch vụ / sản phẩm trong kho..."
        />
      </div>
      <div className="col-span-3 sm:col-span-2">
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          placeholder="SL"
        />
      </div>
      <div className="col-span-5 sm:col-span-3">
        <Input
          type="number"
          min={0}
          step={1000}
          value={unitPrice || ""}
          onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
          placeholder="Đơn giá"
        />
      </div>
      <div className="col-span-4 sm:col-span-1">
        <Button
          type="button"
          size="icon"
          onClick={handleAdd}
          disabled={pending}
          aria-label="Thêm dịch vụ"
          className="w-full"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
