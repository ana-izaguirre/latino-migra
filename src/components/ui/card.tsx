import React from "react";

import { cn } from "../../lib/cn";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: DivProps) => (
  <div
    className={cn(
      "bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant/40 dark:border-slate-700 overflow-hidden flex flex-col",
      className
    )}
    {...props}
  />
);

/** The media/banner region of a card. Sits above `CardContent`. */
export const CardHeader = ({ className, ...props }: DivProps) => (
  <div className={cn("relative", className)} {...props} />
);

export const CardContent = ({ className, ...props }: DivProps) => (
  <div className={cn("p-5 space-y-3", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: DivProps) => (
  <div
    className={cn(
      "px-5 pb-5 pt-3 border-t border-outline-variant/30 dark:border-slate-700/50 flex items-center gap-2 mt-auto",
      className
    )}
    {...props}
  />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "text-lg font-bold text-primary dark:text-sky-300 line-clamp-2 text-pretty",
      className
    )}
    {...props}
  />
);
