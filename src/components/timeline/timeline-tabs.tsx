"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TIMELINE_FEEDS, type TimelineFeed } from "@/lib/timeline";

export function TimelineTabs({ active }: { active: TimelineFeed }) {
  return (
    <div className="sticky top-12 z-20 border-b border-line bg-background/90 backdrop-blur md:top-0">
      <div className="flex overflow-x-auto">
        {TIMELINE_FEEDS.map((feed) => (
          <Link
            key={feed.key}
            href={`/home?feed=${feed.key}`}
            scroll={false}
            aria-current={active === feed.key ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors",
              active === feed.key
                ? "border-b-2 border-accent font-semibold text-foreground"
                : "text-subtle hover:text-foreground",
            )}
          >
            {feed.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
