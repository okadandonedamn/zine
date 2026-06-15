import Link from "next/link";
import type { ReactNode } from "react";
import { Timeline } from "./timeline";
import {
  areDefaultTimelineTypes,
  normalizeTimelineFeed,
  parseTimelineTypes,
  serializeTimelineTypes,
  TIMELINE_CONTENT_TYPES,
  TIMELINE_FEEDS,
  type TimelineContentType,
  type TimelineFeed,
} from "@/lib/timeline";
import { getTimeline } from "@/lib/data";
import { cn } from "@/lib/utils";

type TimelineSearchParams = {
  feed?: string | string[];
  tab?: string | string[];
  types?: string | string[];
};

function paramValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildTimelineHref(
  basePath: string,
  feed: TimelineFeed,
  types: TimelineContentType[],
  includeTypes: boolean,
) {
  const params = new URLSearchParams();
  params.set("feed", feed);
  if (includeTypes && (!areDefaultTimelineTypes(types) || types.length === 0)) {
    params.set("types", serializeTimelineTypes(types));
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function toggleType(
  selectedTypes: TimelineContentType[],
  type: TimelineContentType,
): TimelineContentType[] {
  const next = selectedTypes.includes(type)
    ? selectedTypes.filter((selected) => selected !== type)
    : [...selectedTypes, type];
  return TIMELINE_CONTENT_TYPES.map((item) => item.key).filter((key) => next.includes(key));
}

export async function TimelineSurface({
  searchParams,
  basePath,
  fixedTypes,
  showTypeFilters = true,
  children,
}: {
  searchParams: TimelineSearchParams;
  basePath: string;
  fixedTypes?: TimelineContentType[];
  showTypeFilters?: boolean;
  children?: ReactNode;
}) {
  const feed = normalizeTimelineFeed(
    paramValue(searchParams.feed) ?? paramValue(searchParams.tab),
  );
  const selectedTypes = fixedTypes ?? parseTimelineTypes(paramValue(searchParams.types));
  const items = await getTimeline(feed, { types: selectedTypes });
  const includeTypes = !fixedTypes && showTypeFilters;

  return (
    <section>
      <div className="sticky top-12 z-20 border-b border-line bg-background/90 backdrop-blur md:top-0">
        <div className="flex overflow-x-auto">
          {TIMELINE_FEEDS.map((item) => (
            <Link
              key={item.key}
              href={buildTimelineHref(basePath, item.key, selectedTypes, includeTypes)}
              scroll={false}
              aria-current={feed === item.key ? "page" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors",
                feed === item.key
                  ? "border-b-2 border-accent font-semibold text-foreground"
                  : "text-subtle hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {showTypeFilters && !fixedTypes && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3">
            {TIMELINE_CONTENT_TYPES.map((type) => {
              const nextTypes = toggleType(selectedTypes, type.key);
              const active = selectedTypes.includes(type.key);
              return (
                <Link
                  key={type.key}
                  href={buildTimelineHref(basePath, feed, nextTypes, true)}
                  scroll={false}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line text-muted hover:text-foreground",
                  )}
                >
                  {type.shortLabel}
                </Link>
              );
            })}
          </div>
        )}
      </div>
      {children}
      <Timeline items={items} />
    </section>
  );
}
