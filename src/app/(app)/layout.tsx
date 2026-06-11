import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RightRail } from "@/components/layout/right-rail";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser, getUnreadNotificationCount } from "@/lib/data";

/**
 * AppLayout: PCは3カラム(ナビ / メイン / レール)、モバイルは1カラム+下部ナビ。
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, unreadCount] = await Promise.all([
    getCurrentUser(),
    getUnreadNotificationCount(),
  ]);
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-sm text-accent-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        本文へスキップ
      </a>
      <Sidebar meUsername={me?.username ?? null} unreadCount={unreadCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header unreadCount={unreadCount} />
        <main id="main" className="flex-1 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <RightRail />
      <MobileNav meUsername={me?.username ?? null} />
    </div>
  );
}
