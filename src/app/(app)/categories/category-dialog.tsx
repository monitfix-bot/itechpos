"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import {
  Plus, Loader2,
  Laptop, Smartphone, Wrench, Headphones, Package, Monitor,
  Tablet, Watch, Camera, Cpu, HardDrive, Wifi, Battery, Cable,
  Printer, Mouse, Keyboard, Speaker, Gamepad2, ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory } from "./actions";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  { name: "laptop", icon: Laptop, label: "Laptop" },
  { name: "smartphone", icon: Smartphone, label: "Điện thoại" },
  { name: "tablet", icon: Tablet, label: "Máy tính bảng" },
  { name: "monitor", icon: Monitor, label: "Màn hình" },
  { name: "watch", icon: Watch, label: "Đồng hồ" },
  { name: "headphones", icon: Headphones, label: "Tai nghe" },
  { name: "camera", icon: Camera, label: "Camera" },
  { name: "cpu", icon: Cpu, label: "Linh kiện" },
  { name: "hard-drive", icon: HardDrive, label: "Ổ cứng" },
  { name: "wifi", icon: Wifi, label: "Mạng" },
  { name: "battery", icon: Battery, label: "Pin/Sạc" },
  { name: "cable", icon: Cable, label: "Cáp" },
  { name: "printer", icon: Printer, label: "Máy in" },
  { name: "mouse", icon: Mouse, label: "Chuột" },
  { name: "keyboard", icon: Keyboard, label: "Bàn phím" },
  { name: "speaker", icon: Speaker, label: "Loa" },
  { name: "gamepad-2", icon: Gamepad2, label: "Gaming" },
  { name: "wrench", icon: Wrench, label: "Sửa chữa" },
  { name: "package", icon: Package, label: "Khác" },
  { name: "shopping-bag", icon: ShoppingBag, label: "Phụ kiện" },
];

const CATEGORY_TYPES = [
  { value: "laptop", label: "Laptop" },
  { value: "phone", label: "Điện thoại" },
  { value: "accessory", label: "Phụ kiện" },
  { value: "service", label: "Dịch vụ sửa chữa" },
];

type ExistingCategory = {
  id: string;
  name: string;
  type: string;
  skuPrefix: string;
  icon: string;
};

export function CategoryDialog({
  category,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  category?: ExistingCategory;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const isEdit = !!category;
  const [pending, startTransition] = useTransition();
  const initial = () => ({
    name: category?.name ?? "",
    type: category?.type ?? "laptop",
    skuPrefix: category?.skuPrefix ?? "",
    icon: category?.icon ?? "package",
  });
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (open) setForm(initial());
  }, [open, category?.id]);

  function set<K extends keyof ReturnType<typeof initial>>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    if (!form.skuPrefix.trim()) {
      toast.error("Vui lòng nhập mã SKU prefix");
      return;
    }
    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        skuPrefix: form.skuPrefix.trim().toUpperCase(),
        icon: form.icon,
      };
      const res = isEdit && category
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);
      if (res.ok) {
        toast.success(isEdit ? "Đã lưu thay đổi" : "Đã thêm danh mục");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : !isEdit && openProp === undefined ? (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Plus className="size-4" />
          Thêm loại
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa danh mục" : "Thêm danh mục sản phẩm mới"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
             <p className="text-[11px] text-primary leading-relaxed">
               <strong>Lưu ý:</strong> Danh mục giúp bạn nhóm sản phẩm. <br/>
               Hãy chọn <strong>Phân loại hệ thống</strong> đúng để phần mềm tự động hiển thị các trường dữ liệu phù hợp (như IMEI cho điện thoại, hoặc các trường kỹ thuật cho sửa chữa).
             </p>
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">Chọn biểu tượng</Label>
            <div className="grid grid-cols-10 gap-1">
              {ICON_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => set("icon", opt.name)}
                    className={cn(
                      "size-9 rounded-lg flex items-center justify-center transition-all",
                      form.icon === opt.name
                        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={opt.label}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Tên danh mục *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="VD: Laptop Dell, Thay màn hình..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Mã SKU Prefix *</Label>
              <Input
                value={form.skuPrefix}
                onChange={(e) => set("skuPrefix", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="VD: LT"
                maxLength={4}
                className="font-mono uppercase tracking-widest"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">Phân loại hệ thống</Label>
            <SelectField
              value={form.type}
              onValueChange={(v) => set("type", v)}
              options={CATEGORY_TYPES}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground italic">
              * Quyết định cách hệ thống xử lý tồn kho và dịch vụ cho danh mục này.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">
            Sản phẩm mới sẽ tự động mã: <span className="font-mono font-bold text-foreground">{form.skuPrefix || "XX"}0001</span>, <span className="font-mono font-bold text-foreground">{form.skuPrefix || "XX"}0002</span>...
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Lưu" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
