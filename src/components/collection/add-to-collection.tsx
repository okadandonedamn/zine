"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToCollection } from "@/lib/actions";
import type { Collection } from "@/lib/types";

/** 作品ページから自分のコレクションへ加える */
export function AddToCollection({
  workId,
  collections,
}: {
  workId: string;
  collections: Collection[];
}) {
  const router = useRouter();
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (collections.length === 0) {
    return (
      <p className="text-sm text-muted">
        まだコレクションがありません。{" "}
        <Link href="/collections/new" className="text-accent hover:underline">
          最初のコレクションを作る →
        </Link>
      </p>
    );
  }

  async function handleAdd() {
    setPending(true);
    setMessage(null);
    const result = await addToCollection({ collectionId, workId, note });
    if (result.ok) {
      setMessage({ ok: true, text: "加えました" });
      setNote("");
      router.refresh();
    } else {
      setMessage({ ok: false, text: result.error });
    }
    setPending(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          aria-label="コレクションを選ぶ"
          className="h-9 rounded-md border border-line bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
        >
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="一言キュレーション(任意)"
          maxLength={100}
          className="w-56 flex-1 sm:flex-none"
        />
        <Button variant="outline" onClick={handleAdd} disabled={pending || !collectionId}>
          <ListPlus size={15} />
          加える
        </Button>
      </div>
      {message && (
        <p className={message.ok ? "text-xs text-muted" : "text-xs text-accent"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
