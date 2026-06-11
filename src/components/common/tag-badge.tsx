import Link from "next/link";

export function TagBadge({ tag }: { tag: string }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(tag)}`}
      className="text-xs text-accent hover:underline"
    >
      #{tag}
    </Link>
  );
}
