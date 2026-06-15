import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

/** モバイル用トップバー。通知は下部ナビに集約する。 */
export function Header({ unreadCount = 0 }: { unreadCount?: number }) {
  void unreadCount;
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-background/90 px-4 backdrop-blur md:hidden print:hidden">
      <Link href="/home" className="font-display text-xl font-bold tracking-widest">
        ZINE
      </Link>
      <ThemeToggle />
    </header>
  );
}
