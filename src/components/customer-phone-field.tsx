"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  UserPlus,
  X,
  Search,
  User,
  Phone,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playPosSound } from "@/lib/sound";

export type CustomerLite = {
  id: string;
  code: string;
  name: string;
  phone: string;
};

export type CustomerSelection =
  | { mode: "none" }
  | { mode: "existing"; customer: CustomerLite }
  | { mode: "new"; name: string; phone: string };

function getInitials(name: string): string {
  if (!name) return "KH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhone(phone: string): string {
  const p = phone.replace(/\D/g, "");
  if (p.length === 10) {
    return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`;
  }
  return phone;
}

export function CustomerPhoneField({
  customers,
  value,
  onChange,
  className,
  required = false,
  hasError = false,
  label,
}: {
  customers: CustomerLite[];
  value: CustomerSelection;
  onChange: (s: CustomerSelection) => void;
  className?: string;
  required?: boolean;
  hasError?: boolean;
  label?: string;
}) {
  // Independent search query for typing - NEVER reset on keystroke!
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  // State for new customer form
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Only react when value.mode transitions externally
  useEffect(() => {
    if (value.mode === "none") {
      setSearchQuery("");
      setNewPhone("");
      setNewName("");
      setShowNewForm(false);
    } else if (value.mode === "existing") {
      setSearchQuery("");
      setShowNewForm(false);
      setOpen(false);
    } else if (value.mode === "new") {
      setNewPhone(value.phone);
      setNewName(value.name);
      setShowNewForm(true);
      setOpen(false);
    }
  }, [value.mode]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Filter customers based on search query
  const matched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter(
        (c) =>
          c.phone.includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, customers]);

  const exact = matched.find((c) => c.phone === searchQuery.trim());

  function selectCustomer(c: CustomerLite) {
    setSearchQuery("");
    setShowNewForm(false);
    setOpen(false);
    playPosSound("beep");
    onChange({ mode: "existing", customer: c });
  }

  function clear() {
    setSearchQuery("");
    setNewPhone("");
    setNewName("");
    setShowNewForm(false);
    setOpen(false);
    playPosSound("tab");
    onChange({ mode: "none" });
  }

  function startNew(initialPhone = searchQuery.trim()) {
    setShowNewForm(true);
    setNewPhone(initialPhone);
    setNewName("");
    setOpen(false);
    playPosSound("tab");
    onChange({ mode: "new", name: "", phone: initialPhone });
  }

  function updateNewPhone(v: string) {
    setNewPhone(v);
    onChange({ mode: "new", name: newName, phone: v.trim() });
  }

  function updateNewName(v: string) {
    setNewName(v);
    onChange({ mode: "new", name: v, phone: newPhone.trim() });
  }

  return (
    <div ref={containerRef} className={cn("space-y-2 relative", className)}>
      {label && (
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* STATE 1: ĐÃ CHỌN KHÁCH HÀNG (EXECUTIVE BADGE PROFILE CARD) */}
      {value.mode === "existing" && (
        <div className="relative group p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-blue-50/40 to-indigo-50/30 dark:from-emerald-950/40 dark:via-slate-800/90 dark:to-blue-950/40 border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs transition-all flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar Initials Badge */}
            <div className="size-10 sm:size-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0 border border-white/20">
              {getInitials(value.customer.name)}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {value.customer.name}
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/90 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-mono font-bold text-[10px] border border-slate-200/80 dark:border-slate-700">
                  {value.customer.code}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[9px]">
                  <Check className="size-2.5" />
                  <span>Khách quen</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs">
                <Phone className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-mono font-bold tracking-wide">
                  {formatPhone(value.customer.phone)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clear}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-2xs active:scale-95"
            title="Đổi hoặc chọn khách hàng khác"
          >
            <RotateCcw className="size-3 text-slate-400 group-hover:text-rose-500" />
            <span className="text-[11px]">Đổi khách</span>
          </button>
        </div>
      )}

      {/* STATE 2: THÊM KHÁCH MỚI (INLINE QUICK FORM) */}
      {showNewForm && value.mode === "new" && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white dark:from-slate-800/90 dark:via-blue-950/30 dark:to-slate-900 border border-blue-200 dark:border-blue-800/80 space-y-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
              <UserPlus className="size-3.5" />
              <span>Thêm Khách Hàng Mới</span>
            </span>
            <button
              type="button"
              onClick={clear}
              className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              ✕ Huỷ bỏ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-500 shadow-2xs">
              <Phone className="size-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => updateNewPhone(e.target.value)}
                placeholder="Số điện thoại *"
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-mono"
                required
              />
            </div>

            <div className="flex items-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-500 shadow-2xs">
              <User className="size-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => updateNewName(e.target.value)}
                placeholder="Tên khách hàng *"
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span className="flex items-center gap-1 italic">
              <Sparkles className="size-3 text-amber-500 shrink-0" />
              Tự động lưu vào danh bạ khi hoàn tất
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {newPhone.trim() && newName.trim() ? "✓ Đầy đủ thông tin" : "⚠️ Cần nhập SĐT & Tên"}
            </span>
          </div>
        </div>
      )}

      {/* STATE 3: CHƯA CHỌN KHÁCH (SEARCH & QUICK SELECT INPUT) */}
      {value.mode === "none" && !showNewForm && (
        <div className="relative">
          <div
            className={cn(
              "input-glow flex items-center bg-slate-50/90 dark:bg-slate-800/90 border rounded-2xl px-3.5 py-2.5 transition-all shadow-2xs",
              hasError
                ? "border-rose-500 dark:border-rose-500 ring-4 ring-rose-500/20 bg-rose-50/20"
                : "border-slate-200/90 dark:border-slate-700"
            )}
          >
            <Search className="size-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              id="customer-phone-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="[F4] Gõ số điện thoại hoặc tên khách..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  title="Xoá tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] font-bold text-slate-500">
                  F4
                </kbd>
              )}

              {/* Icon User+ Only Button (Yêu cầu 3) */}
              <button
                type="button"
                onClick={() => startNew(searchQuery.trim())}
                className="size-8 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all active:scale-95 shadow-2xs shrink-0"
                title="Thêm khách hàng mới"
                aria-label="Thêm khách hàng mới"
              >
                <UserPlus className="size-4" />
              </button>
            </div>
          </div>

          {/* GỢI Ý DANH SÁCH KHÁCH HÀNG (FLOATING DROPDOWN) */}
          {open && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-[100] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in-0 zoom-in-95 duration-150">
              {matched.length > 0 && (
                <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 [scrollbar-width:thin]">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    Khách hàng phù hợp ({matched.length})
                  </div>
                  {matched.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {getInitials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium flex items-center gap-1.5">
                            <span>{formatPhone(c.phone)}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">{c.code}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {!exact && (
                <button
                  type="button"
                  onClick={() => startNew(searchQuery.trim())}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400 font-bold transition-colors cursor-pointer"
                >
                  <UserPlus className="size-4 shrink-0" />
                  <span>
                    Thêm khách hàng mới với SĐT{" "}
                    <span className="font-mono underline">{searchQuery}</span>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
