import { Timeline } from "@/components/timeline/timeline";
import { EmptyState } from "@/components/common/empty-state";
import { getBookmarkedFeed, getCurrentUser } from "@/lib/data";
import Link from "next/link";

export const metadata = { title: "ブックマーク" };

export default async function BookmarksPage() {
  const [items, me] = await Promise.all([getBookmarkedFeed(), getCurrentUser()]);

  return (
    <div>
      <div className="border-b border-line px-4 py-4 sm:px-6">
        <h1 className="font-display text-2xl font-bold">ブックマーク</h1>
        <p className="mt-1 text-sm text-muted">
          あとで読み返したい活動の、あなただけの切り抜き帳。
        </p>
      </div>
      {!me ? (
        <div className="p-6">
          <EmptyState
            title="ログインが必要です"
            description="ブックマークはあなただけが見られるコレクションです。"
            action={
              <Link href="/login" className="text-sm text-accent hover:underline">
                ログインへ →
              </Link>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="まだブックマークがありません"
            description="タイムラインのしおりアイコンで、気になる活動を保存できます。"
          />
        </div>
      ) : (
        <Timeline items={items} />
      )}
    </div>
  );
}
