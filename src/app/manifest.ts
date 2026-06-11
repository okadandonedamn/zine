import type { MetadataRoute } from "next";

/** PWAマニフェスト。スマホで「ホーム画面に追加」するとアプリのように開ける */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZINE — 文化が流れるタイムライン",
    short_name: "ZINE",
    description:
      "映画・音楽・文学・美術・展示・舞台・ゲーム。文化的活動が流れ、蓄積され、議論され、記録されるSNS。",
    start_url: "/home",
    display: "standalone",
    background_color: "#141310",
    theme_color: "#141310",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
