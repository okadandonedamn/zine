import Link from "next/link";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

const SIZES = { sm: "h-7 w-7 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" };

/** 画像の代わりに色相+頭文字で表現するアバター(将来Storage画像に置換) */
export function UserAvatar({
  user,
  size = "md",
  link = true,
}: {
  user: User;
  size?: keyof typeof SIZES;
  link?: boolean;
}) {
  const el = user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatarUrl}
      alt={user.displayName}
      loading="lazy"
      className={cn("shrink-0 rounded-full object-cover", SIZES[size])}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold",
        SIZES[size],
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${user.avatarHue} 35% 38%), hsl(${user.avatarHue} 45% 22%))`,
        color: "#f0ece2",
      }}
    >
      {user.displayName.slice(0, 1)}
    </span>
  );
  if (!link) return el;
  return (
    <Link href={`/profile/${user.username}`} className="shrink-0">
      {el}
    </Link>
  );
}
