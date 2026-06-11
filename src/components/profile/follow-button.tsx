"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/actions";

export function FollowButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const result = await toggleFollow(userId);
    if (!result.ok) setError(result.error);
    setPending(false);
    router.refresh();
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleClick} disabled={pending}>
        {pending ? "…" : "フォロー"}
      </Button>
      {error && <span className="text-[10px] text-accent">{error}</span>}
    </span>
  );
}
