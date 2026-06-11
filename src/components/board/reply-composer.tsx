"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReply } from "@/lib/actions";
import { cn } from "@/lib/utils";

/** スレッドへの返信フォーム。匿名/ハンドルネームを切り替えられる */
export function ReplyComposer({ threadId }: { threadId: string }) {
  const [anonymous, setAnonymous] = useState(true);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <p className="rounded-md border border-line bg-surface p-4 text-center text-sm text-muted">
        レスを書き込みました
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length === 0) return;
    setSending(true);
    setError(null);
    const result = await createReply({ threadId, body, anonymous });
    if (result.ok) setSent(true);
    else {
      setError(result.error);
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-line bg-surface p-4">
      <div className="flex gap-2 text-xs">
        {[
          { label: "名無しの批評家(匿名)", value: true },
          { label: "ハンドルネームで書く", value: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setAnonymous(opt.value)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 transition-colors",
              anonymous === opt.value
                ? "border-accent text-accent"
                : "border-line text-muted hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <Textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="「>>2」のように書くと引用返信になります。"
        className="mt-3"
      />
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={body.trim().length === 0 || sending}>
          {sending ? "送信中…" : "レスを書き込む"}
        </Button>
      </div>
    </form>
  );
}
