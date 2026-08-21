import React from "react";

import { cn } from "../../lib/cn";

export const Input = ({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type={type ?? "text"}
    className={cn(
      "w-full h-11 px-4 bg-surface-container-lowest dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-sm text-on-surface dark:text-slate-100 placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-teal-400 disabled:opacity-50",
      className
    )}
    {...props}
  />
);
