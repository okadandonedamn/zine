import { notFound } from "next/navigation";
import { UserList } from "@/components/profile/user-list";
import { getCurrentUser, getFollowers, getUserByUsername } from "@/lib/data";

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();
  const [users, me] = await Promise.all([getFollowers(user.id), getCurrentUser()]);
  return (
    <div>
      <h2 className="px-5 pt-4 font-display text-sm font-semibold tracking-wider text-muted">
        フォロワー
      </h2>
      <UserList users={users} meId={me?.id} emptyTitle="まだフォロワーがいません" />
    </div>
  );
}
