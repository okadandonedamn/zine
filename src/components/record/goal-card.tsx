import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type Goal } from "@/lib/types";

const PERIOD_LABELS = { weekly: "今週", monthly: "今月", yearly: "今年" } as const;

export function GoalCard({ goal }: { goal: Goal }) {
  const pct = Math.round((goal.current / goal.target) * 100);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold">{goal.title}</h3>
        <Badge variant="outline">
          {PERIOD_LABELS[goal.period]}
          {goal.category !== "all" && ` / ${CATEGORY_LABELS[goal.category]}`}
        </Badge>
      </div>
      <p className="mt-3 font-display text-2xl">
        {goal.current}
        <span className="text-sm text-subtle">
          {" "}
          / {goal.target}
          {goal.unit}
        </span>
        <span className="ml-3 text-sm text-accent">{pct}%</span>
      </p>
      <Progress value={pct} className="mt-2" />
    </Card>
  );
}
