import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  color?: "primary" | "success" | "warning" | "destructive";
}

export function Progress({ value, className, color = "primary" }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  const colorClass = {
    primary: "bg-primary",
    success: "bg-[color:var(--success)]",
    warning: "bg-[color:var(--warning)]",
    destructive: "bg-destructive",
  }[color];

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full transition-all", colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
