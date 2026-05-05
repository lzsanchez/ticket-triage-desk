import { cn } from "@/lib/utils";
import { calcularAging } from "@/lib/utils";

type Props = {
  dataAbertura: Date;
  ref?: Date;
  className?: string;
};

export function AgingBadge({ dataAbertura, ref, className }: Props) {
  const dias = calcularAging(dataAbertura, ref);

  const style =
    dias > 30
      ? "bg-destructive/15 text-destructive border border-destructive/30"
      : dias > 14
        ? "bg-warning/15 text-warning border border-warning/30"
        : dias > 7
          ? "bg-muted text-foreground border border-border"
          : "bg-muted/60 text-muted-foreground border border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums whitespace-nowrap",
        style,
        className,
      )}
    >
      {dias}d
    </span>
  );
}
