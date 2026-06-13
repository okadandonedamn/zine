"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteZine } from "@/lib/actions";

/**
 * 冊子閲覧ページの操作列。
 * PDF書き出しはブラウザの印刷ダイアログ(PDFとして保存)で行う。
 * 印刷時は @media print(print:hidden)でナビ等が消え、誌面だけが出力される。
 */
export function ZineControls({ zineId, isOwner }: { zineId: string; isOwner: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const res = await deleteZine(zineId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/zines");
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer size={14} />
        PDFに書き出す
      </Button>
      {isOwner &&
        (confirming ? (
          <>
            <Button variant="ghost" size="sm" disabled={pending} onClick={remove}>
              {pending ? "削除中…" : "本当に削除する"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              やめる
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 size={14} />
            冊子を削除
          </Button>
        ))}
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  );
}
