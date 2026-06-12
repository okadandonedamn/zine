"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWorkFollow } from "@/lib/actions";

/** 作品をフォローする(多態フォロー: 人/作品/タグ のうちの「作品」) */
export function FollowWorkButton({
  workId,
  initialFollowing,
}: {
  workId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const next = !following;
    setFollowing(next);
    const result = await toggleWorkFollow(workId);
    if (!result.ok) {
      setFollowing(!next);
      setError(result.error);
    }
    setPending(false);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button variant="outline" onClick={handleClick} disabled={pending}>
        {following ? <Check size={15} /> : <BellPlus size={15} />}
        {following ? "フォロー中" : "作品をフォロー"}
      </Button>
      {error && <span className="text-[10px] text-accent">{error}</span>}
    </span>
  );
}
