import Link from "next/link";
import { UserAvatar } from "@/components/common/user-avatar";
import { EmptyState } from "@/components/common/empty-state";
import { FollowButton } from "./follow-button";
import type { User } from "@/lib/types";

export function UserList({
  users,
  meId,
  emptyTitle,
}: {
  users: User[];
  meId?: string;
  emptyTitle: string;
}) {
  if (users.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title={emptyTitle} />
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {users.map((u) => (
        <li key={u.id} className="flex items-center gap-3 px-5 py-4">
          <UserAvatar user={u} />
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${u.username}`}
              className="block truncate text-sm font-semibold hover:underline"
            >
              {u.displayName}
            </Link>
            <p className="truncate text-xs text-subtle">@{u.username}</p>
            {u.bio && <p className="mt-1 line-clamp-1 text-xs text-muted">{u.bio}</p>}
          </div>
          {u.id !== meId && <FollowButton userId={u.id} />}
        </li>
      ))}
    </ul>
  );
}
