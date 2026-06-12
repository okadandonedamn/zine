import Link from "next/link";
import { notFound } from "next/navigation";
import { UserList } from "@/components/profile/user-list";
import {
  getCurrentUser,
  getFollowedTags,
  getFollowing,
  getUserByUsername,
} from "@/lib/data";

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();
  const [users, tags, me] = await Promise.all([
    getFollowing(user.id),
    getFollowedTags(user.id),
    getCurrentUser(),
  ]);
  return (
    <div>
      {tags.length > 0 && (
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
            フォロー中のタグ
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-accent hover:text-accent"
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
      )}
      <h2 className="px-5 pt-4 font-display text-sm font-semibold tracking-wider text-muted">
        フォロー中
      </h2>
      <UserList
        users={users}
        meId={me?.id}
        emptyTitle="まだ誰もフォローしていません"
      />
    </div>
  );
}
