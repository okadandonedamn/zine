"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePost } from "@/lib/actions";

/** 自分の投稿の削除(論理削除)。物理DELETEは発行しない */
export function DeletePostButton({ feedItemId }: { feedItemId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm("この投稿を削除しますか?(タイムラインから外れます)")) return;
    setPending(true);
    setError(null);
    const result = await deletePost(feedItemId);
    if (result.ok) {
      router.push("/home");
      router.refresh();
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleDelete} disabled={pending}>
        <Trash2 size={14} />
        {pending ? "削除中…" : "削除"}
      </Button>
      {error && <span className="text-xs text-accent">{error}</span>}
    </span>
  );
}
