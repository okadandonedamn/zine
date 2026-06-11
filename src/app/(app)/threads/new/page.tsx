import { ThreadEditor } from "@/components/board/thread-editor";
import { getBoards, getWorks } from "@/lib/data";

export const metadata = { title: "スレッドを立てる" };

export default async function NewThreadPage() {
  const [boards, works] = await Promise.all([getBoards(), getWorks()]);
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">スレッドを立てる</h1>
      <p className="mt-1 text-sm text-muted">深く語りたいテーマを、議論の場へ。</p>
      <div className="mt-6">
        <ThreadEditor boards={boards} works={works} />
      </div>
    </div>
  );
}
