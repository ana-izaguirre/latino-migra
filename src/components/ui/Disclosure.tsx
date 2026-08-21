import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

interface DisclosureProps {
  /** Spanish label for the control, e.g. "Ver requisitos". */
  label: string;
  /** Label once open. Defaults to `label`. */
  labelWhenOpen?: string;
  children: React.ReactNode;
  /** Open on first render. */
  defaultOpen?: boolean;
  /** Prefix for the control's `id`, so E2E can target it. */
  id?: string;
}

/**
 * Collapses long content on a phone and leaves it open on a wide screen.
 *
 * The guides run to 9857px on a 375px viewport — twelve screens of scrolling
 * to reach the anti-scam section at the bottom. Collapsing helps there and
 * only there: on a desktop, where the same content occupies a fraction of the
 * page, hiding it behind a control would be a step backwards.
 *
 * That breakpoint split is done in CSS rather than by measuring the viewport
 * in JavaScript. The panel is always in the DOM and always rendered at `lg`;
 * only below `lg` does the open state control it. So the control itself is
 * hidden at `lg`, and its `aria-expanded` never claims something is collapsed
 * on a screen where it is not.
 */
export const Disclosure: React.FC<DisclosureProps> = ({
  label,
  labelWhenOpen,
  children,
  defaultOpen = false,
  id,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const generatedId = useId();
  const panelId = `${id ?? generatedId}-panel`;

  return (
    <div className="space-y-3">
      {/*
        The breakpoint lives on the wrapper, not on the button. `lg:hidden`
        and `inline-flex` both set `display`, and putting them on one element
        makes the result depend on which utility Tailwind emits last — it
        emitted `inline-flex`, so the control stayed visible on desktop.
      */}
      <div className="lg:hidden">
        <button
          type="button"
          id={id}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-xl border border-outline-variant/40 dark:border-slate-700 bg-surface dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-primary dark:text-sky-300 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <span>{open ? (labelWhenOpen ?? label) : label}</span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div id={panelId} className={`${open ? "block" : "hidden"} lg:block space-y-4`}>
        {children}
      </div>
    </div>
  );
};
