import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Heart, MessageCircle } from "lucide-react";
import { UserAvatar } from "@/components/common/user-avatar";
import { TagBadge } from "@/components/common/tag-badge";
import { WorkChip } from "@/components/timeline/work-chip";
import { getArticle, getUsers, getWork } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "記事" };
  return {
    title: article.title,
    description: article.excerpt.slice(0, 120),
    openGraph: { title: `${article.title} | ZINE`, description: article.excerpt.slice(0, 120) },
  };
}

/** Markdown風の簡易レンダリング(## 見出しと段落のみ) */
function ArticleBody({ body }: { body: string }) {
  return (
    <div className="prose-zine">
      {body.split("\n\n").map((block, i) =>
        block.startsWith("## ") ? (
          <h2 key={i}>{block.slice(3)}</h2>
        ) : (
          <p key={i}>{block}</p>
        ),
      )}
    </div>
  );
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const author = article.author ?? (await getUsers())[0];
  const relatedWorks = (
    await Promise.all(article.relatedWorkIds.map((wid) => getWork(wid)))
  ).filter((w) => w !== undefined);

  return (
    <article>
      {/* カバー */}
      <div
        className="h-40 sm:h-52"
        style={{ background: `linear-gradient(160deg, ${article.coverFrom}, ${article.coverTo})` }}
      />
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="font-display text-2xl font-bold leading-relaxed sm:text-3xl">
          {article.title}
        </h1>
        <div className="mt-5 flex items-center gap-3 border-b border-line pb-5">
          <UserAvatar user={author} />
          <div>
            <Link
              href={`/profile/${author.username}`}
              className="text-sm font-semibold hover:underline"
            >
              {author.displayName}
            </Link>
            <p className="flex items-center gap-2 text-xs text-subtle">
              <Clock size={11} />
              読了{article.readMinutes}分
            </p>
          </div>
        </div>

        <div className="py-8">
          <ArticleBody body={article.body} />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {article.tags.map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
          <span className="ml-auto flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Heart size={15} />
              {article.likes}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={15} />
              {article.comments}
            </span>
          </span>
        </div>

        {relatedWorks.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
              この記事で語られている作品
            </h2>
            <div className="mt-3 space-y-2">
              {relatedWorks.map((w) => (
                <WorkChip key={w.id} work={w} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
