"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookMarked, Home, PenLine, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({
  meUsername,
  unreadCount = 0,
}: {
  meUsername: string | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const items = [
    { href: "/home", icon: Home, label: "ホーム", badge: 0 },
    { href: "/search", icon: Search, label: "検索", badge: 0 },
    { href: "/notifications", icon: Bell, label: "通知", badge: unreadCount },
    { href: "/records", icon: BookMarked, label: "記録", badge: 0 },
    {
      href: meUsername ? `/profile/${meUsername}` : "/login",
      icon: User,
      label: meUsername ? "自分" : "ログイン",
      badge: 0,
    },
  ];
  return (
    <>
      <Link
        href="/post/new"
        aria-label="投稿する"
        className="fixed bottom-20 right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg md:hidden print:hidden"
      >
        <PenLine size={22} />
      </Link>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-line bg-background/95 backdrop-blur md:hidden print:hidden">
        {items.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                active ? "text-foreground" : "text-subtle",
              )}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-accent-fg">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="text-[9px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
