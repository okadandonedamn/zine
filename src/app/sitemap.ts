import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** 静的ルートのサイトマップ。作品・記事の動的URLは将来ここに追加する */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/home",
    "/works",
    "/boards",
    "/records",
    "/records/calendar",
    "/records/stats",
    "/goals",
    "/search",
    "/review-templates",
  ];
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/home" ? "hourly" : "daily",
    priority: path === "/home" ? 1 : 0.7,
  }));
}
