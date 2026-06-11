import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarRatingChart } from "@/components/review/radar-rating-chart";
import { DEFAULT_TEMPLATES, USER_TEMPLATES } from "@/lib/review-templates";
import { CATEGORY_LABELS } from "@/lib/types";

export const metadata = { title: "評価軸テンプレート" };

export default function ReviewTemplatesPage() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">評価軸テンプレート</h1>
      <p className="mt-1 text-sm text-muted">
        批評の型のコレクション。レビューを書くとき、ここから始められます。
      </p>

      <h2 className="mt-8 font-display text-sm font-semibold tracking-wider text-muted">
        マイテンプレート
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {USER_TEMPLATES.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">{t.name}</h3>
              <Badge variant="accent">自作</Badge>
            </div>
            <RadarRatingChart axes={t.axes.map((axis) => ({ axis, score: 7 }))} size="md" />
            <p className="text-center text-xs text-subtle">{t.axes.join(" / ")}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 font-display text-sm font-semibold tracking-wider text-muted">
        カテゴリ別デフォルト
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {DEFAULT_TEMPLATES.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">{t.name}</h3>
              {t.category !== "custom" && <Badge>{CATEGORY_LABELS[t.category]}</Badge>}
            </div>
            <RadarRatingChart axes={t.axes.map((axis) => ({ axis, score: 7 }))} size="md" />
            <p className="text-center text-xs text-subtle">{t.axes.join(" / ")}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
