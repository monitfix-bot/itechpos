"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import {
  CustomerPhoneField,
  type CustomerSelection,
} from "@/components/customer-phone-field";
import {
  ProductPickerInput,
  type PickerProduct,
} from "@/components/product-picker-input";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Wrench,
  Printer,
  User,
  ShoppingCart,
  ClipboardList,
  Calendar,
  Sparkles,
  Smartphone,
  Cpu,
  Layers,
  Barcode,
  Briefcase,
  Eye,
  KeyRound,
  FileCheck2,
  X,
  Zap,
  Info,
  CalendarClock,
} from "lucide-react";
import { createServiceTicket } from "./actions";
import { formatVND } from "@/lib/format";
import { printInBackground } from "@/lib/print";
import { playPosSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

type Customer = { id: string; code: string; name: string; phone: string };
type Technician = { id: string; name: string };

type ServiceItemDraft = {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
};

const DEVICE_TYPES = [
  { value: "phone", label: "Điện thoại thông minh" },
  { value: "laptop", label: "Laptop / MacBook" },
  { value: "tablet", label: "Máy tính bảng (iPad / Tablet)" },
  { value: "pc", label: "PC / Máy trạm Workstation" },
  { value: "other", label: "Thiết bị ngoại vi & Phụ kiện" },
];

export function ServiceForm({
  isActive = true,
  customers,
  technicians,
  products,
  onCreated,
}: {
  isActive?: boolean;
  customers: Customer[];
  technicians: Technician[];
  products: PickerProduct[];
  onCreated?: (info: { id: string; code: string; print: boolean }) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customer, setCustomer] = useState<CustomerSelection>({ mode: "none" });
  const [device, setDevice] = useState({
    type: "phone",
    brand: "",
    model: "",
    imei: "",
    accessories: "",
    appearance: "",
    problem: "",
  });
  const [passcode, setPasscode] = useState("");
  const [items, setItems] = useState<ServiceItemDraft[]>([
    {
      id: crypto.randomUUID(),
      productId: null,
      description: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);
  const [deposit, setDeposit] = useState<number>(0);
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [promisedAt, setPromisedAt] = useState(() => defaultPromisedAt());
  const [note, setNote] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customerError, setCustomerError] = useState(false);

  function setDev<K extends keyof typeof device>(k: K, v: string) {
    setDevice((d) => ({ ...d, [k]: v }));
  }

  function appendDevValue(field: "accessories" | "appearance" | "problem", val: string) {
    setDevice((prev) => {
      const current = prev[field];
      const next = current ? `${current}, ${val}` : val;
      return { ...prev, [field]: next };
    });
    playPosSound("tab");
  }

  function addItem() {
    setItems((curr) => [
      ...curr,
      {
        id: crypto.randomUUID(),
        productId: null,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
    playPosSound("tab");
  }

  function addPresetService(desc: string, price: number) {
    // Check if first row is empty
    if (items.length === 1 && !items[0].description && items[0].unitPrice === 0) {
      setItems([{ id: items[0].id, productId: null, description: desc, quantity: 1, unitPrice: price }]);
    } else {
      setItems((curr) => [
        ...curr,
        {
          id: crypto.randomUUID(),
          productId: null,
          description: desc,
          quantity: 1,
          unitPrice: price,
        },
      ]);
    }
    playPosSound("beep");
    toast.success(`Đã thêm dịch vụ: ${desc}`);
  }

  function updateItem(id: string, patch: Partial<ServiceItemDraft>) {
    setItems((curr) => curr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    if (items.length <= 1) {
      setItems([{ id: crypto.randomUUID(), productId: null, description: "", quantity: 1, unitPrice: 0 }]);
    } else {
      setItems((curr) => curr.filter((i) => i.id !== id));
    }
    playPosSound("warn");
  }

  const validItems = items.filter((i) => i.description.trim() && i.quantity > 0);
  const estimatedCost = validItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const balanceDue = Math.max(0, estimatedCost - (Number(deposit) || 0));

  function setQuickDeposit(amount: number) {
    setDeposit(amount);
    playPosSound("beep");
  }

  function setDepositPercent(percent: number) {
    const val = Math.round((estimatedCost * percent) / 100);
    setDeposit(val);
    playPosSound("beep");
  }

  function addPromisedHours(hours: number) {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const pad = (n: number) => String(n).padStart(2, "0");
    setPromisedAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    playPosSound("tab");
  }

  function setPromisedTomorrow17h() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    setPromisedAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    playPosSound("tab");
  }

  

  

    function handleCancel() {
    if (confirm("Làm mới và hủy bỏ thông tin phiếu sửa này?")) {
      setDevice({
        type: "phone",
        brand: "",
        model: "",
        imei: "",
        accessories: "",
        appearance: "",
        problem: "",
      });
      setPasscode("");
      setNote("");
      setCustomer({ mode: "none" });
      setItems([{ id: crypto.randomUUID(), productId: null, description: "", quantity: 1, unitPrice: 0 }]);
      setDeposit(0);
      playPosSound("warn");
      toast.info("Đã làm mới thông tin phiếu tiếp nhận");
    }
  }

  useEffect(() => {
    function handleShortcut(e: Event) {
      if (!isActive) return;
      const customEvent = e as CustomEvent;
      const key = customEvent.detail;
      if (key === "F2") {
        document.getElementById("rep-brand-input")?.focus();
      } else if (key === "F4") {
        const input = document.getElementById("customer-phone-input") as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      } else if (key === "F9") {
        if (!isCustomerValid()) {
          toast.error("⚠️ Vui lòng nhập thông tin khách hàng trước khi tạo phiếu!");
          playPosSound("warn");
          setCustomerError(true);
          setTimeout(() => setCustomerError(false), 2500);
          const input = document.getElementById("customer-phone-input") as HTMLInputElement | null;
          if (input) {
            input.focus();
            input.select();
          }
          return;
        }
        setPreviewOpen(true);
      }
    }
    window.addEventListener("pos-shortcut", handleShortcut);
    return () => window.removeEventListener("pos-shortcut", handleShortcut);
  }, [isActive, customer, device, validItems, estimatedCost, deposit, assignedToId, promisedAt, note, passcode]);

    function isCustomerValid(): boolean {
    if (customer.mode === "existing") return true;
    if (customer.mode === "new") {
      return Boolean(customer.phone.trim() && customer.name.trim());
    }
    return false;
  }

  function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!isCustomerValid()) {
      toast.error("⚠️ Vui lòng nhập thông tin khách hàng (SĐT & Tên) trước khi tạo phiếu!");
      playPosSound("warn");
      setCustomerError(true);
      setTimeout(() => setCustomerError(false), 2500);
      const input = document.getElementById("customer-phone-input") as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }
    if (customer.mode === "new" && !customer.name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng mới");
      return;
    }
    if (!device.brand.trim()) {
      toast.error("Vui lòng nhập hãng sản xuất máy");
      return;
    }
    if (!device.model.trim()) {
      toast.error("Vui lòng nhập model máy");
      return;
    }
    if (!device.problem.trim()) {
      toast.error("Vui lòng mô tả hiện tượng lỗi / yêu cầu");
      return;
    }

    const fullNote = [
      passcode.trim() ? `Mật khẩu mở máy: ${passcode.trim()}` : "",
      note.trim(),
    ].filter(Boolean).join(" | ");

    const payload = {
      customer:
        customer.mode === "existing"
          ? { id: customer.customer.id }
          : customer.mode === "new"
            ? { name: customer.name.trim(), phone: customer.phone.trim() }
            : { name: "", phone: "" },
      device: {
        type: device.type,
        brand: device.brand.trim() || null,
        model: device.model.trim() || null,
        imei: device.imei.trim() || null,
        accessories: device.accessories.trim() || null,
        appearance: device.appearance.trim() || null,
        problem: device.problem.trim(),
      },
      items: validItems.map((i) => ({
        productId: i.productId,
        description: i.description.trim(),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      estimatedCost,
      deposit: Number(deposit) || 0,
      assignedToId: assignedToId || null,
      promisedAt: promisedAt || null,
      note: fullNote || null,
    };

    startTransition(async () => {
      const res = await createServiceTicket(payload);
      if (res.ok) {
        playPosSound("success");
        toast.success(`Tạo phiếu ${res.code} thành công!`);
        await printInBackground(`/service/${res.id}/intake`);
        if (onCreated) {
          onCreated({ id: res.id, code: res.code, print: true });
        } else {
          router.push(`/service/${res.id}`);
        }
      } else {
        playPosSound("warn");
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-24 lg:pb-10 items-start">
        {/* Left Column (8/12): Hardware Info, Quote Services, Notes */}
        <div className="lg:col-span-8 space-y-5">
          {/* CARD 1: THÔNG TIN THIẾT BỊ TIẾP NHẬN */}
          <section className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            {/* Header Card */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-transparent dark:from-blue-950/40 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Thông Tin Thiết Bị Tiếp Nhận
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ghi nhận chi tiết cấu hình, ngoại quan và hiện tượng lỗi ban đầu
                  </p>
                </div>
              </div>

              
            </div>

            {/* Body Form */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Loại thiết bị */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Loại thiết bị <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <SelectField
                      value={device.type}
                      onValueChange={(v) => setDev("type", v)}
                      options={DEVICE_TYPES}
                      className="w-full h-11 rounded-2xl text-xs sm:text-sm font-bold bg-slate-50/90 dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Hãng sản xuất */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Hãng sản xuất <span className="text-rose-500">*</span>
                  </label>
                  <div className="input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
                    <Cpu className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="text"
                      id="rep-brand-input"
                      value={device.brand}
                      onChange={(e) => setDev("brand", e.target.value)}
                      placeholder="Apple, Dell, Asus, Samsung..."
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Model máy */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Model máy <span className="text-rose-500">*</span>
                  </label>
                  <div className="input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
                    <Layers className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="text"
                      value={device.model}
                      onChange={(e) => setDev("model", e.target.value)}
                      placeholder="VD: ThinkPad X1, iPhone 14 Pro..."
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* IMEI / Serial */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Số IMEI / Serial
                  </label>
                  <div className="input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
                    <Barcode className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="text"
                      value={device.imei}
                      onChange={(e) => setDev("imei", e.target.value)}
                      placeholder="Nhập IMEI hoặc số Serial..."
                      className="w-full bg-transparent font-mono text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phụ kiện kèm theo + quick chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Phụ kiện kèm theo
                  </label>
                  <div className="input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
                    <Briefcase className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="text"
                      value={device.accessories}
                      onChange={(e) => setDev("accessories", e.target.value)}
                      placeholder="Sạc, cáp, túi chống sốc..."
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => appendDevValue("accessories", "Chỉ nhận thân máy")}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-[10px] font-semibold text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      + Chỉ thân máy
                    </button>
                    <button
                      type="button"
                      onClick={() => appendDevValue("accessories", "Kèm sạc zin")}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-[10px] font-semibold text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      + Sạc zin
                    </button>
                    <button
                      type="button"
                      onClick={() => appendDevValue("accessories", "Túi chống sốc")}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-[10px] font-semibold text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      + Túi
                    </button>
                  </div>
                </div>

                {/* Ngoại quan khi nhận + quick chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Ngoại quan khi nhận
                  </label>
                  <div className="input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
                    <Eye className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="text"
                      value={device.appearance}
                      onChange={(e) => setDev("appearance", e.target.value)}
                      placeholder="Trầy góc, móp viền, xước màn..."
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => appendDevValue("appearance", "Trầy nhẹ vỏ")}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-[10px] font-semibold text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      + Trầy nhẹ
                    </button>
                    <button
                      type="button"
                      onClick={() => appendDevValue("appearance", "Cấn móp góc")}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-[10px] font-semibold text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      + Cấn góc
                    </button>
                    <button
                      type="button"
                      onClick={() => appendDevValue("appearance", "Nứt kính trước")}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-[10px] font-semibold text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      + Nứt kính
                    </button>
                  </div>
                </div>
              </div>

              {/* Tình trạng báo lỗi & Yêu cầu của khách hàng + Quick Chips */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tình trạng báo lỗi & Yêu cầu của khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Chèn nhanh:</span>
                    <button
                      type="button"
                      onClick={() => appendDevValue("problem", "Mất nguồn không lên")}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold hover:bg-rose-500/20 transition-colors"
                    >
                      + Mất nguồn
                    </button>
                    <button
                      type="button"
                      onClick={() => appendDevValue("problem", "Vỡ màn hình / sọc cảm ứng")}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold hover:bg-amber-500/20 transition-colors"
                    >
                      + Vỡ / sọc màn
                    </button>
                    <button
                      type="button"
                      onClick={() => appendDevValue("problem", "Chai pin / sập nguồn")}
                      className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold hover:bg-blue-500/20 transition-colors"
                    >
                      + Chai pin
                    </button>
                    <button
                      type="button"
                      onClick={() => appendDevValue("problem", "Vô nước / ẩm mạch")}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold hover:bg-indigo-500/20 transition-colors"
                    >
                      + Vô nước
                    </button>
                  </div>
                </div>

                <div className="input-glow bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-3.5 transition-all">
                  <textarea
                    rows={3}
                    value={device.problem}
                    onChange={(e) => setDev("problem", e.target.value)}
                    placeholder="Mô tả hiện tượng lỗi (mất nguồn, vỡ màn, chai pin, không nhận sạc...) và mong muốn cụ thể của khách..."
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* CARD 2: DỰ TOÁN LINH KIỆN & DỊCH VỤ THAY THẾ */}
          <section className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Dự Toán Linh Kiện & Dịch Vụ Thay Thế
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chọn nhanh dịch vụ kho hoặc thêm dòng linh kiện để tự động tính tổng chi phí
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-blue-600 dark:hover:bg-blue-500 text-white dark:text-slate-900 dark:hover:text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm dòng</span>
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Chọn nhanh từ kho:
                </span>
                <button
                  type="button"
                  onClick={() => addPresetService("Thay màn hình iPhone Zin bóc máy (BH 6T)", 3200000)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 transition-all"
                >
                  + Màn hình iPhone Zin (3.200.000đ)
                </button>
                <button
                  type="button"
                  onClick={() => addPresetService("Thay Pin Zin dung lượng chuẩn (BH 12T)", 1450000)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 transition-all"
                >
                  + Thay Pin Zin (1.450.000đ)
                </button>
                <button
                  type="button"
                  onClick={() => addPresetService("Vệ sinh chuyên sâu + Tra keo tản nhiệt gốm", 200000)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 transition-all"
                >
                  + Vệ sinh & Tra keo (200.000đ)
                </button>
                <button
                  type="button"
                  onClick={() => addPresetService("Sửa lỗi IC nguồn / Cấp nguồn main", 1800000)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 transition-all"
                >
                  + Sửa IC Nguồn (1.800.000đ)
                </button>
              </div>

              {/* Items Table */}
              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 items-center transition-all hover:border-blue-400 dark:hover:border-blue-600"
                  >
                    <div className="col-span-12 sm:col-span-6">
                      <ProductPickerInput
                        products={products}
                        value={item.description}
                        onTextChange={(text) => updateItem(item.id, { description: text, productId: null })}
                        onSelect={(p) =>
                          updateItem(item.id, {
                            productId: p.id,
                            description: p.name,
                            unitPrice: p.price,
                          })
                        }
                        placeholder={idx === 0 ? "Chọn linh kiện kho hoặc gõ dịch vụ..." : "Hạng mục linh kiện khác..."}
                        className="h-10 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 p-1">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          value={item.unitPrice || ""}
                          onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })}
                          placeholder="0"
                          className="h-10 pr-7 font-mono font-extrabold text-xs sm:text-sm rounded-xl text-right bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          ₫
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center transition-colors"
                        title="Xoá dòng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CARD 3: GHI CHÚ NỘI BỘ CHO KỸ THUẬT VIÊN */}
          <section className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Ghi Chú Nội Bộ Cho Kỹ Thuật Viên
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                Không in lên phiếu khách
              </span>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 input-glow-amber flex items-center bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl px-3.5 py-2.5 transition-all">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Mật khẩu màn hình / PIN..."
                    className="w-full bg-transparent font-mono text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-7 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Lưu mật khẩu mở máy giúp KTV kiểm tra full chức năng sau khi sửa xong.</span>
                </div>
              </div>

              <div className="input-glow bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-3.5 transition-all">
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Mật khẩu máy, lưu ý đặc biệt hoặc tiền sử sửa chữa (VD: Máy đã từng ép kính 1 lần, khách cần lấy gấp trước 17h)..."
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (4/12): Customer + Quote Summary (Sticky) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
          {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG */}
          <div className={cn(
            "relative z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border p-5 shadow-sm space-y-3.5 transition-all",
            customerError
              ? "border-rose-500 dark:border-rose-500 ring-4 ring-rose-500/20 bg-rose-50/20"
              : "border-slate-200/90 dark:border-slate-800"
          )}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Khách Hàng <span className="text-rose-500">*</span>
                </h3>
              </div>
              {isCustomerValid() ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  ✓ Đã xác thực
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Bắt buộc
                </span>
              )}
            </div>

            <CustomerPhoneField
              customers={customers}
              value={customer}
              onChange={(c) => {
                setCustomer(c);
                if (customerError) setCustomerError(false);
              }}
              hasError={customerError}
              required
            />
          </div>

          {/* KHỐI 2: CHI PHÍ & HẸN TRẢ MÁY (PREMIUM PANEL) */}
          <div className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/5 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  Chi Phí & Hẹn Trả Máy
                </h3>
              </div>
              <CalendarClock className="w-4 h-4 text-slate-300" />
            </div>

            <div className="p-5 space-y-4">
              {/* Box Tổng dự kiến chi phí */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white dark:from-slate-800 dark:to-slate-800/60 border border-blue-200/70 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tổng dự kiến chi phí
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    {validItems.length} hạng mục
                  </span>
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                  {formatVND(estimatedCost)}
                </div>
              </div>

              {/* Tiền đặt cọc trước */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tiền đặt cọc trước (Nếu có)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickDeposit(200000)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      200K
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDeposit(500000)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      500K
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositPercent(50)}
                      className="px-2 py-0.5 rounded bg-amber-500/15 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
                    >
                      50%
                    </button>
                  </div>
                </div>
                <div className="input-glow flex items-center bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={deposit || ""}
                    onChange={(e) => setDeposit(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-transparent font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="font-bold text-xs text-slate-400">₫</span>
                </div>
              </div>

              {/* Còn lại cần thu khi trả máy */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Còn lại cần thu khi trả máy:
                </span>
                <span className="font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {formatVND(balanceDue)}
                </span>
              </div>

              {/* Ngày giờ hẹn trả máy + quick buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ngày giờ hẹn trả máy
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => addPromisedHours(2)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-[10px] font-bold text-slate-600 dark:text-slate-400"
                    >
                      + 2 giờ
                    </button>
                    <button
                      type="button"
                      onClick={setPromisedTomorrow17h}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-[10px] font-bold text-slate-600 dark:text-slate-400"
                    >
                      Ngày mai (17h)
                    </button>
                  </div>
                </div>
                <div className="input-glow flex items-center bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 transition-all">
                  <Calendar className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="datetime-local"
                    value={promisedAt}
                    onChange={(e) => setPromisedAt(e.target.value)}
                    className="w-full bg-transparent font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Kỹ thuật viên phụ trách */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Kỹ thuật viên phụ trách
                </label>
                <SelectField
                  value={assignedToId}
                  onValueChange={setAssignedToId}
                  placeholder="Chưa chỉ định KTV (Phân bổ sau)"
                  options={technicians.map((t) => ({ value: t.id, label: t.name }))}
                  className="w-full h-10.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  <span>LƯU & IN PHIẾU TIẾP NHẬN</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCustomerValid()) {
                        toast.error("⚠️ Vui lòng nhập thông tin khách hàng trước khi xem phiếu!");
                        playPosSound("warn");
                        setCustomerError(true);
                        setTimeout(() => setCustomerError(false), 2500);
                        document.getElementById("customer-phone-input")?.focus();
                        return;
                      }
                      setPreviewOpen(true);
                    }}
                    className="py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem trước phiếu</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>

      {/* Mobile Sticky Action Bar (Thanh cố định tạo phiếu trên điện thoại) */}
      <div className="fixed bottom-3 left-3 right-3 z-30 lg:hidden p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-700/80 text-white shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-200">
        <div className="min-w-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 truncate">
            DỰ KIẾN ({validItems.length} MỤC)
          </div>
          <div className="font-mono text-base font-extrabold text-blue-400 truncate">
            {formatVND(estimatedCost)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isCustomerValid()) {
              toast.error("⚠️ Vui lòng nhập thông tin khách hàng trước khi tạo phiếu!");
              playPosSound("warn");
              setCustomerError(true);
              setTimeout(() => setCustomerError(false), 2500);
              const input = document.getElementById("customer-phone-input") as HTMLInputElement | null;
              if (input) {
                input.focus();
                input.select();
              }
              return;
            }
            setPreviewOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 active:scale-95 shrink-0"
        >
          <Printer className="size-3.5" />
          <span>Tạo Phiếu (F9)</span>
        </button>
      </div>

      {/* Receipt Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                  Phiếu Tiếp Nhận Sửa Chữa
                </DialogTitle>
                <p className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                  Bản xem trước hóa đơn
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Khách hàng</span>
                <p className="font-extrabold text-slate-800 dark:text-white mt-0.5">
                  {customer.mode === "existing"
                    ? customer.customer.name
                    : customer.mode === "new"
                      ? customer.name || "Khách mới"
                      : "Chưa chọn khách"}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  {customer.mode === "existing"
                    ? customer.customer.phone
                    : customer.mode === "new"
                      ? customer.phone
                      : ""}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Thiết bị & Model</span>
                <p className="font-extrabold text-slate-800 dark:text-white mt-0.5">
                  {device.brand || "—"} • {device.model || "—"}
                </p>
                <p className="text-[11px] text-slate-500">{device.type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Số IMEI / Serial</span>
                <p className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {device.imei || "Không có"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Hẹn trả máy</span>
                <p className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {promisedAt ? new Date(promisedAt).toLocaleString("vi-VN") : "Chưa hẹn"}
                </p>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                Hiện tượng lỗi tiếp nhận
              </span>
              <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                {device.problem || "Chưa nhập hiện tượng lỗi"}
              </p>
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Dự kiến chi phí ({validItems.length} mục):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">
                  {formatVND(estimatedCost)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Đã đặt cọc:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatVND(Number(deposit) || 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-extrabold text-blue-600 dark:text-blue-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Còn lại thanh toán khi nhận:</span>
                <span className="font-mono">{formatVND(balanceDue)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewOpen(false);
                submit();
              }}
              className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Xác nhận & In Ngay</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function defaultPromisedAt() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(17, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
