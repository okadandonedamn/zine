import Link from "next/link";
import { Bell } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

/** モバイル用トップバー(PCではSidebarがあるため非表示) */
export function Header({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-background/90 px-4 backdrop-blur md:hidden print:hidden">
      <Link href="/home" className="font-display text-xl font-bold tracking-widest">
        ZINE
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href="/notifications"
          aria-label={`通知${unreadCount > 0 ? `(未読${unreadCount}件)` : ""}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-accent-fg">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
