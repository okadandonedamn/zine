import Link from "next/link";

export function TagBadge({ tag }: { tag: string }) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className="text-xs text-accent hover:underline"
    >
      #{tag}
    </Link>
  );
}
