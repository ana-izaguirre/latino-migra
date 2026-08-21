import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes, letting a later one beat an earlier one.
 *
 * `clsx` alone concatenates, so `cn("p-2", "p-6")` would emit both and leave
 * the winner to source order in the stylesheet. `tailwind-merge` resolves the
 * conflict by intent instead, which is what lets a caller override a variant's
 * padding or colour from the call site.
 *
 * This is the helper the shadcn/ui components expect, which is why it lives at
 * the path `components.json` points to.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
