import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ZineForm } from "@/components/zine/zine-form";
import { getCurrentUser, getMyBindableItems } from "@/lib/data";

export const metadata = { title: "一冊に編む" };

export default async function NewZinePage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <EmptyState
          title="ログインすると冊子を編めます"
          action={
            <Link href="/login">
              <Button variant="outline">ログイン</Button>
            </Link>
          }
        />
      </div>
    );
  }
  const { articles, reviews } = await getMyBindableItems();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">一冊に編む</h1>
      <p className="mt-1 text-sm text-muted">
        あなたの記事とレビューを選んで、デジタル冊子に編纂します。
      </p>
      <div className="mt-6">
        <ZineForm articles={articles} reviews={reviews} />
      </div>
    </div>
  );
}
