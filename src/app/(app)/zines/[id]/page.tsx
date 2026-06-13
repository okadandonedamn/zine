import { notFound } from "next/navigation";
import { RatingStars } from "@/components/review/rating-stars";
import { ZineControls } from "@/components/zine/zine-controls";
import { getCurrentUser, getZine } from "@/lib/data";
import type { ZineItem } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zine = await getZine(id);
  if (!zine) return { title: "冊子" };
  return { title: zine.title, description: zine.description.slice(0, 120) };
}

/** Markdown風の簡易レンダリング(## 見出しと段落のみ。記事詳細と同じ流儀) */
function ZineBody({ body }: { body: string }) {
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

function itemTitle(item: ZineItem): string {
  if (item.type === "article") return item.article?.title ?? "";
  return item.work ? `『${item.work.title}』評` : "レビュー";
}

/**
 * 冊子の閲覧ページ(誌面)。このURLで人に手渡す。
 * PDF書き出しはブラウザ印刷(print:break-before-page で篇ごとに改ページ)。
 */
export default async function ZineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [zine, me] = await Promise.all([getZine(id), getCurrentUser()]);
  if (!zine) notFound();
  const items = zine.items ?? [];
  const boundDate = new Date(zine.createdAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      {/* 表紙 */}
      <header className="border-b-2 border-foreground pb-10">
        <p className="text-[10px] tracking-[0.3em] text-subtle">
          A ZINE BY {zine.owner?.displayName ?? ""}
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold leading-relaxed sm:text-4xl">
          {zine.title}
        </h1>
        {zine.description && (
          <p className="mt-5 max-w-prose text-sm leading-7 text-muted">{zine.description}</p>
        )}
        <p className="mt-5 text-xs text-subtle">
          全{items.length}篇 ・ {boundDate}に編纂
        </p>
      </header>

      <div className="mt-5">
        <ZineControls zineId={zine.id} isOwner={Boolean(me && me.id === zine.owner?.id)} />
      </div>

      {/* 目次 */}
      <nav className="mt-8 border-b border-line pb-8">
        <h2 className="text-[10px] tracking-[0.3em] text-subtle">目次 / CONTENTS</h2>
        <ol className="mt-4 space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-baseline gap-3 text-sm">
              <span className="font-display text-xs font-semibold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <a href={`#leaf-${i + 1}`} className="hover:text-accent hover:underline">
                {itemTitle(item)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 誌面 */}
      {items.map((item, i) => (
        <section
          key={i}
          id={`leaf-${i + 1}`}
          className="border-b border-line py-10 print:break-before-page"
        >
          <p className="font-display text-xs font-semibold text-accent">
            {String(i + 1).padStart(2, "0")}
          </p>
          {item.type === "article" && item.article && (
            <>
              <h2 className="mt-2 font-display text-xl font-bold leading-relaxed">
                {item.article.title}
              </h2>
              <div className="mt-6">
                <ZineBody body={item.article.body} />
              </div>
            </>
          )}
          {item.type === "review" && item.review && item.work && (
            <>
              <h2 className="mt-2 font-display text-xl font-bold leading-relaxed">
                『{item.work.title}』評
              </h2>
              <p className="mt-1 text-xs text-subtle">
                {item.work.creator} ・ {item.work.year}
              </p>
              {item.review.rating > 0 && (
                <div className="mt-3">
                  <RatingStars rating={item.review.rating} />
                </div>
              )}
              <p className="mt-5 whitespace-pre-wrap text-[15px] leading-8">
                {item.review.body}
              </p>
            </>
          )}
        </section>
      ))}

      {/* 奥付 */}
      <footer className="py-10 text-center">
        <p className="text-[10px] tracking-[0.3em] text-subtle">
          BOUND WITH ZINE ・ {boundDate}
        </p>
      </footer>
    </div>
  );
}
