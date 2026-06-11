"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markNotificationsRead } from "@/lib/actions";

export function MarkReadButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await markNotificationsRead();
    router.refresh();
    setPending(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? "…" : "すべて既読にする"}
    </Button>
  );
}
