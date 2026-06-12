import { ThreadEditor } from "@/components/board/thread-editor";
import { getWorks } from "@/lib/data";

export const metadata = { title: "スレッドを立てる" };

export default async function NewThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ work?: string }>;
}) {
  const [{ work }, works] = await Promise.all([searchParams, getWorks()]);
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">スレッドを立てる</h1>
      <p className="mt-1 text-sm text-muted">
        作品について深く語りたいテーマを、その作品の語り場へ。
      </p>
      <div className="mt-6">
        <ThreadEditor works={works} initialWorkId={work} />
      </div>
    </div>
  );
}
