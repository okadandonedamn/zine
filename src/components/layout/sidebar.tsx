"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  BookMarked,
  Home,
  Layers,
  Library,
  PenLine,
  Search,
  Settings,
  Target,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/search", label: "検索", icon: Search },
  { href: "/works", label: "作品", icon: Library },
  { href: "/records", label: "記録", icon: BookMarked },
  { href: "/collections", label: "コレクション", icon: Layers },
  { href: "/goals", label: "目標", icon: Target },
  { href: "/bookmarks", label: "ブックマーク", icon: Bookmark },
];

export function Sidebar({
  meUsername,
  unreadCount = 0,
}: {
  meUsername: string | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col justify-between border-r border-line px-3 py-5 md:flex">
      <div className="space-y-6">
        <Link href="/home" className="block px-3">
          <span className="font-display text-3xl font-bold tracking-widest">ZINE</span>
          <span className="mt-1 block text-[10px] tracking-[0.3em] text-subtle">
            CULTURE TIMELINE
          </span>
        </Link>
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-surface-2 font-semibold text-foreground"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            );
          })}
          <Link
            href="/notifications"
            aria-current={pathname === "/notifications" ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === "/notifications"
                ? "bg-surface-2 font-semibold text-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <span className="relative">
              <Bell size={18} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-accent-fg">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            通知
          </Link>
          <Link
            href={meUsername ? `/profile/${meUsername}` : "/login"}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/profile")
                ? "bg-surface-2 font-semibold text-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <User size={18} strokeWidth={1.8} />
            {meUsername ? "プロフィール" : "ログイン"}
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === "/settings"
                ? "bg-surface-2 font-semibold text-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Settings size={18} strokeWidth={1.8} />
            設定
          </Link>
        </nav>
        <Link href="/post/new" className="block px-1">
          <Button className="w-full" size="lg">
            <PenLine size={16} />
            投稿する
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between px-2">
        <Link
          href="/about"
          className="text-[10px] tracking-widest text-subtle hover:text-muted"
        >
          © ZINE 2026 ・ 規約
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}
