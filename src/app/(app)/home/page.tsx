import Link from "next/link";
import { UserAvatar } from "@/components/common/user-avatar";
import { TimelineSurface } from "@/components/timeline/timeline-surface";
import { getCurrentUser } from "@/lib/data";

export const metadata = { title: "ホーム" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string; tab?: string; types?: string }>;
}) {
  const [params, me] = await Promise.all([searchParams, getCurrentUser()]);

  return (
    <div>
      <TimelineSurface searchParams={params} basePath="/home">
        {me ? (
          <Link
            href="/post/new"
            className="hidden items-center gap-3 border-b border-line px-5 py-4 transition-colors hover:bg-surface/60 md:flex"
          >
            <UserAvatar user={me} link={false} />
            <span className="flex-1 text-sm text-subtle">
              いま観たこと、考えたことをタイムラインへ
            </span>
            <span className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg">
              投稿
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="hidden items-center justify-center gap-2 border-b border-line px-5 py-4 text-sm text-muted transition-colors hover:bg-surface/60 md:flex"
          >
            ログインしてタイムラインに参加する →
          </Link>
        )}
      </TimelineSurface>
    </div>
  );
}
