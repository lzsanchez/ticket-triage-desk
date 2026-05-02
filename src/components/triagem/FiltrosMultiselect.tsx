import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type Props = {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function FiltrosMultiselect({ label, options, selected, onChange }: Props) {
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  }

  const resumo = selected.length === 0
    ? `Todos`
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label ?? "1 selecionado"
      : `${selected.length} selecionados`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 justify-between gap-2 min-w-[180px]">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="text-sm font-medium text-foreground truncate">{resumo}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <div className="max-h-72 overflow-y-auto">
          {options.map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                  active && "bg-accent/60",
                )}
              >
                <span>{opt.label}</span>
                {active ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            );
          })}
        </div>
        {selected.length > 0 ? (
          <div className="border-t mt-1 pt-1">
            <button
              className="w-full rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
              onClick={() => onChange([])}
            >
              Limpar seleção
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
