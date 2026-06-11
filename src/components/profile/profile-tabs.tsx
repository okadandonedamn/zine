"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProfileTabs({ username }: { username: string }) {
  const pathname = usePathname();
  const base = `/profile/${username}`;
  const tabs = [
    { href: base, label: "タイムライン" },
    { href: `${base}/reviews`, label: "レビュー" },
    { href: `${base}/records`, label: "記録" },
    { href: `${base}/articles`, label: "記事" },
  ];
  return (
    <div className="flex border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={pathname === t.href ? "page" : undefined}
          className={cn(
            "px-4 py-3 text-sm transition-colors",
            pathname === t.href
              ? "border-b-2 border-accent font-semibold text-foreground"
              : "text-subtle hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
