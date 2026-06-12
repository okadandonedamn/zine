"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { submitReport } from "@/lib/actions";
import type { ReportTargetType } from "@/lib/types";

/**
 * 通報ボタン。押すと理由入力が開き、送信すると reports に積まれる。
 * 処理(削除/却下)はモデレーターが /moderation で行う。
 */
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <span className="text-xs text-subtle">
        通報しました。モデレーターが確認します
      </span>
    );
  }

  const send = () => {
    if (reason.trim().length === 0) {
      setError("理由を入力してください");
      return;
    }
    startTransition(async () => {
      const res = await submitReport({ targetType, targetId, reason: reason.trim() });
      if (res.ok) {
        setSent(true);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1 text-xs text-subtle transition-colors hover:text-accent"
        title="通報(モデレーターが確認します)"
      >
        <Flag size={12} />
        通報
      </button>
      {open && (
        <>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="通報する理由"
            maxLength={500}
            className="w-44 rounded-md border border-line bg-background px-2 py-1 text-xs text-foreground placeholder:text-subtle focus:outline-2 focus:outline-accent"
          />
          <button
            type="button"
            onClick={send}
            disabled={pending}
            className="cursor-pointer text-xs text-accent hover:underline disabled:opacity-50"
          >
            {pending ? "送信中…" : "送信"}
          </button>
          {error && <span className="text-xs text-accent">{error}</span>}
        </>
      )}
    </span>
  );
}
