import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "accent" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs",
        variant === "default" && "bg-surface-2 text-muted",
        variant === "accent" && "bg-accent/15 text-accent",
        variant === "outline" && "border border-line text-muted",
        className,
      )}
      {...props}
    />
  );
}
