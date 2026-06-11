import { WorkEditor } from "@/components/work/work-editor";

export const metadata = { title: "作品を登録" };

export default function NewWorkPage() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">作品を登録する</h1>
      <p className="mt-1 text-sm text-muted">
        まだ書架にない作品を追加して、最初のレビューを書く人になる。
      </p>
      <div className="mt-6">
        <WorkEditor />
      </div>
    </div>
  );
}
