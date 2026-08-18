import { useLayoutEffect, RefObject } from "react";

/**
 * Freezes the page behind a full-screen overlay and restores the reading
 * position when it closes.
 *
 * Without this, a `fixed` overlay leaves the document scrollable underneath:
 * swiping moves the page while the panel stays put, which on a phone reads as
 * the screen being stuck.
 *
 * `useLayoutEffect`, not `useEffect`: the overlay is a full-screen fixed
 * element, and by the time a passive effect runs the browser has already
 * painted it and clamped the scroll position to 0 — so the position saved was
 * always 0 and dismissing the overlay sent the user back to the top.
 *
 * @param locked        whether the overlay is open
 * @param resetOnUnlock when its current value is true at unlock time, return to
 *                      the top instead of the saved position — for an overlay
 *                      whose dismissal also navigates somewhere new. The ref is
 *                      set back to false once consumed.
 */
export function useBodyScrollLock(locked: boolean, resetOnUnlock?: RefObject<boolean>) {
  useLayoutEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;

      const target = resetOnUnlock?.current ? 0 : scrollY;
      if (resetOnUnlock) resetOnUnlock.current = false;

      // Fixing the body collapses the document to viewport height, so the
      // scrollable range is 0 until layout is recalculated. Read a layout
      // property to force that reflow, otherwise the scroll below is clamped
      // to 0 and the user is thrown back to the top of the page.
      void document.body.offsetHeight;

      // "instant" rather than "auto": the page sets `scroll-behavior: smooth`,
      // and "auto" defers to that, which would animate the restore and leave
      // the user watching the page glide back to where they already were.
      window.scrollTo({ top: target, behavior: "instant" });
    };
  }, [locked, resetOnUnlock]);
}
