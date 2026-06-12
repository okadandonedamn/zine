"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCollection, removeFromCollection } from "@/lib/actions";

/** コレクションから1作品を外す(オーナーのみ表示される) */
export function RemoveItemButton({
  collectionId,
  workId,
}: {
  collectionId: string;
  workId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRemove() {
    setPending(true);
    const result = await removeFromCollection({ collectionId, workId });
    if (result.ok) router.refresh();
    setPending(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRemove}
      disabled={pending}
      aria-label="コレクションから外す"
      className="h-7 w-7 shrink-0"
    >
      <X size={14} />
    </Button>
  );
}

/** コレクションごと削除する(オーナーのみ表示される) */
export function DeleteCollectionButton({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm("このコレクションを削除しますか?(元に戻せません)")) return;
    setPending(true);
    setError(null);
    const result = await deleteCollection(collectionId);
    if (result.ok) {
      router.push("/collections");
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
