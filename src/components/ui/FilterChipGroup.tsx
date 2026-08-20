import React from "react";

export interface FilterChipOption {
  /** Value stored in state when the chip is picked. */
  id: string;
  /** Spanish label shown on the chip. */
  label: string;
  /** How many results this option would give with the other filters as they are. */
  count: number;
}

interface FilterChipGroupProps {
  /** Spanish label for the whole group. */
  label: string;
  icon?: React.ReactNode;
  options: FilterChipOption[];
  value: string;
  onChange: (id: string) => void;
  /**
   * Prefix for each chip's `id`, so E2E tests can target a chip by value
   * rather than by its visible Spanish copy.
   */
  idPrefix: string;
  /**
   * `scroll` keeps the chips on one swipeable row — right for a short list on
   * a phone. `wrap` flows them onto several lines, which suits a long list
   * such as the countries.
   */
  layout?: "scroll" | "wrap";
  /** Resets the group. Omitted when the group is already on its default. */
  onClear?: () => void;
}

/**
 * A single-choice filter rendered as chips with a live result count.
 *
 * This replaces the native `<select>` elements the filters used on mobile.
 * A `<select>` on a phone opens the operating system's own picker, which
 * cannot show how many results each option leads to — and with 30 of the 48
 * country x level combinations empty, that count is the whole point.
 *
 * An option with no results stays visible and is disabled rather than hidden:
 * removing it would make the list of options shift underneath the reader every
 * time another filter changed.
 */
export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  label,
  icon,
  options,
  value,
  onChange,
  idPrefix,
  layout = "scroll",
  onClear,
}) => {
  const labelId = `${idPrefix}-label`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span
            id={labelId}
            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400"
          >
            {label}
          </span>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-secondary dark:text-teal-400 hover:underline cursor-pointer active:scale-95 transition-transform"
          >
            Ver todos
          </button>
        )}
      </div>

      <div
        role="group"
        aria-labelledby={labelId}
        className={
          layout === "scroll"
            ? "flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5"
            : "flex flex-wrap gap-2"
        }
      >
        {options.map((option) => {
          const isSelected = value === option.id;
          const isEmpty = option.count === 0 && !isSelected;
          return (
            <button
              key={option.id}
              type="button"
              id={`${idPrefix}-${option.id}`}
              onClick={() => onChange(option.id)}
              disabled={isEmpty}
              aria-pressed={isSelected}
              title={isEmpty ? "No hay convocatorias con los filtros actuales" : undefined}
              className={`shrink-0 inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all select-none ${
                isEmpty
                  ? "bg-surface dark:bg-slate-900 text-on-surface-variant/40 dark:text-slate-600 cursor-not-allowed border border-transparent"
                  : isSelected
                    ? "bg-primary text-white dark:bg-sky-600 shadow-sm ring-2 ring-primary/30 cursor-pointer active:scale-95"
                    : "bg-surface dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/60 border border-outline-variant/30 dark:border-slate-700 cursor-pointer active:scale-95"
              }`}
            >
              <span className="whitespace-nowrap">{option.label}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-mono tabular-nums ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-400"
                }`}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
