import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

/** 0.5刻みの星評価(表示用) */
export function RatingStars({
  rating,
  size = 14,
  showNumber = true,
  className,
}: {
  rating: number;
  size?: number;
  showNumber?: boolean;
  className?: string;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-accent", className)}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full)
          return <Star key={i} size={size} fill="currentColor" strokeWidth={0} />;
        if (i === full && half)
          return (
            <span key={i} className="relative inline-flex" style={{ width: size, height: size }}>
              <Star size={size} className="absolute text-line" fill="currentColor" strokeWidth={0} />
              <StarHalf size={size} className="absolute" fill="currentColor" strokeWidth={0} />
            </span>
          );
        return <Star key={i} size={size} className="text-line" fill="currentColor" strokeWidth={0} />;
      })}
      {showNumber && (
        <span className="ml-1 text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
      )}
    </span>
  );
}
