import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { CollectionCard } from "@/components/collection/collection-card";
import { getCurrentUser, getMyCollections } from "@/lib/data";

export const metadata = { title: "コレクション" };

export default async function CollectionsPage() {
  const [me, collections] = await Promise.all([getCurrentUser(), getMyCollections()]);

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">コレクション</h1>
          <p className="mt-1 text-sm text-muted">
            作品を並べて、文脈を編む。「雨の日の映画十二選」のように。
          </p>
        </div>
        <Link href="/collections/new">
          <Button>
            <Plus size={15} />
            新しく編む
          </Button>
        </Link>
      </div>

      {!me ? (
        <div className="mt-6">
          <EmptyState
            title="ログインするとコレクションを作れます"
            description="お気に入りの作品を並べた、あなただけのリストを公開できます。"
            action={
              <Link href="/login">
                <Button variant="outline">ログイン</Button>
              </Link>
            }
          />
        </div>
      ) : collections.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="まだコレクションがありません"
            description="主題でも、季節でも、気分でも。最初のリストを編んでみましょう。"
            action={
              <Link href="/collections/new">
                <Button variant="outline">最初のコレクションを作る</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      )}
    </div>
  );
}
