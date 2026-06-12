import { CollectionForm } from "@/components/collection/collection-form";

export const metadata = { title: "コレクションを作る" };

export default function NewCollectionPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">コレクションを作る</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        作品リストに名前を付けて、あなたの文脈で並べ直す。
        並べることは、もうひとつの批評です。
      </p>
      <div className="mt-8">
        <CollectionForm />
      </div>
    </div>
  );
}
