"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReply } from "@/lib/actions";

/**
 * スレッドへの返信フォーム。
 * 投稿はハンドル(プロフィールの表示名)で行われる。匿名は提供しない(v1.1 判断7)。
 */
export function ReplyComposer({ threadId }: { threadId: string }) {
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
    const result = await createReply({ threadId, body });
    if (result.ok) setSent(true);
    else {
      setError(result.error);
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-line bg-surface p-4">
      <p className="text-xs text-subtle">
        ハンドル(あなたの表示名)で書き込まれます。「&gt;&gt;2」のように書くと引用返信になります。
      </p>
      <Textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="作品への攻撃と人への攻撃を区別すること。"
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
