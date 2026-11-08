"use client";

import { useState, useTransition } from "react";
import {
  Store,
  MapPin,
  Phone,
  Compass,
  Edit2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateBranchGps } from "./actions";

type BranchItem = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isMain: boolean;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  _count: {
    users: number;
    sales: number;
  };
};

export function BranchManager({ branches: initialBranches }: { branches: BranchItem[] }) {
  const [branches, setBranches] = useState<BranchItem[]>(initialBranches);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [radius, setRadius] = useState<string>("150");
  const [address, setAddress] = useState<string>("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleOpenGpsDialog(b: BranchItem) {
    setEditingBranch(b);
    setLat(b.latitude ? String(b.latitude) : "");
    setLng(b.longitude ? String(b.longitude) : "");
    setRadius(String(b.radiusMeters || 150));
    setAddress(b.address || "");
  }

  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ Geolocation");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGettingLocation(false);
        toast.success("Đã lấy tọa độ vị trí hiện tại thành công!");
      },
      (err) => {
        setGettingLocation(false);
        toast.error("Không thể lấy vị trí GPS, vui lòng kiểm tra quyền truy cập");
      },
      { enableHighAccuracy: true }
    );
  }

  function handleSave() {
    if (!editingBranch) return;
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius) || 150;

    if (!lat || !lng || isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Vui lòng nhập tọa độ Vĩ độ (Lat) và Kinh độ (Lng) hợp lệ");
      return;
    }

    startTransition(async () => {
      const res = await updateBranchGps(editingBranch.id, {
        latitude: latNum,
        longitude: lngNum,
        radiusMeters: radiusNum,
        address,
      });

      if (res.ok) {
        toast.success(`Đã cập nhật tọa độ GPS cho ${editingBranch.name}`);
        setBranches((curr) =>
          curr.map((b) =>
            b.id === editingBranch.id
              ? {
                  ...b,
                  latitude: latNum,
                  longitude: lngNum,
                  radiusMeters: radiusNum,
                  address,
                }
              : b
          )
        );
        setEditingBranch(null);
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => {
          const hasGps = b.latitude && b.longitude;
          return (
            <Card
              key={b.id}
              className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 hover:shadow-md transition-all"
            >
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Store className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-extrabold">{b.name}</CardTitle>
                      {b.isMain && (
                        <Badge className="text-[9px] h-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-bold">
                          Trụ sở chính
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenGpsDialog(b)}
                    className="rounded-xl h-8 px-2.5 text-xs font-semibold gap-1"
                  >
                    <Compass className="size-3.5 text-blue-500" />
                    Cài đặt GPS
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 mt-0.5 text-slate-400" />
                    <span className="truncate">{b.address || "Chưa cập nhật địa chỉ"}</span>
                  </div>
                  {b.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-3.5 shrink-0 text-slate-400" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                </div>

                {/* GPS Info Banner */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Compass className="size-3.5 text-blue-500" />
                      Định vị chấm công:
                    </span>
                    {hasGps ? (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] border-emerald-200">
                        Bán kính {b.radiusMeters || 150}m
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                        Chưa cấu hình
                      </Badge>
                    )}
                  </div>

                  {hasGps ? (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span className="font-mono">
                        {b.latitude?.toFixed(4)}, {b.longitude?.toFixed(4)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${b.latitude},${b.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                      >
                        Bản đồ
                        <ExternalLink className="size-2.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400">
                      Nhân viên chi nhánh này chưa bị giới hạn khoảng cách GPS.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Nhân viên</p>
                    <p className="text-lg font-black text-foreground font-mono">{b._count.users}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Giao dịch</p>
                    <p className="text-lg font-black text-foreground font-mono">{b._count.sales}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* GPS Configuration Modal */}
      <Dialog open={!!editingBranch} onOpenChange={(open) => !open && setEditingBranch(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Compass className="size-5 text-blue-600" />
              Cài Đặt Tọa Độ GPS Chấm Công
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập tọa độ chuẩn và bán kính hợp lệ cho <strong>{editingBranch?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Quick button to get current location */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={gettingLocation}
              className="w-full rounded-2xl h-10 bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100/50"
            >
              {gettingLocation ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <MapPin className="size-4 mr-2" />
              )}
              Lấy tọa độ vị trí hiện tại của tôi
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Vĩ độ (Latitude) *</label>
                <Input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="21.0285"
                  className="rounded-xl h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Kinh độ (Longitude) *</label>
                <Input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="105.8542"
                  className="rounded-xl h-9 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Bán kính cho phép (mét) *</label>
              <Input
                type="number"
                min={20}
                max={3000}
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="150"
                className="rounded-xl h-9 text-xs font-mono font-bold"
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Mặc định: <strong>150 mét</strong> (Khuyên dùng để bù trừ sai số GPS khi nhân viên ở trong nhà).
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Địa chỉ chi nhánh</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, đường, quận/huyện..."
                className="rounded-xl h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingBranch(null)}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={pending}
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {pending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Lưu Tọa Độ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
