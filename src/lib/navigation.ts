import { NavigationTab } from "../types";

/**
 * Screens the navigation does not offer.
 *
 * The product is being narrowed to Becas, Guías and the assistant. These screens exist and
 * still compile — their components, data and tests are untouched — but
 * nothing links to them, so the navigation reflects what is actually
 * finished.
 *
 * Restoring one is deleting a line here. That is the whole point of the list
 * being in one place rather than repeated across the top bar, the drawer, the
 * bottom bar and the footer.
 */
export const HIDDEN_TABS: readonly NavigationTab[] = [
  "planificador",
  "calculadora",
  "voluntariados",
  "comunidad",
  "feedback",
  "mapa",
] as const;

/** Whether the navigation should offer this screen. */
export function isTabVisible(tab: NavigationTab): boolean {
  return !HIDDEN_TABS.includes(tab);
}
