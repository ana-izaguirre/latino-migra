import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import React from "react";

import { cn } from "../../lib/cn";

/**
 * Modal panel: a bottom sheet on phones, a centred dialog from `sm` up.
 *
 * Replaces the hand-rolled `fixed inset-0 bg-black/60` overlays. Radix supplies
 * what those had to be remembered for each time and mostly were not: a focus
 * trap, `role="dialog"` with `aria-modal`, Escape and outside-click dismissal,
 * restoring focus to whatever opened it, and locking the background scroll —
 * so a caller does not also need `useBodyScrollLock`.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in" />
    <DialogPrimitive.Content
      className={cn(
        // Phone: pinned to the bottom edge, capped so the page shows behind it.
        "fixed z-50 inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-y-auto rounded-t-3xl",
        // sm and up: a centred panel.
        "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
        "bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/40 dark:border-slate-700 shadow-2xl",
        "p-5 md:p-6 space-y-5 animate-slide-up-sheet focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between gap-2 pb-3 border-b border-outline-variant/30 dark:border-slate-800",
      className
    )}
    {...props}
  />
);

export const SheetTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn(
      "flex items-center gap-2 font-bold text-base text-primary dark:text-sky-300",
      className
    )}
    {...props}
  />
);

export const SheetDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn("text-xs text-on-surface-variant dark:text-slate-400", className)}
    {...props}
  />
);

export const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "pt-3 border-t border-outline-variant/30 dark:border-slate-800 sticky bottom-0 bg-surface-container-lowest dark:bg-slate-900",
      className
    )}
    {...props}
  />
);

/** Icon-only dismiss button, sized to the 44px touch target the app uses. */
export const SheetCloseButton = ({
  className,
  label,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close> & { label: string }) => (
  <DialogPrimitive.Close
    aria-label={label}
    className={cn(
      "tap-target p-1.5 text-on-surface-variant hover:bg-surface-container dark:hover:bg-slate-800 rounded-full active:scale-95 cursor-pointer",
      className
    )}
    {...props}
  >
    <X className="w-5 h-5" />
  </DialogPrimitive.Close>
);
