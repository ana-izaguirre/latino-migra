import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import React from "react";

import { cn } from "../../lib/cn";

/**
 * A listbox this app can style, replacing the native `<select>`.
 *
 * The native popup is drawn by the operating system: on iOS it is a
 * full-screen wheel that ignores the app's radii, spacing and dark theme, and
 * on Android it renders a Material dialog. Radix draws the list in the
 * document instead, so it matches the surrounding UI and keeps arrow-key and
 * type-ahead navigation.
 */
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) => (
  <SelectPrimitive.Trigger
    className={cn(
      "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface cursor-pointer transition-colors",
      "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
      "focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-teal-400",
      "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="w-4 h-4 shrink-0 text-on-surface-variant dark:text-slate-400" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

export const SelectContent = ({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      // Above the z-50 overlays, so a Select opened inside a Sheet is not
      // painted behind it.
      className={cn(
        "relative z-[60] max-h-72 min-w-[10rem] overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xl",
        "dark:border-slate-700 dark:bg-slate-900",
        position === "popper" && "w-[var(--radix-select-trigger-width)]",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
        <ChevronUp className="w-4 h-4 text-on-surface-variant" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1">
        <ChevronDown className="w-4 h-4 text-on-surface-variant" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

export const SelectLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) => (
  <SelectPrimitive.Label
    className={cn(
      "px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400",
      className
    )}
    {...props}
  />
);

export const SelectItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) => (
  <SelectPrimitive.Item
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg py-2.5 pl-8 pr-2 text-xs font-semibold text-on-surface outline-none",
      "dark:text-slate-200",
      "data-[highlighted]:bg-surface-container dark:data-[highlighted]:bg-slate-800",
      "data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary data-[state=checked]:font-bold",
      "dark:data-[state=checked]:bg-sky-900/40 dark:data-[state=checked]:text-sky-300",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="w-3.5 h-3.5" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

export const SelectSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) => (
  <SelectPrimitive.Separator
    className={cn("-mx-1 my-1 h-px bg-outline-variant/40 dark:bg-slate-700", className)}
    {...props}
  />
);
