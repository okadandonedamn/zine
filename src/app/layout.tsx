import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const zenKakuGothic = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-zen-kaku",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ZINE — 文化が流れるタイムライン", template: "%s | ZINE" },
  description:
    "映画・音楽・文学・美術・展示・舞台・ゲーム。文化的活動が流れ、蓄積され、議論され、記録されるSNS。",
  openGraph: {
    type: "website",
    siteName: "ZINE",
    title: "ZINE — 文化が流れるタイムライン",
    description:
      "観て、記録して、批評して、語り合う。文化的活動が流れ、蓄積されるタイムライン。",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZINE — 文化が流れるタイムライン",
    description:
      "観て、記録して、批評して、語り合う。文化的活動が流れ、蓄積されるタイムライン。",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#141310" },
    { media: "(prefers-color-scheme: light)", color: "#f4f1e8" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${notoSansJP.variable} ${zenKakuGothic.variable} paper-noise min-h-screen`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
