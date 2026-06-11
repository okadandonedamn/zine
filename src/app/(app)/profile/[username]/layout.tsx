import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/user-avatar";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { FollowButton } from "@/components/profile/follow-button";
import { getCurrentUser, getUserByUsername } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "プロフィール" };
  return {
    title: `${user.displayName}(@${user.username})`,
    description: user.bio.slice(0, 120),
  };
}

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();
  const me = await getCurrentUser();
  const isMe = me?.id === user.id;

  return (
    <div>
      {/* プロフィールヘッダー */}
      <div className="border-b border-line px-5 pb-5 pt-8 sm:px-6">
        <div className="flex items-start gap-4">
          <UserAvatar user={user} size="lg" link={false} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold">{user.displayName}</h1>
            <p className="text-sm text-subtle">@{user.username}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{user.bio}</p>
            <p className="mt-2 flex gap-4 text-xs text-subtle">
              <span>
                <span className="font-semibold text-foreground">{user.following}</span> フォロー
              </span>
              <span>
                <span className="font-semibold text-foreground">{user.followers}</span> フォロワー
              </span>
            </p>
          </div>
          {isMe ? (
            <Link href="/settings">
              <Button variant="outline" size="sm">
                編集
              </Button>
            </Link>
          ) : (
            <FollowButton userId={user.id} />
          )}
        </div>
      </div>
      <ProfileTabs username={user.username} />
      {children}
    </div>
  );
}
