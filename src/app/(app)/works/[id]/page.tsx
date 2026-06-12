import Link from "next/link";
import { notFound } from "next/navigation";
import { MessagesSquare, PenLine, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/review/rating-stars";
import { RadarRatingChart } from "@/components/review/radar-rating-chart";
import { UserAvatar } from "@/components/common/user-avatar";
import { EmptyState } from "@/components/common/empty-state";
import { FollowWorkButton } from "@/components/work/follow-work-button";
import { AddToCollection } from "@/components/collection/add-to-collection";
import { CollectionCard } from "@/components/collection/collection-card";
import {
  getArticlesForWork,
  getCollectionsForWork,
  getCurrentUser,
  getMyCollections,
  getRecordsForWork,
  getReviewsForWork,
  getThreadsForWork,
  getUsers,
  getWork,
  isFollowingWork,
} from "@/lib/data";
import { statusLabel } from "@/lib/record-status";
import { CATEGORY_LABELS, type AxisScore } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) return { title: "作品" };
  return {
    title: `${work.title}(${work.creator})`,
    description: work.description.slice(0, 120),
    openGraph: { title: `${work.title} | ZINE`, description: work.description.slice(0, 120) },
  };
}

/** この作品のレビュー全体から平均の五角形を作る */
function averageAxes(axesList: AxisScore[][]): AxisScore[] {
  if (axesList.length === 0) return [];
  const base = axesList[0];
  return base.map((a, i) => ({
    axis: a.axis,
    score:
      Math.round(
        (axesList.reduce((sum, axes) => sum + (axes[i]?.score ?? 0), 0) / axesList.length) * 10,
      ) / 10,
  }));
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) notFound();

  const [reviews, records, threads, articles, users, followingWork, collections, myCollections, me] =
    await Promise.all([
      getReviewsForWork(id),
      getRecordsForWork(id),
      getThreadsForWork(id),
      getArticlesForWork(id),
      getUsers(),
      isFollowingWork(id),
      getCollectionsForWork(id),
      getMyCollections(),
      getCurrentUser(),
    ]);
  const avg = averageAxes(reviews.map((r) => r.axes));

  const statusCounts = records.reduce<Record<string, number>>((acc, r) => {
    const label = statusLabel(work.category, r.status);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* ヘッダー */}
      <div
        className="px-5 pb-6 pt-10 sm:px-8"
        style={{ background: `linear-gradient(170deg, ${work.coverFrom}, ${work.coverTo})` }}
      >
        <p className="text-[10px] tracking-[0.3em] text-white/70">
          {CATEGORY_LABELS[work.category]}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">{work.title}</h1>
        <p className="mt-2 text-sm text-white/80">
          {work.creator} ・ {work.year}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <RatingStars rating={work.avgRating} className="text-white" />
          <span className="text-xs text-white/70">
            レビュー{work.reviewCount}件 / 記録{work.recordCount}件
          </span>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6">
        <p className="leading-8 text-muted">{work.description}</p>
        <div className="flex flex-wrap gap-2">
          {work.tags.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/reviews/new?work=${work.id}`}>
            <Button>
              <PenLine size={15} />
              レビューを書く
            </Button>
          </Link>
          <Link href="/records/new">
            <Button variant="outline">
              <ScrollText size={15} />
              記録する
            </Button>
          </Link>
          <Link href={`/threads/new?work=${work.id}`}>
            <Button variant="outline">
              <MessagesSquare size={15} />
              スレッドを立てる
            </Button>
          </Link>
          <FollowWorkButton workId={work.id} initialFollowing={followingWork} />
        </div>

        {/* みんなの五角形(平均) */}
        {avg.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
              みんなの批評軸(平均)
            </h2>
            <div className="mx-auto max-w-sm">
              <RadarRatingChart axes={avg} size="lg" />
            </div>
          </Card>
        )}

        {/* 鑑賞ステータス内訳 */}
        {Object.keys(statusCounts).length > 0 && (
          <Card className="p-5">
            <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
              鑑賞ステータス
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([label, count]) => (
                <Badge key={label} variant="accent">
                  {label} {count}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* レビュー一覧 */}
        <section>
          <h2 className="font-display text-lg font-semibold">レビュー</h2>
          {reviews.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="まだレビューがありません" description="最初の批評を書いてみませんか。" />
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {reviews.map((r, i) => {
                const author = r.author ?? users[i % users.length];
                return (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={author} size="sm" />
                      <span className="text-sm font-semibold">{author.displayName}</span>
                      <RatingStars rating={r.rating} size={12} />
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted">{r.body}</p>
                    <Link
                      href={`/reviews/${r.id}`}
                      className="mt-2 inline-block text-xs text-accent hover:underline"
                    >
                      続きを読む →
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* コレクション(Phase 5) */}
        {(collections.length > 0 || me) && (
          <section>
            <h2 className="font-display text-lg font-semibold">コレクション</h2>
            {collections.length > 0 && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {collections.map((c) => (
                  <CollectionCard key={c.id} collection={c} showOwner />
                ))}
              </div>
            )}
            {me && (
              <div className="mt-4">
                <AddToCollection workId={work.id} collections={myCollections} />
              </div>
            )}
          </section>
        )}

        {/* 関連スレッド・記事 */}
        {threads.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold">語り場</h2>
            <p className="mt-1 text-xs text-subtle">
              この作品について深く語るスレッド。ネタバレはスレッドのルールに従って。
            </p>
            <div className="mt-3 space-y-2">
              {threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/threads/${t.id}`}
                  className="block rounded-md border border-line p-3 text-sm hover:border-subtle"
                >
                  {t.title}
                  <span className="ml-2 text-xs text-subtle">{t.replyCount}レス</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        {articles.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold">関連記事</h2>
            <div className="mt-3 space-y-2">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/articles/${a.id}`}
                  className="block rounded-md border border-line p-3 text-sm hover:border-subtle"
                >
                  <span className="font-display font-semibold">{a.title}</span>
                  <span className="ml-2 text-xs text-subtle">読了{a.readMinutes}分</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
