import { RecordEditor } from "@/components/record/record-editor";
import { getWorks } from "@/lib/data";

export const metadata = { title: "記録する" };

export default async function NewRecordPage() {
  const works = await getWorks();
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">鑑賞を記録する</h1>
      <p className="mt-1 text-sm text-muted">
        観た、読んだ、聴いた、行った。今日の文化的活動をひとつ。
      </p>
      <div className="mt-6">
        <RecordEditor works={works} />
      </div>
    </div>
  );
}
