"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  Home,
  Library,
  MessagesSquare,
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
  { href: "/goals", label: "目標", icon: Target },
  { href: "/boards", label: "掲示板", icon: MessagesSquare },
];

export function Sidebar({ meUsername }: { meUsername: string | null }) {
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
        <span className="text-[10px] tracking-widest text-subtle">© ZINE 2026</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
