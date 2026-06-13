import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ZineCard } from "@/components/zine/zine-card";
import { getCurrentUser, getMyZines } from "@/lib/data";

export const metadata = { title: "冊子" };

export default async function ZinesPage() {
  const [me, zines] = await Promise.all([getCurrentUser(), getMyZines()]);

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">冊子</h1>
          <p className="mt-1 text-sm text-muted">
            書いてきた記事とレビューを、一冊に編む。URLで人に手渡せます。
          </p>
        </div>
        <Link href="/zines/new">
          <Button>
            <Plus size={15} />
            一冊に編む
          </Button>
        </Link>
      </div>

      {!me ? (
        <div className="mt-6">
          <EmptyState
            title="ログインすると冊子を編めます"
            description="あなたの記事とレビューを選んで、デジタル冊子に編纂できます。"
            action={
              <Link href="/login">
                <Button variant="outline">ログイン</Button>
              </Link>
            }
          />
        </div>
      ) : zines.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="まだ冊子がありません"
            description="半年分の言葉でも、ひとつの主題でも。最初の一冊を編んでみましょう。"
            action={
              <Link href="/zines/new">
                <Button variant="outline">最初の一冊を編む</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {zines.map((z) => (
            <ZineCard key={z.id} zine={z} />
          ))}
        </div>
      )}
    </div>
  );
}
