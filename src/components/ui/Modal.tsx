import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * The one overlay in this app.
 *
 * Twelve hand-written `fixed inset-0` blocks preceded this, each with its own
 * class list, which is why every previous fix reached one or two of them and
 * left the rest: the scroll lock, the close button that rendered at the
 * top-left, the close button that scrolled out of reach. None of those bugs
 * can recur in only some modals now.
 *
 * Radix supplies the behaviour that was hand-written or missing — focus trap,
 * scroll lock, Escape, portal, ARIA — and no styling, so Tailwind and the
 * `@theme` tokens stay the single visual system.
 *
 * Shape follows the platform rather than the breakpoint being convenient: a
 * sheet rising from the bottom edge within thumb reach on a phone, a centred
 * dialog on a pointer device.
 */

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Announced as the dialog's name. Required — an unnamed dialog is unusable
   *  with a screen reader. Pass `hideTitle` when the design shows its own. */
  title: string;
  /** Longer description, announced after the title. */
  description?: string;
  hideTitle?: boolean;
  /**
   * Custom header content, rendered in the sticky area beside the close button.
   * Several dialogs have a designed header with its own icon and subtitle;
   * putting it here keeps it pinned instead of scrolling away with the body.
   * `title` is still required and becomes the accessible name.
   */
  header?: React.ReactNode;
  children: React.ReactNode;
  /** Wider panel for content-heavy dialogs. Defaults to `md`. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Hide the built-in close button when the content provides its own. */
  hideCloseButton?: boolean;
  /** Applied to the panel, for the rare case that needs it. */
  className?: string;
  id?: string;
}

const SIZES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "lg:max-w-sm",
  md: "lg:max-w-md",
  lg: "lg:max-w-2xl",
  xl: "lg:max-w-4xl",
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  header,
  children,
  size = "md",
  hideCloseButton = false,
  className = "",
  id,
}) => {
  /**
   * The element to hand focus back to.
   *
   * Radix restores focus to its own `Dialog.Trigger`, and every dialog here is
   * controlled from an external button instead — so on close focus fell to
   * `<body>` and a keyboard user was dropped at the top of the document.
   * Remembering what was focused when the dialog opened restores that.
   */
  const contentRef = React.useRef<HTMLDivElement>(null);
  const restoreFocusTo = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) restoreFocusTo.current = document.activeElement as HTMLElement | null;
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=open]:fade-in" />

        <Dialog.Content
          id={id}
          ref={contentRef}
          /* Radix focuses the first tabbable element, which drew the focus ring
           around the close button and made it read as the dialog's primary
           action. Preventing it used to cost focus restoration; now that the
           restore below is ours, it costs nothing. */
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            contentRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocusTo.current?.focus({ preventScroll: true });
          }}
          className={[
            // Mobile: a sheet pinned to the bottom edge, never taller than the
            // viewport minus the safe area, scrolling inside itself.
            // Stops where the bottom navigation begins rather than running
            // under it: the last 65px of the sheet were landing on top of the
            // nav bar, which read as the panel sitting too low on the screen.
            "fixed inset-x-0 bottom-[var(--bottom-nav-height)] z-50 flex w-full flex-col",
            "max-h-[calc(100dvh-var(--bottom-nav-height)-2rem)]",
            "rounded-t-3xl border-t border-outline-variant/40 dark:border-slate-700",
            // Desktop: centred, with the sheet affordances dropped.
            // The nav bar is hidden above lg, so the offset goes with it.
            "lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-h-[85vh]",
            "lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:border",
            SIZES[size],
            // focus-visible:outline-none beats the global :focus-visible ring on
            // specificity: the panel takes focus on open, and a ring around the
            // whole sheet reads as an error state.
            "bg-surface-container-lowest shadow-2xl focus:outline-none focus-visible:outline-none dark:bg-slate-900",
            "data-[state=open]:animate-in data-[state=open]:fade-in",
            className,
          ].join(" ")}
          /* Auto-focus is Radix's. Preventing it and focusing the panel avoided a
           ring around the close button, but it also stopped focus returning to
           the trigger on close -- confirmed in the browser, where jsdom had
           been silent. A keyboard user dropped at the top of the document is a
           real failure; a focus ring is the affordance those same users need. */
        >
          {/* Reads as "this can be dismissed" on a touch device. Above the
            sticky header, which would otherwise cover it. */}
          <div
            aria-hidden="true"
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-outline-variant/60 dark:bg-slate-600 lg:hidden"
          />
          {/* Sticky, so it stays reachable however long the content runs. The
            previous panels put it in the scrolling area and it vanished. */}
          <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 rounded-t-3xl bg-surface-container-lowest/95 px-6 pt-4 backdrop-blur-xs dark:bg-slate-900/95">
            {header ? (
              <>
                {/* A span, not a heading: the custom header already provides the
                  visible one, and two headings with the same text put a
                  duplicate in the accessibility tree. Radix still uses this as
                  the dialog's accessible name. */}
                <Dialog.Title asChild>
                  <span className="sr-only">{title}</span>
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="sr-only">{description}</Dialog.Description>
                )}
                <div className="min-w-0 flex-1">{header}</div>
              </>
            ) : (
              <div className={hideTitle ? "sr-only" : "min-w-0 space-y-1"}>
                <Dialog.Title className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-sm text-on-surface-variant dark:text-slate-400">
                    {description}
                  </Dialog.Description>
                )}
              </div>
            )}

            {!hideCloseButton && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Cerrar modal"
                  className="tap-target -mr-2 shrink-0 rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-3">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
