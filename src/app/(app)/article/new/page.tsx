import { ArticleEditor } from "@/components/article/article-editor";
import { getWorks } from "@/lib/data";

export const metadata = { title: "記事を書く" };

export default async function NewArticlePage() {
  const works = await getWorks();
  return (
    <div className="px-4 py-6 sm:px-6">
      <ArticleEditor works={works} />
    </div>
  );
}
