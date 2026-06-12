import { WorkEditor } from "@/components/work/work-editor";
import { getWorks } from "@/lib/data";

export const metadata = { title: "作品を登録" };

export default async function NewWorkPage() {
  const works = await getWorks();
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">作品を登録する</h1>
      <p className="mt-1 text-sm text-muted">
        手動登録は例外経路です。まず検索を — 探したら、もうあるかもしれません。
      </p>
      <div className="mt-6">
        <WorkEditor existingWorks={works} />
      </div>
    </div>
  );
}
