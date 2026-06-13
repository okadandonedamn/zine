"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, Home, Library, PenLine, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({ meUsername }: { meUsername: string | null }) {
  const pathname = usePathname();
  const items = [
    { href: "/home", icon: Home, label: "ホーム" },
    { href: "/search", icon: Search, label: "検索" },
    { href: "/works", icon: Library, label: "作品" },
    { href: "/records", icon: BookMarked, label: "記録" },
    {
      href: meUsername ? `/profile/${meUsername}` : "/login",
      icon: User,
      label: meUsername ? "自分" : "ログイン",
    },
  ];
  return (
    <>
      {/* 固定投稿ボタン */}
      <Link
        href="/post/new"
        aria-label="投稿する"
        className="fixed bottom-20 right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg md:hidden print:hidden"
      >
        <PenLine size={22} />
      </Link>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-line bg-background/95 backdrop-blur md:hidden print:hidden">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5",
                active ? "text-foreground" : "text-subtle",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[9px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
