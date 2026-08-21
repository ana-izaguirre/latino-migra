import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { cn } from "../../lib/cn";

/**
 * The variants are the ones this app actually uses, not shadcn's defaults:
 * `rounded-xl` and a 40px control rather than `rounded-md` and `h-9`, so a
 * Button drops into the existing layouts without re-tuning the spacing around
 * it. `active:scale-95` reproduces the press feedback that `src/index.css`
 * used to apply globally with `!important`.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-all cursor-pointer select-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:ring-offset-surface [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-sm hover:bg-primary-container dark:bg-sky-600 dark:hover:bg-sky-500",
        soft: "bg-primary/10 text-primary hover:bg-primary hover:text-white dark:bg-sky-900/40 dark:text-sky-300 dark:hover:bg-sky-600 dark:hover:text-white",
        secondary:
          "bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary hover:text-white dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30 dark:hover:bg-teal-600 dark:hover:text-white",
        outline:
          "bg-surface-container-lowest text-on-surface border border-outline-variant/60 hover:bg-surface-container dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
        ghost:
          "text-on-surface-variant hover:bg-surface-container dark:text-slate-300 dark:hover:bg-slate-800",
        success:
          "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/50",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500",
        link: "text-secondary underline-offset-4 hover:underline dark:text-teal-400",
      },
      size: {
        sm: "h-9 px-3 text-xs [&_svg]:size-3.5",
        default: "h-10 px-4 text-xs sm:text-sm [&_svg]:size-4",
        lg: "h-12 w-full px-5 text-sm [&_svg]:size-4",
        icon: "h-10 w-10 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a `<button>`, keeping the styles. */
  asChild?: boolean;
}

export const Button = ({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      // A `<button>` inside a form defaults to `type="submit"`; every button
      // here is an action, so default the other way unless told otherwise.
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};

export { buttonVariants };
