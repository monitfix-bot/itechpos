"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { restoreDefaultTemplates } from "./actions";

export function RestoreDefaultButton() {
  const [pending, startTransition] = useTransition();

  function handleRestore() {
    const ok = window.confirm(
      "Bạn có chắc chắn muốn khôi phục tất cả mẫu in về mặc định chuẩn? Thao tác này sẽ ghi đè các tuỳ chỉnh hiện tại."
    );
    if (!ok) return;

    startTransition(async () => {
      const res = await restoreDefaultTemplates();
      if (res.ok) {
        toast.success("Đã khôi phục thành công các mẫu in chuẩn.");
      } else {
        toast.error(res.error || "Lỗi khi khôi phục mẫu in.");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={handleRestore}
      disabled={pending}
      className="rounded-xl border-slate-200 dark:border-slate-800 text-muted-foreground hover:text-foreground font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin mr-2" />
      ) : (
        <RotateCcw className="size-4 mr-2" />
      )}
      Khôi phục mặc định
    </Button>
  );
}
