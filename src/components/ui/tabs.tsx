import * as TabsPrimitive from "@radix-ui/react-tabs";
import React from "react";

import { cn } from "../../lib/cn";

/**
 * Radix supplies the `role="tablist"` / `aria-selected` wiring and arrow-key
 * navigation that a row of plain buttons does not have.
 */
export const Tabs = TabsPrimitive.Root;

export const TabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn("flex flex-wrap items-center gap-2 max-w-full", className)}
    {...props}
  />
);

export const TabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer",
      "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container",
      "dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
      "data-[state=active]:shadow-sm data-[state=active]:border-transparent",
      className
    )}
    {...props}
  />
);

export const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn("focus-visible:outline-none", className)} {...props} />
);
