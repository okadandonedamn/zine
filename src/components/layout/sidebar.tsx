"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  Bell,
  Bookmark,
  BookMarked,
  BookOpen,
  CalendarDays,
  FileText,
  Home,
  Layers,
  Library,
  MessagesSquare,
  PenLine,
  PlusCircle,
  Search,
  Settings,
  ShieldAlert,
  Star,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

const FEATURE_NAV: NavItem[] = [
  { href: "/posts", label: "短文", icon: PenLine },
  { href: "/articles", label: "記事", icon: FileText },
  { href: "/reviews", label: "レビュー", icon: Star },
  { href: "/records", label: "記録", icon: BookMarked },
  { href: "/threads", label: "語り場", icon: MessagesSquare },
];

const LIBRARY_NAV: NavItem[] = [
  { href: "/works", label: "作品", icon: Library },
  { href: "/collections", label: "コレクション", icon: Layers },
  { href: "/zines", label: "冊子", icon: BookOpen },
  { href: "/bookmarks", label: "ブックマーク", icon: Bookmark },
];

const RECORD_NAV: NavItem[] = [
  { href: "/records/new", label: "記録する", icon: PlusCircle },
  { href: "/records/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/records/stats", label: "統計", icon: BarChart3 },
  { href: "/records/recap", label: "年間総括", icon: Trophy },
  { href: "/goals", label: "目標", icon: Target },
];

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  if (href === "/records") return pathname === "/records";
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  compact = false,
}: NavItem & { active: boolean; compact?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center rounded-md transition-colors",
        compact ? "gap-2 px-2.5 py-1.5 text-xs" : "gap-3 px-3 py-2 text-sm",
        active
          ? "bg-surface-2 font-semibold text-foreground"
          : "text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      <Icon size={compact ? 15 : 18} strokeWidth={active ? 2.4 : 1.8} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function DockLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: NavItem & { active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] transition-colors",
        active ? "bg-surface-2 text-foreground" : "text-subtle hover:bg-surface-2 hover:text-foreground",
      )}
    >
      <span className="relative">
        <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
        {badge ? (
          <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-accent-fg">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar({
  meUsername,
  unreadCount = 0,
  isModerator = false,
}: {
  meUsername: string | null;
  unreadCount?: number;
  isModerator?: boolean;
}) {
  const pathname = usePathname();
  const accountHref = meUsername ? `/profile/${meUsername}` : "/login";
  const accountLabel = meUsername ? "プロフィール" : "ログイン";

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-background/75 px-3 py-5 md:flex print:hidden">
      <Link href="/home" className="block px-3">
        <span className="font-display text-3xl font-bold tracking-widest">ZINE</span>
        <span className="mt-1 block text-[10px] tracking-[0.3em] text-subtle">
          CULTURE TIMELINE
        </span>
      </Link>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        <section>
          <p className="px-3 text-[10px] font-semibold tracking-[0.22em] text-subtle">
            投稿と読む場
          </p>
          <nav className="mt-2 space-y-1">
            {FEATURE_NAV.map((item) => (
              <SidebarLink key={item.href} {...item} active={isActive(pathname, item.href)} />
            ))}
          </nav>
        </section>

        <section className="mt-5">
          <p className="px-3 text-[10px] font-semibold tracking-[0.22em] text-subtle">
            ライブラリ
          </p>
          <nav className="mt-2 space-y-1">
            {LIBRARY_NAV.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                active={isActive(pathname, item.href)}
                compact
              />
            ))}
          </nav>
        </section>
      </div>

      <section className="mt-4 border-t border-line pt-4">
        <p className="px-2 text-[10px] font-semibold tracking-[0.22em] text-subtle">
          記録メニュー
        </p>
        <nav className="mt-2 grid grid-cols-2 gap-1">
          {RECORD_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              {...item}
              active={isActive(pathname, item.href)}
              compact
            />
          ))}
        </nav>
      </section>

      <nav className="mt-4 grid grid-cols-3 gap-1 border-t border-line pt-4">
        <DockLink href="/home" label="ホーム" icon={Home} active={pathname === "/home"} />
        <DockLink href="/search" label="検索" icon={Search} active={isActive(pathname, "/search")} />
        <DockLink
          href="/notifications"
          label="通知"
          icon={Bell}
          active={pathname === "/notifications"}
          badge={unreadCount}
        />
      </nav>

      <div className="mt-3 flex items-center justify-between gap-1 border-t border-line pt-3">
        <Link
          href={accountHref}
          className={cn(
            "flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-2 text-xs transition-colors",
            pathname.startsWith("/profile") || pathname === "/login"
              ? "bg-surface-2 font-semibold text-foreground"
              : "text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <User size={15} />
          <span className="truncate">{accountLabel}</span>
        </Link>
        <Link
          href="/settings"
          aria-label="設定"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            pathname === "/settings"
              ? "bg-surface-2 text-foreground"
              : "text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <Settings size={16} />
        </Link>
        {isModerator && (
          <Link
            href="/moderation"
            aria-label="モデレーション"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
              pathname === "/moderation"
                ? "bg-surface-2 text-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <ShieldAlert size={16} />
          </Link>
        )}
        <ThemeToggle />
      </div>

      <Link
        href="/about"
        className="mt-3 px-2 text-[10px] tracking-widest text-subtle hover:text-muted"
      >
        © ZINE 2026 ・ 規約
      </Link>
    </aside>
  );
}
