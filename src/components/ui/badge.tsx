import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { cn } from "../../lib/cn";

/**
 * One variant per axis a scholarship is labelled on, so adding an education
 * level does not mean copying another block of colour classes.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        level: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
        support: "bg-secondary-container/40 text-secondary dark:bg-teal-500/20 dark:text-teal-300",
        institution:
          "bg-primary/10 text-primary font-semibold dark:bg-sky-500/20 dark:text-sky-300",
        urgent: "bg-amber-500/90 text-amber-950",
        official: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40",
        neutral: "bg-surface-container text-on-surface dark:bg-slate-700 dark:text-slate-200",
        count: "bg-white/20 text-white",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[11px] px-2 py-0.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, size, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
);

export { badgeVariants };
