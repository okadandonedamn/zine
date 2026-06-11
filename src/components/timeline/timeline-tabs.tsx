"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TIMELINE_TABS, type TimelineTab } from "@/lib/timeline";

/**
 * タブはURL(?tab=)で表現する。
 * Phase 7 でサーバーフェッチに移行しても、この設計ならそのまま動く。
 */
export function TimelineTabs({ active }: { active: TimelineTab }) {
  return (
    <div className="sticky top-12 z-20 border-b border-line bg-background/90 backdrop-blur md:top-0">
      <div className="flex overflow-x-auto">
        {TIMELINE_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "foryou" ? "/home" : `/home?tab=${tab.key}`}
            scroll={false}
            aria-current={active === tab.key ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors",
              active === tab.key
                ? "border-b-2 border-accent font-semibold text-foreground"
                : "text-subtle hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
