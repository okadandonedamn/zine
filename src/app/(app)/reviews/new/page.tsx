import { ReviewEditor } from "@/components/review/review-editor";
import { getWorks } from "@/lib/data";

export const metadata = { title: "レビューを書く" };

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ work?: string }>;
}) {
  const [{ work }, works] = await Promise.all([searchParams, getWorks()]);
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">レビューを書く</h1>
      <p className="mt-1 text-sm text-muted">
        星と、5つの批評軸と、本文。あなたの批評の型で作品を測る。
      </p>
      <div className="mt-6">
        <ReviewEditor works={works} initialWorkId={work} />
      </div>
    </div>
  );
}
