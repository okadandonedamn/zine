"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { handleReport } from "@/lib/actions";
import { Button } from "@/components/ui/button";

/** 通報1件への処理ボタン(対象を削除 / 却下)。moderator専用画面で使う */
export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const act = (action: "remove" | "dismiss") =>
    startTransition(async () => {
      const res = await handleReport({ reportId, action });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => act("remove")}>
        対象を削除して対応
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => act("dismiss")}>
        却下
      </Button>
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  );
}
