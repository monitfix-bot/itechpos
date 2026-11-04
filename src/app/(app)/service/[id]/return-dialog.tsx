"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, PackageCheck, Plus, Trash2, Search, Banknote, QrCode, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { printInBackground } from "@/lib/print";
import { deliverService } from "../actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  categoryType: string;
};

type ExistingItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type ExtraDraft = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  productId: string | null;
};

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Tiền mặt" },
  { value: "transfer", label: "Chuyển khoản VietQR" },
  { value: "split", label: "Kết hợp (Tiền mặt + Chuyển khoản)" },
];

export function ReturnDialog({
  ticketId,
  ticketCode,
  existingItems,
  deposit,
  initialFinalCost,
  initialPaid,
  products,
  open: openProp,
  onOpenChange,
  hideTrigger,
  onDelivered,
}: {
  ticketId: string;
  ticketCode: string;
  existingItems: ExistingItem[];
  deposit: number;
  initialFinalCost: number;
  initialPaid: number;
  products: Product[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onDelivered?: () => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [pending, startTransition] = useTransition();
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [solution, setSolution] = useState("");
  const [warranty, setWarranty] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [splitCash, setSplitCash] = useState<string>("");
  const [splitTransfer, setSplitTransfer] = useState<string>("");
  const [productPicker, setProductPicker] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const matchedProducts = useMemo(() => {
    if (!productPicker.trim()) return [];
    const q = productPicker.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [productPicker, products]);

  function addCustomLine() {
    setExtras((curr) => [
      ...curr,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        productId: null,
      },
    ]);
  }

  function addProduct(p: Product) {
    setExtras((curr) => {
      const idx = curr.findIndex((x) => x.productId === p.id);
      if (idx >= 0) {
        const next = [...curr];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...curr,
        {
          id: crypto.randomUUID(),
          description: p.name,
          quantity: 1,
          unitPrice: p.price,
          productId: p.id,
        },
      ];
    });
    setProductPicker("");
    setShowPicker(false);
  }

  function updateExtra(id: string, patch: Partial<ExtraDraft>) {
    setExtras((curr) =>
      curr.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  }
  function removeExtra(id: string) {
    setExtras((curr) => curr.filter((x) => x.id !== id));
  }

  function handlePaymentMethodChange(val: string) {
    setPaymentMethod(val);
    if (val === "split" && !splitCash && !splitTransfer) {
      const half = Math.round(paidThisTime / 2);
      setSplitCash(String(half));
      setSplitTransfer(String(paidThisTime - half));
    }
  }

  function handleSplitCashChange(val: string) {
    setSplitCash(val);
    const num = Number(val) || 0;
    const rem = Math.max(0, paidThisTime - num);
    setSplitTransfer(String(rem));
  }

  function handleSplitTransferChange(val: string) {
    setSplitTransfer(val);
    const num = Number(val) || 0;
    const rem = Math.max(0, paidThisTime - num);
    setSplitCash(String(rem));
  }

  const validExtras = extras.filter(
    (x) => x.description.trim() && x.quantity > 0,
  );
  const extrasTotal = validExtras.reduce(
    (s, x) => s + x.unitPrice * x.quantity,
    0,
  );
  const existingTotal = existingItems.reduce((s, x) => s + x.subtotal, 0);
  const finalCost = existingTotal + extrasTotal;
  const due = Math.max(0, finalCost - deposit - initialPaid);
  const [paidNow, setPaidNow] = useState<string>("");
  const paidThisTime = Number(paidNow) || due;
  const totalPaid = initialPaid + paidThisTime;

  function submit() {
    if (paidThisTime < 0) {
      toast.error("Số tiền không hợp lệ");
      return;
    }
    startTransition(async () => {
      const res = await deliverService({
        ticketId,
        extraItems: validExtras.map((x) => ({
          description: x.description.trim(),
          quantity: x.quantity,
          unitPrice: x.unitPrice,
          productId: x.productId,
        })),
        paymentMethod,
        paid: totalPaid,
        warranty: Number(warranty) || 0,
        solution: solution.trim(),
        note: "",
        splitCash: paymentMethod === "split" ? (Number(splitCash) || 0) : undefined,
        splitTransfer: paymentMethod === "split" ? (Number(splitTransfer) || 0) : undefined,
      });
      if (res.ok) {
        toast.success(`Đã trả máy phiếu ${ticketCode}`);
        setOpen(false);
        await printInBackground(`/service/${ticketId}/return`);
        if (onDelivered) {
          onDelivered();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger render={<Button className="w-full" size="lg" />}>
          <PackageCheck className="size-4" />
          Trả máy & Thanh toán
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trả máy & Thanh toán</DialogTitle>
          <DialogDescription>
            Phiếu <span className="font-mono">{ticketCode}</span> · thêm dịch
            vụ/sản phẩm phát sinh (nếu có) trước khi tất toán.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {existingItems.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Dịch vụ trên phiếu</Label>
              <div className="rounded-md border divide-y text-sm">
                {existingItems.map((it) => (
                  <div
                    key={it.id}
                    className="flex justify-between px-3 py-2"
                  >
                    <span>
                      {it.description}
                      {it.quantity > 1 && (
                        <span className="text-muted-foreground">
                          {" "}
                          × {it.quantity}
                        </span>
                      )}
                    </span>
                    <span className="font-medium">
                      {formatVND(it.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Phát sinh thêm (nếu có)</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPicker((s) => !s)}
                  className="h-7 text-xs"
                >
                  <Search className="size-3" />
                  Sản phẩm
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomLine}
                  className="h-7 text-xs"
                >
                  <Plus className="size-3" />
                  Dịch vụ
                </Button>
              </div>
            </div>

            {showPicker && (
              <div className="rounded-md border bg-muted/30 p-2 space-y-2">
                <Input
                  autoFocus
                  placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                  value={productPicker}
                  onChange={(e) => setProductPicker(e.target.value)}
                  className="h-8"
                />
                {matchedProducts.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-md border bg-popover divide-y">
                    {matchedProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.sku} · Còn {p.stock}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-primary shrink-0">
                          {formatVND(p.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {extras.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                Không có phát sinh
              </div>
            ) : (
              <div className="space-y-1.5">
                {extras.map((x) => (
                  <div
                    key={x.id}
                    className="grid grid-cols-12 gap-1.5 items-start"
                  >
                    <Input
                      value={x.description}
                      onChange={(e) =>
                        updateExtra(x.id, { description: e.target.value })
                      }
                      placeholder="Dịch vụ / sản phẩm"
                      className="col-span-6 h-8"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={x.quantity}
                      onChange={(e) =>
                        updateExtra(x.id, {
                          quantity: Number(e.target.value) || 1,
                        })
                      }
                      className="col-span-2 h-8 text-center"
                    />
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={x.unitPrice || ""}
                      onChange={(e) =>
                        updateExtra(x.id, {
                          unitPrice: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="Đơn giá"
                      className="col-span-3 h-8"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExtra(x.id)}
                      className="col-span-1 size-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Đã thực hiện</Label>
            <Textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={2}
              placeholder="Mô tả những gì đã sửa / thay thế..."
            />
          </div>

          <div className="rounded-2xl border border-border/80 bg-slate-50/50 p-5 space-y-3.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Tổng dịch vụ trên phiếu</span>
              <span className="font-bold text-slate-700">{formatVND(existingTotal)}</span>
            </div>
            {extrasTotal > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Phát sinh thêm</span>
                <span className="font-bold text-slate-700">{formatVND(extrasTotal)}</span>
              </div>
            )}
            <Separator className="bg-slate-200/60" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-900">Tổng chi phí cuối</span>
              <span className="text-lg font-black text-slate-900">{formatVND(finalCost)}</span>
            </div>
            
            <div className="space-y-2 pt-1">
              {deposit > 0 && (
                <div className="flex justify-between items-center text-[13px] bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100/50">
                  <span className="text-emerald-700 font-medium">Đã đặt cọc</span>
                  <span className="font-bold text-emerald-700">-{formatVND(deposit)}</span>
                </div>
              )}
              {initialPaid > 0 && (
                <div className="flex justify-between items-center text-[13px] bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50">
                  <span className="text-blue-700 font-medium">Đã thanh toán trước</span>
                  <span className="font-bold text-blue-700">-{formatVND(initialPaid)}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300">
               <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Số tiền cần thu</span>
                    <span className="text-2xl font-black text-primary tracking-tight">
                       {formatVND(due)}
                    </span>
                  </div>
                  {due === 0 && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-none px-3 py-1 rounded-full font-bold">
                       ĐÃ ĐỦ
                    </Badge>
                  )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs">Phương thức</Label>
              <SelectField
                value={paymentMethod}
                onValueChange={handlePaymentMethodChange}
                options={PAYMENT_OPTIONS}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs">Bảo hành (tháng)</Label>
              <Input
                type="number"
                min={0}
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs">Khách trả lần này</Label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={paidNow}
                onChange={(e) => setPaidNow(e.target.value)}
                placeholder={String(due)}
              />
            </div>
          </div>

          {paymentMethod === "split" && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <WalletCards className="w-4 h-4" />
                  <span>Phân bổ (Tiền mặt + Chuyển khoản)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round(paidThisTime / 2);
                      setSplitCash(String(half));
                      setSplitTransfer(String(paidThisTime - half));
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 hover:bg-blue-50"
                  >
                    50 / 50
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitCash(String(paidThisTime));
                      setSplitTransfer("0");
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 hover:bg-blue-50"
                  >
                    100% TM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitCash("0");
                      setSplitTransfer(String(paidThisTime));
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 hover:bg-blue-50"
                  >
                    100% CK
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    Tiền mặt (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={splitCash}
                    onChange={(e) => handleSplitCashChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    Chuyển khoản (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={splitTransfer}
                    onChange={(e) => handleSplitTransferChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
                <span className="text-slate-500 dark:text-slate-400">Tổng khớp đợt này:</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    (Number(splitCash) || 0) + (Number(splitTransfer) || 0) === paidThisTime
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {formatVND((Number(splitCash) || 0) + (Number(splitTransfer) || 0))} / {formatVND(paidThisTime)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Huỷ
          </Button>
          <Button onClick={() => submit()} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            <PackageCheck className="size-4" />
            Hoàn tất & In phiếu trả
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${color || ""} ${bold ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
