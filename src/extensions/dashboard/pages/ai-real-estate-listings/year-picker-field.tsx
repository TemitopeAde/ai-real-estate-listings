import { useRef, useState, type KeyboardEvent } from "react";
import { Popover } from "radix-ui";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDt } from "@/lib/dashboard-i18n";
import { cn } from "@/lib/utils";

export const MIN_YEAR_BUILT = 1800;
export const maxYearBuilt = () => new Date().getFullYear() + 5;

const PAGE_SIZE = 12;
const COLUMNS = 4;

/** First year of the 12-year page that contains `year`. */
function pageStart(year: number): number {
  return year - ((year - MIN_YEAR_BUILT) % PAGE_SIZE);
}

/** A year-only "calendar": a popover with a 4×3 grid of years and paging. */
export function YearPickerField({
  id,
  value,
  invalid,
  onChange,
}: {
  id?: string;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const t = useDt();
  const maxYear = maxYearBuilt();
  const selected = /^\d{4}$/.test(value) ? Number(value) : undefined;
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(() => pageStart(selected ?? new Date().getFullYear()));
  const grid = useRef<HTMLDivElement>(null);
  const years = Array.from({ length: PAGE_SIZE }, (_, index) => start + index);
  const end = years[years.length - 1]!;

  const openChange = (next: boolean) => {
    if (next) setStart(pageStart(selected ?? new Date().getFullYear()));
    setOpen(next);
  };

  const choose = (year: number) => {
    onChange(String(year));
    setOpen(false);
  };

  const focusYear = (year: number) => {
    const target = Math.min(maxYear, Math.max(MIN_YEAR_BUILT, year));
    const nextStart = pageStart(target);
    if (nextStart !== start) setStart(nextStart);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>(`[data-year="${target}"]`)?.focus());
  };

  // Arrow keys move like a calendar grid; PageUp/PageDown change the range.
  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const year = Number((event.target as HTMLElement).dataset.year);
    if (!year) return;
    const moves: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLUMNS, ArrowDown: COLUMNS, PageUp: -PAGE_SIZE, PageDown: PAGE_SIZE,
    };
    if (event.key in moves) {
      event.preventDefault();
      focusYear(year + moves[event.key]!);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={openChange}>
      <div className="flex gap-1.5">
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            aria-invalid={invalid || undefined}
            aria-haspopup="dialog"
            className={cn(
              "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm font-normal transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              invalid && "border-destructive ring-3 ring-destructive/20",
              !selected && "text-muted-foreground",
            )}
          >
            <span className="truncate">{selected ?? t("yearPickerPlaceholder")}</span>
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </Popover.Trigger>
        {selected ? (
          <Button type="button" variant="ghost" size="icon-sm" className="h-8" aria-label={t("yearPickerClear")} onClick={() => onChange("")}>
            <X />
          </Button>
        ) : null}
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg outline-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            focusYear(selected ?? new Date().getFullYear());
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("yearPickerPrev")} disabled={start <= MIN_YEAR_BUILT} onClick={() => setStart(start - PAGE_SIZE)}>
              <ChevronLeft />
            </Button>
            <span className="text-sm font-medium tabular-nums" aria-live="polite">{start} – {end}</span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("yearPickerNext")} disabled={end >= maxYear} onClick={() => setStart(start + PAGE_SIZE)}>
              <ChevronRight />
            </Button>
          </div>
          <div ref={grid} role="grid" aria-label={t("yearBuilt")} className="grid grid-cols-4 gap-1" onKeyDown={onGridKeyDown}>
            {years.map((year) => {
              const disabled = year < MIN_YEAR_BUILT || year > maxYear;
              const isSelected = year === selected;
              const isCurrent = year === new Date().getFullYear();
              return (
                <button
                  key={year}
                  type="button"
                  role="gridcell"
                  data-year={year}
                  aria-selected={isSelected}
                  disabled={disabled}
                  tabIndex={isSelected || (!selected && isCurrent) ? 0 : -1}
                  onClick={() => choose(year)}
                  className={cn(
                    "h-9 rounded-md text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
                    isSelected ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted",
                    !isSelected && isCurrent && "font-semibold text-primary",
                  )}
                >
                  {year}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between border-t pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => choose(new Date().getFullYear())}>{t("yearPickerThisYear")}</Button>
            {selected ? <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(""); setOpen(false); }}>{t("yearPickerClear")}</Button> : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
