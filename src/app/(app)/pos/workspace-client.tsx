"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  ShoppingCart,
  Wrench,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playPosSound } from "@/lib/sound";
import { PosClient } from "./pos-client";
import { ServiceForm } from "../service/service-form";
import { TicketTab } from "./ticket-tab";

type SaleTab = { id: string; type: "sale"; label: string };
type ServiceTab = { id: string; type: "service"; label: string };
type TicketTabT = {
  id: string;
  type: "ticket";
  label: string;
  ticketId: string;
};
type Tab = SaleTab | ServiceTab | TicketTabT;

type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  price: number;
  stock: number;
  categoryType: string;
  categoryIcon: string;
  categoryId: string;
};
type Category = { id: string; name: string; type: string; icon: string };
type Customer = { id: string; name: string; phone: string; code: string };
type Technician = { id: string; name: string };

let counter = 1;
function nextId() {
  counter += 1;
  return `tab-${Date.now()}-${counter}`;
}

export function WorkspaceClient({
  products,
  categories,
  customers,
  technicians,
}: {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  technicians: Technician[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "tab-default", type: "sale", label: "Đơn 1" },
  ]);
  const [activeId, setActiveId] = useState<string>("tab-default");
  const [isMounted, setIsMounted] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [dirtyTabs, setDirtyTabs] = useState<Record<string, boolean>>({});

  // Load tabs from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedTabs = localStorage.getItem("pos_tabs");
    const savedActiveId = localStorage.getItem("pos_active_id");
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
        }
      } catch (e) {
        console.error("Failed to restore tabs", e);
      }
    }
    if (savedActiveId) {
      setActiveId(savedActiveId);
    }
  }, []);

  // Save tabs to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("pos_tabs", JSON.stringify(tabs));
      localStorage.setItem("pos_active_id", activeId);
    }
  }, [tabs, activeId, isMounted]);

  function addTab(type: "sale" | "service") {
    const sameType = tabs.filter((t) => t.type === type).length;
    const label =
      type === "sale" ? `Đơn ${sameType + 1}` : `Sửa ${sameType + 1}`;
    const id = nextId();
    setTabs((curr) => [...curr, { id, type, label } as Tab]);
    setActiveId(id);
    setOpenAdd(false);
  }

  function openTicketTab(ticketId: string, code: string) {
    const existing = tabs.find(
      (t) => t.type === "ticket" && t.ticketId === ticketId,
    );
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const id = nextId();
    setTabs((curr) => {
      if (curr.some((t) => t.type === "ticket" && t.ticketId === ticketId)) {
        return curr;
      }
      return [...curr, { id, type: "ticket", label: code, ticketId }];
    });
    setActiveId(id);
  }

  useEffect(() => {
    if (!isMounted) return;
    const ticketId = searchParams.get("ticket");
    const ticketCode = searchParams.get("code");
    if (ticketId) {
      openTicketTab(ticketId, ticketCode || "Phiếu");
      const url = new URL(window.location.href);
      url.searchParams.delete("ticket");
      url.searchParams.delete("code");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, isMounted]);

  function closeTab(id: string) {
    if (dirtyTabs[id]) {
      const confirmClose = window.confirm(
        "Bạn có các thay đổi chưa được lưu trên phiếu này. Bạn có chắc chắn muốn đóng tab này không?"
      );
      if (!confirmClose) return;
    }
    setDirtyTabs((curr) => {
      const next = { ...curr };
      delete next[id];
      return next;
    });

    setTabs((curr) => {
      const idx = curr.findIndex((t) => t.id === id);
      if (idx === -1) return curr;
      const next = curr.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh: Tab = { id: nextId(), type: "sale", label: "Đơn 1" };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        const newActive = curr[idx - 1] || curr[idx + 1];
        setActiveId(newActive.id);
      }
      return next;
    });
    router.refresh();
  }

    function triggerShortcut(key: "F2" | "F4" | "F9") {
    playPosSound("tab");
    window.dispatchEvent(new CustomEvent("pos-shortcut", { detail: key }));
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        triggerShortcut("F2");
      } else if (e.key === "F4") {
        e.preventDefault();
        triggerShortcut("F4");
      } else if (e.key === "F9") {
        e.preventDefault();
        triggerShortcut("F9");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      {/* 2. MULTI-ORDER & REPAIR TABS BAR (THANH TAB ĐA NHIỆM: ĐƠN BÁN + PHIẾU SỬA) */}
      <div className="bg-slate-200/75 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
          {tabs.map((tab) => {
            const isActive = activeId === tab.id;
            const isDirty = dirtyTabs[tab.id];
            const isRepair = tab.type === "service";
            return (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveId(tab.id);
                  playPosSound("tab");
                }}
                className={cn(
                  "group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs select-none transition-all cursor-pointer shrink-0",
                  isActive
                    ? isRepair
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold shadow-sm border-2 border-amber-500/80"
                      : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm border-2 border-blue-500/80"
                    : "bg-transparent hover:bg-white/60 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold"
                )}
              >
                <div className="flex items-center gap-2">
                  {tab.type === "sale" ? (
                    <ShoppingCart className="size-3.5 text-blue-600 dark:text-blue-400" />
                  ) : tab.type === "service" ? (
                    <Wrench className="size-3.5 text-amber-500" />
                  ) : (
                    <ClipboardList className="size-3.5 text-emerald-500" />
                  )}
                  <span>{tab.label}</span>
                  {isDirty && (
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" title="Có thay đổi chưa lưu" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-50 hover:opacity-100 hover:text-rose-500 p-0.5 rounded transition-all"
                  aria-label="Đóng tab"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}

          {/* Nút + Thêm tab (mở modal chọn loại tab như cũ) */}
          <button
            type="button"
            onClick={() => {
              setOpenAdd(true);
              playPosSound("tab");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all shrink-0 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Thêm tab mới</span>
          </button>
        </div>

        {/* Phím tắt nhanh bên phải thanh Tab (Nhấn hoặc click trực tiếp) */}
        <div className="hidden lg:flex items-center gap-3 pr-2.5 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <button
            type="button"
            onClick={() => triggerShortcut("F2")}
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
            title="Nhấn F2 trên bàn phím hoặc click để tìm kiếm hàng"
          >
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold shadow-2xs group-hover:border-blue-400 transition-colors">
              F2
            </kbd>
            <span className="font-semibold">Tìm hàng</span>
          </button>
          <button
            type="button"
            onClick={() => triggerShortcut("F4")}
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
            title="Nhấn F4 trên bàn phím hoặc click để chọn khách hàng"
          >
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold shadow-2xs group-hover:border-blue-400 transition-colors">
              F4
            </kbd>
            <span className="font-semibold">Khách hàng</span>
          </button>
          <button
            type="button"
            onClick={() => triggerShortcut("F9")}
            className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer group"
            title="Nhấn F9 trên bàn phím hoặc click để hoàn tất thanh toán / lưu phiếu"
          >
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold shadow-2xs group-hover:border-emerald-400 transition-colors">
              F9
            </kbd>
            <span className="font-semibold">Hoàn tất</span>
          </button>
        </div>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(activeId === tab.id ? "block" : "hidden")}
        >
          {tab.type === "sale" ? (
            <PosClient
              isActive={activeId === tab.id}
              products={products}
              categories={categories}
              customers={customers}
              showHeader={false}
              onCreated={() => closeTab(tab.id)}
            />
          ) : tab.type === "service" ? (
            <ServiceForm
              isActive={activeId === tab.id}
              customers={customers}
              technicians={technicians}
              products={products.map((p) => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                price: p.price,
                categoryType: p.categoryType,
              }))}
              onCreated={() => closeTab(tab.id)}
            />
          ) : (
            <TicketTab
              ticketId={tab.ticketId}
              technicians={technicians}
              products={products}
              onClosed={() => closeTab(tab.id)}
              isActive={activeId === tab.id}
              setDirty={(dirty) => {
                setDirtyTabs((curr) => {
                  if (curr[tab.id] === dirty) return curr;
                  return { ...curr, [tab.id]: dirty };
                });
              }}
            />
          )}
        </div>
      ))}

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="sm:max-w-md border border-border shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Mở Tab Giao Dịch Mới</DialogTitle>
            <DialogDescription className="text-xs">
              Chọn phân hệ bạn muốn xử lý trên tab làm việc độc lập.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => addTab("sale")}
              className="rounded-xl border border-border hover:border-primary hover:bg-primary/5 p-4 flex flex-col items-center gap-2.5 text-center transition-all group"
            >
              <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingCart className="size-5" />
              </div>
              <div className="font-bold text-xs uppercase tracking-tight text-foreground">Bán hàng (POS)</div>
              <div className="text-[11px] text-muted-foreground leading-normal">
                Bán lẻ thiết bị, linh kiện, thanh toán và in hoá đơn tức thì.
              </div>
            </button>
            <button
              type="button"
              onClick={() => addTab("service")}
              className="rounded-xl border border-border hover:border-amber-600 hover:bg-amber-500/5 p-4 flex flex-col items-center gap-2.5 text-center transition-all group"
            >
              <div className="size-11 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wrench className="size-5" />
              </div>
              <div className="font-bold text-xs uppercase tracking-tight text-foreground">Tiếp nhận máy sửa</div>
              <div className="text-[11px] text-muted-foreground leading-normal">
                Kiểm tra máy lỗi, lập biên nhận và in phiếu nhận máy cho khách.
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
