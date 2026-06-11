import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoalCard } from "@/components/record/goal-card";
import { getGoals, getStreak } from "@/lib/data";

export const metadata = { title: "目標" };

export default async function GoalsPage() {
  const [goals, streak] = await Promise.all([getGoals(), getStreak()]);
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">鑑賞目標</h1>
      <p className="mt-1 text-sm text-muted">
        無理のないペースで、文化を生活の習慣に。
      </p>

      <Card className="mt-6 flex items-center gap-4 p-5">
        <Flame size={28} className="text-accent" />
        <div>
          <p className="font-display text-xl font-semibold">{streak}日連続</p>
          <p className="text-xs text-subtle">記録が続いています。今日も何か一つ。</p>
        </div>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </div>

      <Button variant="outline" className="mt-4">
        新しい目標を立てる(Phase 7 で保存対応)
      </Button>
    </div>
  );
}
