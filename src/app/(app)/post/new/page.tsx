import { Composer } from "@/components/post/composer";
import { getCurrentUser } from "@/lib/data";

export const metadata = { title: "投稿する" };

export default async function NewPostPage() {
  const me = await getCurrentUser();
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold">投稿する</h1>
      <Composer user={me} />
    </div>
  );
}
