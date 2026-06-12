import Link from "next/link";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    num: "01",
    title: "タイムライン",
    body: "短文も、レビューも、鑑賞記録も、スレッドも。すべての文化的活動がひとつの流れに集まる。",
  },
  {
    num: "02",
    title: "長文記事",
    body: "批評、考察、創作ノート。深夜の机のように静かなエディタで、思想を書き残す。",
  },
  {
    num: "03",
    title: "スレッド議論",
    body: "作品をめぐる深い議論のための掲示板。匿名でも、名前を出しても。",
  },
  {
    num: "04",
    title: "自由評価軸レビュー",
    body: "星だけでは足りない。5つの軸を自分で命名し、自分だけの批評の型 — 五角形を描く。",
  },
  {
    num: "05",
    title: "鑑賞記録",
    body: "観た、読んだ、聴いた、行った。カレンダーと統計が、あなたの文化的生活を蓄積する。",
  },
];

export default function LandingPage() {
  return (
    <div className="relative z-10 mx-auto max-w-4xl px-6">
      {/* ヒーロー */}
      <section className="flex min-h-[80vh] flex-col items-start justify-center py-24">
        <p className="text-xs tracking-[0.4em] text-subtle">CULTURE / TIMELINE / ARCHIVE</p>
        <h1 className="mt-6 font-display text-7xl font-bold tracking-widest sm:text-8xl">
          ZINE
        </h1>
        <p className="mt-8 max-w-xl font-display text-lg leading-9 text-muted">
          映画館の暗がり、古書店の棚、深夜の掲示板。
          <br />
          作品を観て、記録して、批評して、語り合う。
          <br />
          文化的活動が流れ、蓄積されるタイムライン。
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/home">
            <Button size="lg">タイムラインへ</Button>
          </Link>
          <Link href="/works">
            <Button size="lg" variant="outline">
              作品を探す
            </Button>
          </Link>
        </div>
      </section>

      {/* 5機能 */}
      <section className="border-t border-line py-20">
        <h2 className="font-display text-sm tracking-[0.3em] text-subtle">
          FIVE WAYS TO TALK ABOUT CULTURE
        </h2>
        <div className="mt-10 space-y-10">
          {FEATURES.map((f) => (
            <div key={f.num} className="flex gap-6 border-b border-line pb-10 last:border-b-0">
              <span className="font-display text-2xl text-accent">{f.num}</span>
              <div>
                <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 max-w-lg leading-8 text-muted">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="space-y-2 border-t border-line py-10 text-center text-xs tracking-widest text-subtle">
        <p>ZINE — 作品を語る場所 © 2026</p>
        <p className="tracking-normal">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </footer>
    </div>
  );
}
