import Link from "next/link";
import { MessagesSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBoards } from "@/lib/data";

export const metadata = { title: "掲示板" };

export default async function BoardsPage() {
  const boards = await getBoards();
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">掲示板</h1>
          <p className="mt-1 text-sm text-muted">
            深夜の喫茶店のように。テーマごとに、深く語るための場所。
          </p>
        </div>
        <Link href="/threads/new">
          <Button>
            <Plus size={15} />
            スレッドを立てる
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {boards.map((b) => (
          <Link key={b.id} href={`/boards/${b.id}`}>
            <Card className="h-full p-4 transition-colors hover:border-subtle">
              <h2 className="font-display text-lg font-semibold">{b.name}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{b.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle">
                <MessagesSquare size={13} />
                {b.threadCount}スレッド
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <p className="mt-8 border-l-2 border-accent pl-3 text-xs leading-6 text-subtle">
        ZINEの掲示板は文化的な議論のための場所です。作品への攻撃と人への攻撃を区別すること。
        通報されたレスはモデレーターが確認します。
      </p>
    </div>
  );
}
